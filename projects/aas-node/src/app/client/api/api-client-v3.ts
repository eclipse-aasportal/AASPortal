/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import FormData from 'form-data';
import cloneDeep from 'lodash-es/cloneDeep.js';
import fs from 'fs';
import { encodeBase64Url, JsonReaderV3, JsonWriterV3 } from 'aas-package';
import {
    aas,
    AASEndpoint,
    ApplicationError,
    getIdShortPath,
    selectSubmodel,
    noop,
    isConceptDescription,
    traverse,
    getSemanticId,
    PagedResult,
} from 'aas-core';

import { ApiClient } from './api-client.js';
import { Logger } from '../../logging/logger.js';
import { ERRORS } from '../../errors.js';
import { HttpClient } from '../../http-client.js';

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

export class ApiClientV3 extends ApiClient {
    public constructor(logger: Logger, http: HttpClient, endpoint: AASEndpoint) {
        super(logger, http, endpoint);
    }

    public readonly readOnly = false;

    public readonly onlineReady = true;

    public override async test(): Promise<void> {
        await this.http.get<PagedResult<aas.AssetAdministrationShell>>(
            this.resolve('shells', { limit: 10 }),
            this.endpoint.headers,
        );
    }

    public override async getShells(cursor?: string): Promise<PagedResult<string>> {
        const searchParams: Record<string, string | number> = { limit: 100 };
        if (cursor) {
            searchParams.cursor = cursor;
        }

        const result = await this.http.get<PagedResult<aas.AssetAdministrationShell>>(
            this.resolve('shells', searchParams),
            this.endpoint.headers,
        );

        this.logger.info(`getShells for endpoint "${this.endpoint.name}": returned ${result.result.length} AAS, cursor=${result.paging_metadata.cursor || 'none'}`);

        return {
            result: result.result.map(shell => shell.id),
            paging_metadata: { cursor: result.paging_metadata.cursor },
        };
    }

    public override getThumbnail(id: string): Promise<NodeJS.ReadableStream> {
        return this.http.getResponse(
            this.resolve(`shells/${encodeBase64Url(id)}/asset-information/thumbnail`),
            this.endpoint.headers,
        );
    }

    public override async getEnvironment(id: string): Promise<aas.Environment> {
        const shell = await this.http.get<aas.AssetAdministrationShell>(
            this.resolve(`shells/${encodeBase64Url(id)}`),
            this.endpoint.headers,
        );

        const submodels = await this.readSubmodels(id, shell.submodels);
        const conceptDescriptions = await this.readConceptDescriptions(submodels);
        const env: aas.Environment = {
            assetAdministrationShells: [shell],
            submodels,
            conceptDescriptions,
        };

        return new JsonReaderV3(env, true).readEnvironment();
    }

    public override async setEnvironment(id: string, env: aas.Environment): Promise<void> {
        for (const conceptDescription of env.conceptDescriptions) {
            if (await this.hasConceptDescription(conceptDescription)) {
                await this.putConceptDescription(conceptDescription);
            } else {
                await this.postConceptDescription(conceptDescription);
            }
        }

        for (const submodel of env.submodels) {
            if (await this.hasSubmodel(id, submodel)) {
                await this.putSubmodel(id, submodel);
            } else {
                await this.postSubmodel(id, submodel);
            }
        }

        for (const aas of env.assetAdministrationShells) {
            if (await this.hasShell(aas)) {
                await this.putShell(aas);
            } else {
                await this.postShell(aas);
            }
        }
    }

    public override async openRead(id: string, file: aas.File): Promise<NodeJS.ReadableStream> {
        const aasId = encodeBase64Url(id);
        const smId = encodeBase64Url(file.parent!.keys[0].value);
        const path = getIdShortPath(file);
        const url = this.resolve(`shells/${aasId}/submodels/${smId}/submodel-elements/${path}/attachment`);
        return await this.http.getResponse(url, this.endpoint.headers);
    }

    public override resolveNodeId(shell: aas.AssetAdministrationShell, nodeId: string): string {
        const aasId = encodeBase64Url(shell.id);
        const index = nodeId.indexOf('#');
        const smId = nodeId.substring(0, index);
        const idShortPath = nodeId.substring(index + 1);
        return this.resolve(`shells/${aasId}/submodels/${smId}/submodel-elements/${idShortPath}`).href;
    }

    public override async getPackage(aasId: string): Promise<NodeJS.ReadableStream> {
        const result: PagedResult<PackageDescriptor> = await this.http.get(
            this.resolve(`packages?aasId=${encodeBase64Url(aasId)}`),
            this.endpoint.headers,
        );

        const packageId = encodeBase64Url(result.result[0].packageId);
        return await this.http.getResponse(this.resolve(`packages/${packageId}`), this.endpoint.headers);
    }

    public override async insertPackage(file: string): Promise<void> {
        const formData = new FormData();
        formData.append('file', fs.createReadStream(file));
        await this.http.post(this.resolve(`packages`), formData, this.endpoint.headers);
    }

    public override async deletePackage(aasId: string): Promise<void> {
        const result: PagedResult<PackageDescriptor> = await this.http.get(
            this.resolve(`packages?aasId=${encodeBase64Url(aasId)}`),
            this.endpoint.headers,
        );

        const packageId = encodeBase64Url(result.result[0].packageId);
        await this.http.delete(this.resolve(`packages/${packageId}`), this.endpoint.headers);
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
            throw new ApplicationError(ERRORS.InvokeOperationFailed, {
                idShort: operation.idShort,
                message: result.messages?.map(message => message.text).join(' '),
            });
        }

