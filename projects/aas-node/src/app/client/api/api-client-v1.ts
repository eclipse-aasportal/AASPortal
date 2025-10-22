/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import FormData from 'form-data';
import { createReadStream } from 'fs';
import { aas, AASEndpoint, ApplicationError, getIdShortPath, noop, PagedResult, selectSubmodel } from 'aas-core';

import { aasV2, encodeBase64Url, JsonReaderV2, JsonReaderV3, JsonWriterV2 } from 'aas-package';
import { ApiClient } from './api-client.js';
import { Logger } from '../../logging/logger.js';
import { ERRORS } from '../../errors.js';
import { HttpClient } from '../../http-client.js';

interface PackageDescriptor {
    aasIds: string[];
    packageId: string;
}

interface OperationRequest {
    inputArguments?: aasV2.OperationVariable[];
    inoutputArguments?: aasV2.OperationVariable[];
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
    inoutputArguments: aasV2.OperationVariable[];
    outputArguments: aasV2.OperationVariable[];
    requestId: string;
}

export class ApiClientV1 extends ApiClient {
    public constructor(logger: Logger, http: HttpClient, endpoint: AASEndpoint) {
        super(logger, http, endpoint);
    }

    public readonly readOnly = false;

    public readonly onlineReady = true;

    public async getShells(cursor?: string): Promise<PagedResult<string>> {
        const result = await this.http.get<aasV2.AssetAdministrationShell[]>(
            this.resolve('shells'),
            this.endpoint.headers,
        );

        noop(cursor);

        return {
            result: result.map(shell => shell.identification.id),
            paging_metadata: {},
        };
    }

    public override getThumbnail(id: string): Promise<NodeJS.ReadableStream> {
        return this.http.getResponse(
            this.resolve(`shells/${encodeBase64Url(id)}/asset-information/thumbnail`),
            this.endpoint.headers,
        );
    }

    public async getEnvironment(id: string): Promise<aas.Environment> {
        const shell = await this.http.get<aasV2.AssetAdministrationShell>(
            this.resolve(`shells/${encodeBase64Url(id)}`),
            this.endpoint.headers,
        );

        const submodels = await this.readSubmodels(shell);
        const conceptDescriptions = await this.readConceptDescriptions(submodels);

        const asset: aasV2.Asset = {
            kind: 'Instance',
            identification: { idType: shell.asset.keys[0].idType, id: shell.asset.keys[0].value },
            modelType: { name: 'Asset' },
            idShort: 'Asset',
        };

        const sourceEnv: aasV2.AssetAdministrationShellEnvironment = {
            assetAdministrationShells: [shell],
            assets: [asset],
            submodels,
            conceptDescriptions,
        };

        return new JsonReaderV2(sourceEnv).readEnvironment();
    }

    public setEnvironment(id: string, env: aas.Environment): Promise<void> {
        noop(id, env);
        return Promise.reject(new Error('Not implemented.'));
    }

    public async openRead(_: string, file: aas.File): Promise<NodeJS.ReadableStream> {
        const smId = encodeBase64Url(file.parent!.keys[0].value);
        const path = getIdShortPath(file);
        const url = this.resolve(`submodels/${smId}/submodel/submodel-elements/${path}/attachment`);
        return await this.http.getResponse(url, this.endpoint.headers);
    }

    public resolveNodeId(shell: aas.AssetAdministrationShell, nodeId: string): string {
        const aasId = encodeBase64Url(shell.id);
        const index = nodeId.indexOf('#');
        const smId = nodeId.substring(0, index);
        const idShortPath = nodeId.substring(index + 1);
        return this.resolve(`shells/${aasId}/aas/submodels/${smId}/submodel/submodel-elements/${idShortPath}`).href;
    }

    public async getPackage(aasIdentifier: string): Promise<NodeJS.ReadableStream> {
        const aasId = encodeBase64Url(aasIdentifier);
        const descriptors: PackageDescriptor[] = await this.http.get(
            this.resolve(`packages?aasId=${aasId}`),
            this.endpoint.headers,
        );

        const packageId = encodeBase64Url(descriptors[0].packageId);
        return await this.http.getResponse(this.resolve(`packages/${packageId}`), this.endpoint.headers);
    }

    public insertPackage(file: Express.Multer.File): Promise<string> {
        const formData = new FormData();
        formData.append('file', createReadStream(file.path));
        formData.append('fileName', file.filename);
        return this.http.post(this.resolve(`packages`), formData, this.endpoint.headers);
    }

