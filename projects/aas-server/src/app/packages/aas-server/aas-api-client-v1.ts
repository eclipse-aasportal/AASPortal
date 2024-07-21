/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import FormData from 'form-data';
import { createReadStream } from 'fs';
import {
    aas,
    DifferenceItem,
    getIdShortPath,
    isAssetAdministrationShell,
    isSubmodel,
    isSubmodelElement,
    selectSubmodel,
} from 'aas-core';

import { encodeBase64Url } from '../../convert.js';
import { AASApiClient } from './aas-api-client.js';
import { Logger } from '../../logging/logger.js';
import { JsonWriter } from '../json-writer.js';
import * as aasv2 from '../../types/aas-v2.js';
import { JsonReaderV2 } from '../json-reader-v2.js';

interface PackageDescriptor {
    aasIds: string[];
    packageId: string;
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
    outputVariables?: aasv2.OperationVariable[];
    inoutputVariables?: aasv2.OperationVariable[];
}

export class AASApiClientV1 extends AASApiClient {
    public constructor(logger: Logger, url: string, name: string) {
        super(logger, url, name);
    }

    public override readonly version = 'v3';

    public readonly readOnly = false;

    public readonly onlineReady = true;

    public async getShellsAsync(): Promise<string[]> {
        const result = await this.message.get<aasv2.AssetAdministrationShell[]>(this.resolve('shells'));
        return result.map(shell => shell.identification.id);
    }

    public async readEnvironmentAsync(id: string): Promise<aas.Environment> {
        const aasId = encodeBase64Url(id);
        const shell = await this.message.get<aasv2.AssetAdministrationShell>(this.resolve(`shells/${aasId}`));
        const submodels: aasv2.Submodel[] = [];
        if (shell.submodels) {
            for (const reference of shell.submodels) {
                const submodelId = encodeBase64Url(reference.keys[0].value);
                try {
                    submodels.push(await this.message.get<aasv2.Submodel>(this.resolve(`submodels/${submodelId}`)));
                } catch (error) {
                    this.logger.error(`Unable to read Submodel "${reference.keys[0].value}": ${error?.message}`);
                }
            }
        }

        const result = await this.message.get<aasv2.ConceptDescription[]>(this.resolve(`concept-descriptions`));
        const asset: aasv2.Asset = {
            kind: 'Instance',
            identification: { idType: shell.asset.keys[0].idType, id: shell.asset.keys[0].value },
            modelType: { name: 'Asset' },
            idShort: 'Asset',
        };

        const sourceEnv: aasv2.AssetAdministrationShellEnvironment = {
            assetAdministrationShells: [shell],
            assets: [asset],
            submodels,
            conceptDescriptions: result,
        };

        return new JsonReaderV2(sourceEnv).readEnvironment();
    }

    public override getThumbnailAsync(id: string): Promise<NodeJS.ReadableStream> {
        return this.message.getResponse(this.resolve(`shells/${encodeBase64Url(id)}/asset-information/thumbnail`));
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

    public async openFileAsync(_: aas.AssetAdministrationShell, file: aas.File): Promise<NodeJS.ReadableStream> {
        const smId = encodeBase64Url(file.parent!.keys[0].value);
        const path = getIdShortPath(file);
        const url = this.resolve(`submodels/${smId}/submodel-elements/${path}/attachment`);
        return await this.message.getResponse(url);
    }

    public resolveNodeId(shell: aas.AssetAdministrationShell, nodeId: string): string {
        const aasId = encodeBase64Url(shell.id);
        const items = nodeId.split('.');
        const path = items[1].split('/').slice(1).join('.');
        return this.resolve(`shells/${aasId}/submodels/${items[0]}/submodel-elements/${path}`).href;
    }

    public async getPackageAsync(aasIdentifier: string): Promise<NodeJS.ReadableStream> {
        const aasId = encodeBase64Url(aasIdentifier);
        const descriptors: PackageDescriptor[] = await this.message.get(this.resolve(`packages?aasId=${aasId}`));
        const packageId = encodeBase64Url(descriptors[0].packageId);
        return await this.message.getResponse(this.resolve(`packages/${packageId}`));
    }

    public postPackageAsync(file: Express.Multer.File): Promise<string> {
        const formData = new FormData();
        formData.append('file', createReadStream(file.path));
        formData.append('fileName', file.filename);
        return this.message.post(this.resolve(`packages`), formData);
    }

    public async deletePackageAsync(aasIdentifier: string): Promise<string> {
        const aasId = encodeBase64Url(aasIdentifier);
        const descriptors: PackageDescriptor[] = await this.message.get(this.resolve(`packages?aasId=${aasId}`));
        const packageId = encodeBase64Url(descriptors[0].packageId);
        return await this.message.delete(this.resolve(`packages/${packageId}`));
    }

    public async invoke(): Promise<aas.Operation> {
        throw new Error('Not implemented.');
    }

    public async getBlobValueAsync(
        env: aas.Environment,
        submodelId: string,
        idShortPath: string,
    ): Promise<string | undefined> {
        const blob = await this.message.get<aas.Blob>(
            this.resolve(`submodels/${submodelId}/submodel-elements/${idShortPath}/?extent=WithBlobValue`),
        );

        if (!blob) {
            throw new Error(`Blob element "${submodelId}.${idShortPath}" does not exist.`);
        }

        return blob.value;
    }

    private async putShellAsync(shell: aas.AssetAdministrationShell): Promise<string> {
        const aasId = encodeBase64Url(shell.id);
        return await this.message.put(this.resolve(`shells/${aasId}`), new JsonWriter().convert(shell));
    }

    private async putSubmodelAsync(aasId: string, submodel: aas.Submodel): Promise<string> {
        const smId = encodeBase64Url(submodel.id);
        return await this.message.put(
            this.resolve(`shells/${aasId}/submodels/${smId}`),
            new JsonWriter().convert(submodel),
        );
    }

    private async postSubmodelAsync(aasId: string, submodel: aas.Submodel): Promise<string> {
        return await this.message.post(
            this.resolve(`submodels?aasIdentifier=${aasId}`),
            new JsonWriter().convert(submodel),
        );
    }

    private async deleteSubmodelAsync(smId: string): Promise<string> {
        return await this.message.delete(this.resolve(`submodels/${encodeBase64Url(smId)}`));
    }

    private async putSubmodelElementAsync(
        submodel: aas.Submodel,
        submodelElement: aas.SubmodelElement,
    ): Promise<string> {
        const smId = encodeBase64Url(submodel.id);
        const path = getIdShortPath(submodelElement);
        return await this.message.put(
            this.resolve(`submodels/${smId}/submodel-elements/${path}`),
            new JsonWriter().convert(submodelElement),
        );
    }

    private async postSubmodelElementAsync(
        submodel: aas.Submodel,
        submodelElement: aas.SubmodelElement,
    ): Promise<string> {
        const smId = encodeBase64Url(submodel.id);
        const path = getIdShortPath(submodelElement);
        return await this.message.post(
            this.resolve(`submodels/${smId}/submodel-elements/${path}`),
            new JsonWriter().convert(submodelElement),
        );
    }

    private async deleteSubmodelElementAsync(
        submodel: aas.Submodel,
        submodelElement: aas.SubmodelElement,
    ): Promise<string> {
        const smId = encodeBase64Url(submodel.id);
        const path = getIdShortPath(submodelElement);
        return await this.message.delete(this.resolve(`submodels/${smId}/submodel-elements/${path}`));
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