        return { ...operation, outputVariables: result.outputVariables, inoutputVariables: result.inoutputVariables };
    }

    public async getBlobValue(
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
            try {
                // Try nested path first (standard pattern)
                try {
                    submodels.push(
                        await this.http.get<aas.Submodel>(
                            this.resolve(
                                `shells/${encodeBase64Url(aasId)}/submodels/${encodeBase64Url(reference.keys[0].value)}`,
                            ),
                            this.endpoint.headers,
                        ),
                    );
                } catch (nestedError) {
                    // Fall back to repository pattern (BaSyx)
                    submodels.push(
                        await this.http.get<aas.Submodel>(
                            this.resolve(
                                `submodels/${encodeBase64Url(reference.keys[0].value)}`,
                            ),
                            this.endpoint.headers,
                        ),
                    );
                }
            } catch (error) {
                this.logger.error(`Unable to read Submodel "${reference.keys[0].value}": ${error?.message}`);
            }
        }

        return submodels;
    }

    private async readConceptDescriptions(submodels: aas.Submodel[]): Promise<aas.ConceptDescription[]> {
        const conceptDescriptions: aas.ConceptDescription[] = [];
        for (const submodel of submodels) {
            for (const referable of traverse(submodel)) {
                const semanticId = getSemanticId(referable);
                if (!semanticId) {
                    continue;
                }

                try {
                    const conceptDescription = await this.http.get<aas.ConceptDescription>(
                        this.resolve(`concept-descriptions/${encodeBase64Url(semanticId)}`),
                        this.endpoint.headers,
                    );

                    if (isConceptDescription(conceptDescription)) {
                        conceptDescriptions.push(conceptDescription);
                    }
                } catch {
                    noop();
                }
            }
        }

        return conceptDescriptions;
    }

    private async hasShell(shell: aas.AssetAdministrationShell): Promise<boolean> {
        try {
            return (
                (await this.http.get<aas.AssetAdministrationShell>(
                    this.resolve(`shells/${encodeBase64Url(shell.id)}`),
                    this.endpoint.headers,
                )) !== undefined
            );
        } catch {
            return false;
        }
    }

    private async putShell(shell: aas.AssetAdministrationShell): Promise<string> {
        const aasId = encodeBase64Url(shell.id);
        return await this.http.put(
            this.resolve(`shells/${aasId}`),
            new JsonWriterV3().convert(shell),
            this.endpoint.headers,
        );
    }

    private async postShell(shell: aas.AssetAdministrationShell): Promise<string> {
        return await this.http.post(this.resolve(`shells`), new JsonWriterV3().convert(shell), this.endpoint.headers);
    }

    private async hasSubmodel(aasId: string, submodel: aas.Submodel): Promise<boolean> {
        try {
            // Try nested path first (standard pattern)
            return (
                (await this.http.put(
                    this.resolve(`shells/${encodeBase64Url(aasId)}/submodels/${encodeBase64Url(submodel.id)}`),
                    new JsonWriterV3().convert(submodel),
                    this.endpoint.headers,
                )) !== undefined
            );
        } catch (nestedError) {
            // Fall back to repository pattern (BaSyx)
            try {
                return (
                    (await this.http.put(
                        this.resolve(`submodels/${encodeBase64Url(submodel.id)}`),
                        new JsonWriterV3().convert(submodel),
                        this.endpoint.headers,
                    )) !== undefined
                );
            } catch {
                return false;
            }
        }
    }

    private async putSubmodel(aasId: string, submodel: aas.Submodel): Promise<void> {
        try {
            // Try nested path first (standard pattern)
            await this.http.put(
                this.resolve(`shells/${encodeBase64Url(aasId)}/submodels/${encodeBase64Url(submodel.id)}`),
                new JsonWriterV3().convert(submodel),
                this.endpoint.headers,
            );
        } catch (nestedError) {
            // Fall back to repository pattern (BaSyx)
            await this.http.put(
                this.resolve(`submodels/${encodeBase64Url(submodel.id)}`),
                new JsonWriterV3().convert(submodel),
                this.endpoint.headers,
            );
        }
    }

    private async postSubmodel(aasId: string, submodel: aas.Submodel): Promise<void> {
        try {
            // Try nested path first (standard pattern)
            await this.http.post(
                this.resolve(`shells/${encodeBase64Url(aasId)}/submodels/`),
                new JsonWriterV3().convert(submodel),
                this.endpoint.headers,
            );
        } catch (nestedError) {
            // Fall back to repository pattern (BaSyx)
            await this.http.post(
                this.resolve(`submodels/`),
                new JsonWriterV3().convert(submodel),
                this.endpoint.headers,
            );
        }
    }

    private async hasConceptDescription(conceptDescription: aas.ConceptDescription): Promise<boolean> {
        try {
            return (
                (await this.http.put(
                    this.resolve(`concept-descriptions/${encodeBase64Url(conceptDescription.id)}`),
                    new JsonWriterV3().convert(conceptDescription),
                    this.endpoint.headers,
                )) !== undefined
            );
        } catch {
            return false;
        }
    }

    private async putConceptDescription(conceptDescription: aas.ConceptDescription): Promise<void> {
        await this.http.put(
            this.resolve(`concept-descriptions/${encodeBase64Url(conceptDescription.id)}`),
            new JsonWriterV3().convert(conceptDescription),
            this.endpoint.headers,
        );
    }

    private async postConceptDescription(conceptDescription: aas.ConceptDescription): Promise<void> {
        await this.http.post(
            this.resolve(`concept-descriptions`),
            new JsonWriterV3().convert(conceptDescription),
            this.endpoint.headers,
        );
    }
}