    public async deletePackage(aasIdentifier: string): Promise<string> {
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
        const writer = new JsonWriterV2();
        const opr: aasV2.Operation = writer.convert(operation);
        const request: OperationRequest = {
            inputArguments: opr.inputVariable,
            inoutputArguments: opr.inoutputVariable,
            requestId: '1',
            timeout: 0,
        };

        const result: OperationResult = JSON.parse(
            await this.http.post(
                this.resolve(`shells/${aasId}/aas/submodels/${smId}/submodel/submodel-elements/${path}/invoke`),
                request,
                this.endpoint.headers,
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
        } as aasV2.Operation);
    }

    public async getBlobValue(
        env: aas.Environment,
        submodelId: string,
        idShortPath: string,
    ): Promise<string | undefined> {
        const smId = encodeBase64Url(submodelId);
        const blob = await this.http.get<aas.Blob>(
            this.resolve(`submodels/${smId}/submodel/submodel-elements/${idShortPath}/?extent=WithBlobValue`),
            this.endpoint.headers,
        );

        if (!blob) {
            throw new Error(`Blob element "${submodelId}.${idShortPath}" does not exist.`);
        }

        return blob.value;
    }

    private async readSubmodels(shell: aasV2.AssetAdministrationShell): Promise<aasV2.Submodel[]> {
        const submodels: aasV2.Submodel[] = [];
        if (shell.submodels) {
            for (const reference of shell.submodels) {
                const submodelId = encodeBase64Url(reference.keys[0].value);
                try {
                    submodels.push(
                        await this.http.get<aasV2.Submodel>(
                            this.resolve(`submodels/${submodelId}/submodel`),
                            this.endpoint.headers,
                        ),
                    );
                } catch (error) {
                    this.logger.error(`Unable to read Submodel "${reference.keys[0].value}": ${error?.message}`);
                }
            }
        }

        return submodels;
    }

    private async readConceptDescriptions(submodels: aasV2.Submodel[]): Promise<aasV2.ConceptDescription[]> {
        const conceptDescriptions: aasV2.ConceptDescription[] = [];
        for (const submodel of submodels) {
            for (const referable of this.traverse(submodel)) {
                const semanticId = this.getSemanticId(referable);
                if (!semanticId) {
                    continue;
                }

                try {
                    const conceptDescription = await this.http.get<aas.ConceptDescription>(
                        this.resolve(`concept-descriptions/${encodeBase64Url(semanticId)}`),
                        this.endpoint.headers,
                    );

                    if (this.isConceptDescription(conceptDescription)) {
                        conceptDescriptions.push(conceptDescription);
                    }
                } catch {
                    noop();
                }
            }
        }

        return conceptDescriptions;
    }

    private *traverse(root: aasV2.Referable): Generator<aasV2.Referable> {
        const stack: aasV2.Referable[][] = [];
        yield root;

        let children = this.getChildren(root);
        if (children.length > 0) {
            stack.push(children);
        }

        while (stack.length) {
            for (const child of stack.pop()!) {
                yield child;

                children = this.getChildren(child);
                if (children.length > 0) {
                    stack.push(children);
                }
            }
        }
    }

    private getSemanticId(value: aasV2.Referable): string | undefined {
        return (value as aasV2.HasSemantic)?.semanticId?.keys.at(0)?.value;
    }

    private isConceptDescription(referable: unknown): referable is aasV2.ConceptDescription {
        return (referable as aasV2.Referable)?.modelType.name === 'ConceptDescription';
    }

    private getChildren(parent: aasV2.Referable, env?: aasV2.AssetAdministrationShellEnvironment): aasV2.Referable[] {
        if (parent) {
            switch (parent.modelType.name) {
                case 'SubmodelElementCollection':
                    return (parent as aasV2.SubmodelElementCollection).value ?? [];
                case 'Submodel':
                    return (parent as aasV2.Submodel).submodelElements ?? [];
                case 'AssetAdministrationShell':
                    return env && env.submodels ? env.submodels : [];
                case 'Entity':
                    return (parent as aasV2.Entity).statements ?? [];
                case 'AnnotatedRelationshipElement':
                    return (parent as aasV2.AnnotatedRelationshipElement).annotation ?? [];
                case 'Operation':
                    return [
                        ...((parent as aasV2.Operation).inputVariable?.map(variable => variable.value) ?? []),
                        ...((parent as aasV2.Operation).inoutputVariable?.map(variable => variable.value) ?? []),
                        ...((parent as aasV2.Operation).outputVariable?.map(variable => variable.value) ?? []),
                    ];
            }
        }

        return [];
    }
}
