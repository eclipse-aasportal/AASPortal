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
    ApplicationError,
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
import * as aasv2 from '../../types/aas-v2.js';
import { JsonReaderV2 } from '../json-reader-v2.js';
import { JsonWriterV2 } from '../json-writer-v2.js';
import { ERRORS } from '../../errors.js';
import { JsonReaderV3 } from '../json-reader-v3.js';

interface PackageDescriptor {
    aasIds: string[];
    packageId: string;
}

interface OperationRequest {
    inputArguments?: aasv2.OperationVariable[];
    inoutputArguments?: aasv2.OperationVariable[];
    requestId?: string;
    timeout?: number;
}

interface OperationResult {
    executionResult: {
        messages: [
            {
                code: string;
                messageType: number;
                text: string;
                timestamp: string;
            },
        ];
        success: boolean;
    };
    executionState: number;
    inoutputArguments: aasv2.OperationVariable[];
    outputArguments: aasv2.OperationVariable[];
    requestId: string;
}

export class AASApiClientV1 extends AASApiClient {
    public constructor(logger: Logger, url: string, name: string) {
        super(logger, url, name);
    }

    public override readonly version = 'v1';

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
                    submodels.push(
                        await this.message.get<aasv2.Submodel>(this.resolve(`submodels/${submodelId}/submodel`)),
                    );
                } catch (error) {
                    this.logger.error(`Unable to read Submodel "${reference.keys[0].value}": ${error?.message}`);
                }
            }
        }

        const conceptDescriptions = await this.message.get<aasv2.ConceptDescription[]>(
            this.resolve(`concept-descriptions`),
        );

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
            conceptDescriptions,
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
        const url = this.resolve(`submodels/${smId}/submodel/submodel-elements/${path}/attachment`);
        return await this.message.getResponse(url);
    }

    public resolveNodeId(shell: aas.AssetAdministrationShell, nodeId: string): string {
        const aasId = encodeBase64Url(shell.id);
        const items = nodeId.split('.');
        const path = items[1].split('/').slice(1).join('.');
        return this.resolve(`shells/${aasId}/submodels/${items[0]}/submodel/submodel-elements/${path}`).href;
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

    public async invoke(env: aas.Environment, operation: aas.Operation): Promise<aas.Operation> {
        if (!operation.parent) {
            throw new Error('Invalid operation.');
        }

        const aasId = encodeBase64Url(env.assetAdministrationShells[0].id);
        const smId = encodeBase64Url(selectSubmodel(env, operation)!.id);
        const path = getIdShortPath(operation);
        const writer = new JsonWriterV2();
        const opr: aasv2.Operation = writer.convert(operation);
        const request: OperationRequest = {
            inputArguments: opr.inputVariable,
            inoutputArguments: opr.inoutputVariable,
            requestId: '1',
            timeout: 0,
        };

        const result: OperationResult = JSON.parse(
            await this.message.post(
                this.resolve(`shells/${aasId}/aas/submodels/${smId}/submodel/submodel-elements/${path}/invoke`),
                request,
            ),
        );

        if (!result.executionResult.success) {
            throw new ApplicationError(
                `Invoking the operation ${operation.idShort} failed: {0}`,
                ERRORS.InvokeOperationFailed,
                result.executionResult.messages?.map(message => message.text).join(' ') ?? 'No messages.',
            );
        }

        const reader = new JsonReaderV3();
        return reader.read({
            ...opr,
            outputVariable: result.outputArguments,
            inoutputVariable: result.inoutputArguments,
        } as aasv2.Operation);
    }

    public async getBlobValueAsync(
        env: aas.Environment,
        submodelId: string,
        idShortPath: string,
    ): Promise<string | undefined> {
        const smId = encodeBase64Url(submodelId);
        const blob = await this.message.get<aas.Blob>(
            this.resolve(`submodels/${smId}/submodel/submodel-elements/${idShortPath}/?extent=WithBlobValue`),
        );

        if (!blob) {
            throw new Error(`Blob element "${submodelId}.${idShortPath}" does not exist.`);
        }

        return blob.value;
    }

    private async putShellAsync(shell: aas.AssetAdministrationShell): Promise<string> {
        const aasId = encodeBase64Url(shell.id);
        return await this.message.put(this.resolve(`shells/${aasId}`), new JsonWriterV2().convert(shell));
    }

    private async putSubmodelAsync(aasId: string, submodel: aas.Submodel): Promise<string> {
        const smId = encodeBase64Url(submodel.id);
        return await this.message.put(
            this.resolve(`shells/${aasId}/submodels/${smId}/submodel`),
            new JsonWriterV2().convert(submodel),
        );
    }

    private async postSubmodelAsync(aasId: string, submodel: aas.Submodel): Promise<string> {
        return await this.message.post(
            this.resolve(`submodels?aasIdentifier=${aasId}`),
            new JsonWriterV2().convert(submodel),
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
            this.resolve(`submodels/${smId}/submodel/submodel-elements/${path}`),
            new JsonWriterV2().convert(submodelElement),
        );
    }

    private async postSubmodelElementAsync(
        submodel: aas.Submodel,
        submodelElement: aas.SubmodelElement,
    ): Promise<string> {
        const smId = encodeBase64Url(submodel.id);
        const path = getIdShortPath(submodelElement);
        return await this.message.post(
            this.resolve(`submodels/${smId}/submodel/submodel-elements/${path}`),
            new JsonWriterV2().convert(submodelElement),
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
