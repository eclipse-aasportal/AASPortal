/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import FormData from 'form-data';
import { cloneDeep } from 'lodash-es';
import { createReadStream } from 'fs';
import { encodeBase64Url } from '../../convert.js';
import { AasxServer } from './aasx-server.js';
import { Logger } from '../../logging/logger.js';
import { AASPackage } from '../aas-package.js';
import { JsonReader } from '../json-reader.js';
import { JsonWriter } from '../json-writer.js';
import {
    aas,
    ApplicationError,
    DifferenceItem,
    getIdShortPath,
    isAssetAdministrationShell,
    isSubmodel,
    isSubmodelElement,
    selectSubmodel
} from 'common';
import { ERRORS } from '../../errors.js';

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

interface PagedResultPagingMetadata {
    cursor?: string;
}

interface PagedResult<T extends aas.Identifiable> {
    result: T[];
    paging_metadata: PagedResultPagingMetadata;
}

export class AasxServerV3 extends AasxServer {
    constructor(logger: Logger, url: string | URL) {
        super(logger, url);
    }

    public readonly readOnly = false;

    public readonly onlineReady = true;

    public async getShellsAsync(): Promise<string[]> {
        const pagedResult = await this.message.get<PagedResult<aas.AssetAdministrationShell>>(
            this.resolve('/shells'));

        return pagedResult.result.map(shell => shell.id);
    }

    public async readEnvironmentAsync(id: string): Promise<aas.Environment> {
        const aasId = encodeBase64Url(id);
        const shell = await this.message.get<aas.AssetAdministrationShell>(
            this.resolve(`/shells/${aasId}`));

        const submodels: aas.Submodel[] = [];
        if (shell.submodels) {
            for (const reference of shell.submodels) {
                const submodelId = encodeBase64Url(reference.keys[0].value);
                try {
                    submodels.push(await this.message.get<aas.Submodel>(
                        this.resolve(`/submodels/${submodelId}`)));
                } catch (error) {
                    this.logger.error(`Unable to read Submodel "${reference.keys[0].value}": ${error?.message}`);
                }
            }
        }

        const pagedResult = await this.message.get<PagedResult<aas.ConceptDescription>>(
            this.resolve(`/concept-descriptions`));

        const sourceEnv: aas.Environment = {
            assetAdministrationShells: [shell],
            submodels,
            conceptDescriptions: pagedResult.result
        };

        return new JsonReader(this.logger, sourceEnv).readEnvironment();
    }

