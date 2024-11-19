/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import FormData from 'form-data';
import cloneDeep from 'lodash-es/cloneDeep.js';
import { createReadStream } from 'fs';
import {
    aas,
    AASEndpoint,
    ApplicationError,
    DifferenceItem,
    getIdShortPath,
    isAssetAdministrationShell,
    isSubmodel,
    isSubmodelElement,
    selectSubmodel,
} from 'aas-core';

import { encodeBase64Url } from '../../convert.js';
import { AASApiClient, AASLabel } from './aas-api-client.js';
import { Logger } from '../../logging/logger.js';
import { JsonReaderV3 } from '../json-reader-v3.js';
import { JsonWriterV3 } from '../json-writer-v3.js';
import { ERRORS } from '../../errors.js';
import { HttpClient } from '../../http-client.js';
import { PagedResult } from '../../types/paged-result.js';

interface PackageDescriptor {
    aasIds: string[];
    packageId: string;
}

interface OperationRequest {
    inputVariables?: aas.OperationVariable[];
    inoutputVariables?: aas.OperationVariable[];
    clientTimeoutDuration?: string;
}

export interface Message {
    code?: string;
    correlationId?: string;
    messageType: 'Undefined' | 'Info' | 'Warning' | 'Error' | 'Exception';
    text: string;
    timeStamp?: string;
}

export interface OperationResult {
    messages?: Message[];
    executionState: 'Initiated' | 'Running' | 'Completed' | 'Canceled' | 'Failed' | 'Timeout';
    success: boolean;
    outputVariables?: aas.OperationVariable[];
    inoutputVariables?: aas.OperationVariable[];
}

export class AASApiClientV3 extends AASApiClient {
    public constructor(logger: Logger, http: HttpClient, endpoint: AASEndpoint) {
        super(logger, http, endpoint);
    }

    public readonly readOnly = false;

    public readonly onlineReady = true;

    public async getShellsAsync(cursor?: string): Promise<PagedResult<AASLabel>> {
        const searchParams: Record<string, string | number> = { limit: 100 };
        if (cursor) {
            searchParams.cursor = cursor;
        }

        const result = await this.http.get<PagedResult<aas.AssetAdministrationShell>>(
            this.resolve('shells', searchParams),
            this.endpoint.headers,
        );

        return {
            result: result.result.map(shell => ({ id: shell.id, idShort: shell.idShort })),
            paging_metadata: { cursor: result.paging_metadata.cursor },
        };
    }

    public async readEnvironmentAsync(id: AASLabel): Promise<aas.Environment> {
        const aasId = encodeBase64Url(id.id);
        const shell = await this.http.get<aas.AssetAdministrationShell>(
            this.resolve(`shells/${aasId}`),
            this.endpoint.headers,
        );

        const env: aas.Environment = {
            assetAdministrationShells: [shell],
            submodels: await this.readSubmodels(aasId, shell.submodels),
            conceptDescriptions: [],
        };

        return new JsonReaderV3(env).readEnvironment();
    }

    public async readConceptDescriptionsAsync(): Promise<aas.ConceptDescription[]> {
        const conceptDescriptions: aas.ConceptDescription[] = [];
        let cursor: string | undefined;
        const searchParams: Record<string, string | number> = { limit: 100 };
        do {
            if (cursor) {
                searchParams.cursor = cursor;
            }

            const pagedResult = await this.http.get<PagedResult<aas.ConceptDescription>>(
                this.resolve(`concept-descriptions`),
                this.endpoint.headers,
            );

            conceptDescriptions.push(...pagedResult.result);
            cursor = pagedResult.paging_metadata.cursor;
        } while (cursor);

        return conceptDescriptions;
    }

    public override getThumbnailAsync(id: string): Promise<NodeJS.ReadableStream> {
        return this.http.getResponse(
            this.resolve(`shells/${encodeBase64Url(id)}/asset-information/thumbnail`),
            this.endpoint.headers,
        );
    }

