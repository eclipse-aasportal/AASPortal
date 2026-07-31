/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import fs from 'fs';
import { basename } from 'path';

import { aas, AASDocument, AASEndpoint, ApplicationError, noop, PagedResult } from 'aas-core';
import { aasV2, encodeBase64Url, JsonReaderV2, JsonReaderV3, JsonWriterV2, Logger } from 'aas-package';

import { ApiClient } from './api-client.js';
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
    public constructor(
        logger: Logger,
        endpoint: AASEndpoint,
        auth: Record<string, string> | undefined,
        http: HttpClient,
    ) {
        super(logger, endpoint, auth, http);
    }

    public static readonly version = '^1.0.0';

    public override readonly readOnly = false;

    public override readonly providesLiveData = true;

    public override async hasDocument(address: string): Promise<boolean> {
        try {
            const shell = await this.http.get<aasV2.AssetAdministrationShell>(
                this.resolve(`shells/${encodeBase64Url(address)}`),
                this.auth,
            );

            return !!shell;
        } catch {
            return false;
        }
    }

    public async getDocuments(cursor?: string): Promise<PagedResult<AASDocument>> {
        noop(cursor);
        const result = await this.http.get<aasV2.AssetAdministrationShell[]>(this.resolve('shells'), this.auth);

        return {
            result: result.map(shell => this.toDocument(shell)),
            paging_metadata: {},
        };
    }

    public getSubmodels(cursor: string | undefined): Promise<PagedResult<aas.Submodel>> {
        noop(cursor);
        throw new Error('Method not implemented.');
    }

    public override getThumbnail(id: string): Promise<NodeJS.ReadableStream> {
        return this.http.getReadable(
            this.resolve(`shells/${encodeBase64Url(id)}/asset-information/thumbnail`),
            this.auth,
        );
    }

    public override async getEnvironment(id: string): Promise<aas.Environment> {
        const shell = await this.http.get<aasV2.AssetAdministrationShell>(
            this.resolve(`shells/${encodeBase64Url(id)}`),
            this.auth,
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

        return new JsonReaderV2(sourceEnv, true).readEnvironment();
    }

    public override setEnvironment(id: string, env: aas.Environment): Promise<void> {
        noop(id, env);
        return Promise.reject(new Error('Not implemented.'));
    }

    public override async getFile(_: string, file: aas.File): Promise<NodeJS.ReadableStream> {
        if (!file.path) {
            throw new Error('Invalid argument "file".');
        }

        const smId = encodeBase64Url(file.path.id);
        const path = file.path.idShortPath;
        const url = this.resolve(`submodels/${smId}/submodel/submodel-elements/${path}/attachment`);
        return await this.http.getReadable(url, this.auth);
    }

    public override resolveNodeId(shell: aas.AssetAdministrationShell, nodeId: string): string {
        const aasId = encodeBase64Url(shell.id);
        const index = nodeId.indexOf('#');
        const smId = nodeId.substring(0, index);
        const idShortPath = nodeId.substring(index + 1);
        return this.resolve(`shells/${aasId}/aas/submodels/${smId}/submodel/submodel-elements/${idShortPath}`).href;
    }

    public override async getPackage(aasIdentifier: string): Promise<NodeJS.ReadableStream> {
        const aasId = encodeBase64Url(aasIdentifier);
        const descriptors: PackageDescriptor[] = await this.http.get(
            this.resolve(`packages?aasId=${aasId}`),
            this.auth,
        );

        const packageId = encodeBase64Url(descriptors[0].packageId);
        return await this.http.getReadable(this.resolve(`packages/${packageId}`), this.auth);
    }

    public override async insertPackage(file: string): Promise<void> {
        const formData = new FormData();
        const buffer = await fs.promises.readFile(file);
        const fileName = basename(file);
        formData.append('file', new File([buffer], fileName));
        formData.append('fileName', fileName);
        await this.http.postFormData(this.resolve(`packages`), formData, this.auth);
    }

    public override async deletePackage(aasIdentifier: string): Promise<void> {
        const aasId = encodeBase64Url(aasIdentifier);
        const descriptors: PackageDescriptor[] = await this.http.get(
            this.resolve(`packages?aasId=${aasId}`),
            this.auth,
        );

        const packageId = encodeBase64Url(descriptors[0].packageId);
        await this.http.delete(this.resolve(`packages/${packageId}`), this.auth);
    }

    public override async invoke(operation: aas.Operation): Promise<aas.Operation> {
        if (!operation.path) {
            throw new Error('Invalid argument ""operation.');
        }

        const smId = encodeBase64Url(operation.path.id);
        const idShortPath = operation.path.idShortPath;
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
                this.resolve(`submodels/${smId}/submodel/submodel-elements/${idShortPath}/invoke`),
                request,
                this.auth,
            ),
        );

        if (!result.executionResult.success) {
            throw new ApplicationError(ERRORS.INVOKE_OPERATION_FAILED, {
                idShort: opr.idShort,
                message: result.executionResult.messages?.map(message => message.text).join(' '),
            });
        }

        const reader = new JsonReaderV3();
        return reader.read({
            ...opr,
            outputVariable: result.outputArguments,
            inoutputVariable: result.inoutputArguments,
        } as aasV2.Operation);
    }

    public override async getBlobValue(submodelId: string, idShortPath: string): Promise<string | undefined> {
        const smId = encodeBase64Url(submodelId);
        const blob = await this.http.get<aas.Blob>(
            this.resolve(`submodels/${smId}/submodel/submodel-elements/${idShortPath}/?extent=WithBlobValue`),
            this.auth,
        );

        if (!blob) {
            throw new Error(`Blob element "${submodelId}.${idShortPath}" does not exist.`);
        }

        return blob.value;
    }

    public override getAllAssetAdministrationShellIdsByAssetLink(): Promise<PagedResult<string>> {
        return Promise.reject(new Error('Not implemented.'));
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
                            this.auth,
                        ),
                    );
                } catch (error) {
                    this.logger.error(`Unable to read Submodel "${reference.keys[0].value}": ${error?.message}`);
                }
            }
        }

        return submodels;
    }

    private toDocument(shell: aasV2.AssetAdministrationShell): AASDocument {
        const document: AASDocument = {
            address: shell.identification.id,
            assetId: shell.asset.keys.at(0)?.value,
            content: {
                assetAdministrationShells: [this.toAssetAdministration(shell)],
                submodels: [],
                conceptDescriptions: [],
            },
            endpoint: this.endpoint.name,
            id: shell.identification.id,
            idShort: shell.idShort,
            timestamp: Date.now(),
        };

        return document;
    }

    private toAssetAdministration(source: aasV2.AssetAdministrationShell): aas.AssetAdministrationShell {
        return new JsonReaderV2().read(source) as aas.AssetAdministrationShell;
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
                        this.auth,
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