    public async commitAsync(
        source: aas.Environment,
        target: aas.Environment,
        diffs: DifferenceItem[]): Promise<string[]> {
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
                    messages.push(await this.putSubmodelElementAsync(submodel, diff.sourceElement as aas.SubmodelElement));
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

    public async openFileAsync(_: aas.AssetAdministrationShell, file: aas.File): Promise<NodeJS.ReadableStream> {
        const smId = encodeBase64Url(file.parent!.keys[0].value);
        const path = getIdShortPath(file);
        const url = this.resolve(`/submodels/${smId}/submodel-elements/${path}/attachment`);
        return await this.message.getResponse(url);
    }

    public resolveNodeId(shell: aas.AssetAdministrationShell, nodeId: string): string {
        const aasId = encodeBase64Url(shell.id);
        const items = nodeId.split('.');
        const path = items[1].split('/').slice(1).join('.');
        return this.resolve(`/shells/${aasId}/submodels/${items[0]}/submodel-elements/${path}`).href;
    }

    public async getPackageAsync(aasIdentifier: string): Promise<NodeJS.ReadableStream> {
        const aasId = encodeBase64Url(aasIdentifier);
        const descriptors: PackageDescriptor[] = await this.message.get(this.resolve(`/packages?aasId=${aasId}`));
        const packageId = encodeBase64Url(descriptors[0].packageId);
        return await this.message.getResponse(this.resolve(`/packages/${packageId}`));
    }

    public async postPackageAsync(file: Express.Multer.File): Promise<AASPackage | undefined> {
        const formData = new FormData();
        formData.append('file', createReadStream(file.path));
        formData.append('fileName', file.filename);
        await this.message.post(this.resolve(`/packages`), formData);
        return undefined;
    }

    public deletePackageAsync(aasIdentifier: string): Promise<void> {
        throw new Error('Not implemented.');
    }

    public async invoke(env: aas.Environment, operation: aas.Operation): Promise<aas.Operation> {
        if (!operation.parent) {
            throw new Error('Invalid operation.');
        }

        const aasId = encodeBase64Url(env.assetAdministrationShells[0].id);
        const smId = encodeBase64Url(selectSubmodel(env, operation)!.id);
        const path = getIdShortPath(operation);
        const request: OperationRequest = {
            inputVariables: cloneDeep(operation.inputVariables),
            inoutputVariables: cloneDeep(operation.inoutputVariables),
        };

        const result: OperationResult = await this.message.post(
            this.resolve(`/shells/${aasId}/submodels/${smId}/submodel-elements/${path}/invoke`),
            request);

        if (!result.success) {
            throw new ApplicationError(
                `Invoking the operation ${operation.idShort} failed: {0}`,
                ERRORS.InvokeOperationFailed,
                result.messages?.map(message => message.text).join(' ') ?? 'No messages.');
        }

        return { ...operation, outputVariables: result.outputVariables, inoutputVariables: result.inoutputVariables };
    }

    public async getBlobValueAsync(env: aas.Environment, submodelId: string, idShortPath: string): Promise<string | undefined> {
        const blob = await this.message.get<aas.Blob>(
            this.resolve(`/submodels/${submodelId}/submodel/submodel-elements/${idShortPath}/?extent=WithBlobValue`));

        if (!blob) {
            throw new Error(`Blob element "${submodelId}.${idShortPath}" does not exist.`)
        }

        return blob.value;
    }

    private async putShellAsync(shell: aas.AssetAdministrationShell): Promise<string> {
        const aasId = encodeBase64Url(shell.id);
        return await this.message.put(
            this.resolve(`/shells/${aasId}`),
            new JsonWriter().write(shell));
    }

    private async putSubmodelAsync(aasId: string, submodel: aas.Submodel): Promise<string> {
        const smId = encodeBase64Url(submodel.id);
        return await this.message.put(
            this.resolve(`/shells/${aasId}/aas/submodels/${smId}/submodel`),
            new JsonWriter().write(submodel));
    }

    private async postSubmodelAsync(aasId: string, submodel: aas.Submodel): Promise<string> {
        return await this.message.post(
            this.resolve(`/submodels?aasIdentifier=${aasId}`), new JsonWriter().write(submodel));
    }

    private async deleteSubmodelAsync(smId: string): Promise<string> {
        return await this.message.delete(this.resolve(`/submodels/${encodeBase64Url(smId)}`));
    }

    private async putSubmodelElementAsync(submodel: aas.Submodel, submodelElement: aas.SubmodelElement): Promise<string> {
        const smId = encodeBase64Url(submodel.id);
        const path = getIdShortPath(submodelElement);
        return await this.message.put(
            this.resolve(`/submodels/${smId}/submodel-elements/${path}`),
            new JsonWriter().write(submodelElement));
    }

    private async postSubmodelElementAsync(submodel: aas.Submodel, submodelElement: aas.SubmodelElement): Promise<string> {
        const smId = encodeBase64Url(submodel.id);
        const path = getIdShortPath(submodelElement);
        return await this.message.post(
            this.resolve(`/submodels/${smId}/submodel-elements/${path}`),
            new JsonWriter().write(submodelElement));
    }

    private async deleteSubmodelElementAsync(submodel: aas.Submodel, submodelElement: aas.SubmodelElement): Promise<string> {
        const smId = encodeBase64Url(submodel.id);
        const path = getIdShortPath(submodelElement);
        return await this.message.delete(
            this.resolve(`/submodels/${smId}/submodel/submodel-elements/${path}`));
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