    public async commitAsync(
        source: aas.Environment,
        target: aas.Environment,
        diffs: DifferenceItem[],
    ): Promise<string[]> {
        const messages: string[] = [];
        const aasId = encodeBase64Url(target.assetAdministrationShells[0].id);
        for (const diff of diffs) {
            if (diff.type === 'inserted') {
                if (isSubmodel(diff.sourceElement)) {
                    messages.push(await this.postSubmodelAsync(aasId, diff.sourceElement));
                } else if (isSubmodelElement(diff.sourceElement)) {
                    const submodel = this.getSubmodel(target, diff.destinationParent);
                    messages.push(await this.postSubmodelElementAsync(submodel, diff.sourceElement));
                } else {
                    throw new Error(`Inserting "${diff?.sourceElement?.modelType}" is not implemented.`);
                }
            } else if (diff.type === 'changed') {
                if (isSubmodel(diff.sourceElement)) {
                    messages.push(await this.putSubmodelAsync(aasId, diff.sourceElement));
                } else if (isSubmodelElement(diff.sourceElement)) {
                    const submodel = this.getSubmodel(target, diff.destinationElement);
                    messages.push(
                        await this.putSubmodelElementAsync(submodel, diff.sourceElement as aas.SubmodelElement),
                    );
                } else if (isAssetAdministrationShell(diff.sourceElement)) {
                    messages.push(await this.putShellAsync(diff.sourceElement));
                } else {
                    throw new Error(`Updating "${diff?.sourceElement?.modelType}" is not implemented.`);
                }
            } else if (diff.type === 'deleted') {
                if (isSubmodel(diff.destinationElement)) {
                    messages.push(await this.deleteSubmodelAsync(diff.destinationElement.id));
                } else if (isSubmodelElement(diff.destinationElement)) {
                    const submodel = this.getSubmodel(target, diff.destinationParent);
                    messages.push(await this.deleteSubmodelElementAsync(submodel, diff.destinationElement));
                } else {
                    throw new Error(`Deleting "${diff?.destinationElement?.modelType}" is not implemented.`);
                }
            }
        }

        return messages;
    }

    public async openFileAsync(shell: aas.AssetAdministrationShell, file: aas.File): Promise<NodeJS.ReadableStream> {
        const aasId = encodeBase64Url(shell.id);
        const smId = encodeBase64Url(file.parent!.keys[0].value);
        const path = getIdShortPath(file);
        const url = this.resolve(`shells/${aasId}/submodels/${smId}/submodel-elements/${path}/attachment`);
        return await this.http.getResponse(url, this.endpoint.headers);
    }

    public resolveNodeId(shell: aas.AssetAdministrationShell, nodeId: string): string {
        const aasId = encodeBase64Url(shell.id);
        const items = nodeId.split('.');
        const path = items[1].split('/').slice(1).join('.');
        return this.resolve(`shells/${aasId}/submodels/${items[0]}/submodel-elements/${path}`).href;
    }

    public async getPackageAsync(aasIdentifier: string): Promise<NodeJS.ReadableStream> {
        const aasId = encodeBase64Url(aasIdentifier);
        const result: PagedResult<PackageDescriptor> = await this.http.get(
            this.resolve(`packages?aasId=${aasId}`),
            this.endpoint.headers,
        );

        const packageId = encodeBase64Url(result.result[0].packageId);
        return await this.http.getResponse(this.resolve(`packages/${packageId}`), this.endpoint.headers);
    }

    public postPackageAsync(file: Express.Multer.File): Promise<string> {
        const formData = new FormData();
        formData.append('file', createReadStream(file.path));
        formData.append('fileName', file.filename);
        return this.http.post(this.resolve(`packages`), formData, this.endpoint.headers);
    }

    public async deletePackageAsync(aasIdentifier: string): Promise<string> {
        const aasId = encodeBase64Url(aasIdentifier);
        const descriptors: PackageDescriptor[] = await this.http.get(
            this.resolve(`packages?aasId=${aasId}`),
            this.endpoint.headers,
        );

        const packageId = encodeBase64Url(descriptors[0].packageId);
        return await this.http.delete(this.resolve(`packages/${packageId}`), this.endpoint.headers);
    }

    public async invoke(env: aas.Environment, operation: aas.Operation): Promise<aas.Operation> {
        if (!operation.parent) {
            throw new Error('Invalid operation.');
        }

        const aasId = encodeBase64Url(env.assetAdministrationShells[0].id);
        const smId = encodeBase64Url(selectSubmodel(env, operation)!.id);
        const path = getIdShortPath(operation);
        const request: OperationRequest = {};

        if (operation.inputVariables) {
            request.inputVariables = cloneDeep(operation.inputVariables);
        }

        if (operation.inoutputVariables) {
            request.inoutputVariables = cloneDeep(operation.inoutputVariables);
        }

        const result: OperationResult = JSON.parse(
            await this.http.post(
                this.resolve(`shells/${aasId}/submodels/${smId}/submodel-elements/${path}/invoke`),
                request,
                this.endpoint.headers,
            ),
        );

        if (!result.success) {
            throw new ApplicationError(
                `Invoking the operation ${operation.idShort} failed: {0}`,
                ERRORS.InvokeOperationFailed,
                result.messages?.map(message => message.text).join(' ') ?? 'No messages.',
            );
        }

        return { ...operation, outputVariables: result.outputVariables, inoutputVariables: result.inoutputVariables };
    }

    public async getBlobValueAsync(
        env: aas.Environment,
        submodelId: string,
        idShortPath: string,
    ): Promise<string | undefined> {
        const blob = await this.http.get<aas.Blob>(
            this.resolve(`submodels/${submodelId}/submodel-elements/${idShortPath}/?extent=WithBlobValue`),
            this.endpoint.headers,
        );

        if (!blob) {
            throw new Error(`Blob element "${submodelId}.${idShortPath}" does not exist.`);
        }

        return blob.value;
    }

    private async readSubmodels(aasId: string, submodelRefs: aas.Reference[] | undefined): Promise<aas.Submodel[]> {
        const submodels: aas.Submodel[] = [];
        if (submodelRefs === undefined) {
            return submodels;
        }

        for (const reference of submodelRefs) {
            const smId = encodeBase64Url(reference.keys[0].value);
            try {
                submodels.push(
                    await this.http.get<aas.Submodel>(
                        this.resolve(`shells/${aasId}/submodels/${smId}`),
                        this.endpoint.headers,
                    ),
                );
            } catch (error) {
                this.logger.error(`Unable to read Submodel "${reference.keys[0].value}": ${error?.message}`);
            }
        }

        return submodels;
    }

    private async putShellAsync(shell: aas.AssetAdministrationShell): Promise<string> {
        const aasId = encodeBase64Url(shell.id);
        return await this.http.put(this.resolve(`shells/${aasId}`), new JsonWriterV3().convert(shell));
    }

    private async putSubmodelAsync(aasId: string, submodel: aas.Submodel): Promise<string> {
        const smId = encodeBase64Url(submodel.id);
        return await this.http.put(
            this.resolve(`shells/${aasId}/submodels/${smId}`),
            new JsonWriterV3().convert(submodel),
            this.endpoint.headers,
        );
    }

    private async postSubmodelAsync(aasId: string, submodel: aas.Submodel): Promise<string> {
        return await this.http.post(
            this.resolve(`submodels?aasIdentifier=${aasId}`),
            new JsonWriterV3().convert(submodel),
            this.endpoint.headers,
        );
    }

    private async deleteSubmodelAsync(smId: string): Promise<string> {
        return await this.http.delete(this.resolve(`submodels/${encodeBase64Url(smId)}`), this.endpoint.headers);
    }

    private async putSubmodelElementAsync(
        submodel: aas.Submodel,
        submodelElement: aas.SubmodelElement,
    ): Promise<string> {
        const smId = encodeBase64Url(submodel.id);
        const path = getIdShortPath(submodelElement);
        return await this.http.put(
            this.resolve(`submodels/${smId}/submodel-elements/${path}`),
            new JsonWriterV3().convert(submodelElement),
            this.endpoint.headers,
        );
    }

    private async postSubmodelElementAsync(
        submodel: aas.Submodel,
        submodelElement: aas.SubmodelElement,
    ): Promise<string> {
        const smId = encodeBase64Url(submodel.id);
        const path = getIdShortPath(submodelElement);
        return await this.http.post(
            this.resolve(`submodels/${smId}/submodel-elements/${path}`),
            new JsonWriterV3().convert(submodelElement),
            this.endpoint.headers,
        );
    }

    private async deleteSubmodelElementAsync(
        submodel: aas.Submodel,
        submodelElement: aas.SubmodelElement,
    ): Promise<string> {
        const smId = encodeBase64Url(submodel.id);
        const path = getIdShortPath(submodelElement);
        return await this.http.delete(
            this.resolve(`submodels/${smId}/submodel-elements/${path}`),
            this.endpoint.headers,
        );
    }

    private getSubmodel(env: aas.Environment, referable?: aas.Referable): aas.Submodel {
        if (!referable) {
            throw new Error('Argument undefined.');
        }

        const submodel = selectSubmodel(env, referable);
        if (!submodel) {
            throw new Error('Invalid operation.');
        }

        return submodel;
    }
}
