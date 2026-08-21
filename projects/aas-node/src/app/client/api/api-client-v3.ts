/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import fs from 'fs';
import { basename } from 'path';
import { encodeBase64Url, JsonReaderV3, JsonWriterV3, Logger } from 'aas-package';
import { aas, AASEndpoint, ApplicationError, PagedResult, AASDocument } from 'aas-core';

import { ApiClient } from './api-client.js';
import { ERRORS } from '../../errors.js';
import { HttpClient } from '../../http-client.js';
import { AASIndexClient } from '../../index/aas-index-client.js';

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

/**
 * Percent-encodes an idShortPath before it is embedded in a request URL. `SubmodelElementList`
 * indices produce path segments like `Documents[0].DocumentVersions[0]`; `[` and `]` are not
 * escaped by `URL`/`new URL()`, but servers such as BaSyx correctly reject them un-encoded as an
 * invalid URI (RFC 3986). `encodeURIComponent` escapes the brackets while leaving the `.` segment
 * separators untouched, which is what the AAS REST API expects.
 * @param idShortPath The raw idShortPath.
 * @returns The percent-encoded idShortPath.
 */
function encodeIdShortPath(idShortPath: string): string {
    return encodeURIComponent(idShortPath);
}

export class ApiClientV3 extends ApiClient {
    public constructor(
        logger: Logger,
        index: AASIndexClient,
        endpoint: AASEndpoint,
        auth: Record<string, string> | undefined,
        http: HttpClient,
    ) {
        super(logger, index, endpoint, auth, http);
    }

    public static readonly version = '^3.0.0';

    public override readonly readOnly = false;

    public override readonly providesLiveData = true;

    public override async test(): Promise<void> {
        await this.http.get<PagedResult<aas.AssetAdministrationShell>>(
            this.resolve('shells', { limit: 10 }),
            this.auth,
        );
    }

    public override async hasDocument(address: string): Promise<boolean> {
        try {
            const result = await this.http.get<aas.AssetAdministrationShell>(
                this.resolve(`shells/${encodeBase64Url(address)}`),
                this.auth,
            );

            return !!result;
        } catch {
            return false;
        }
    }

    public override async getDocuments(cursor: string | undefined, limit?: number): Promise<PagedResult<AASDocument>> {
        const searchParams: Record<string, string | number> = {};
        if (cursor) {
            searchParams.cursor = cursor;
        }

        if (limit) {
            searchParams.limit = limit;
        }

        const result = await this.http.get<PagedResult<aas.AssetAdministrationShell>>(
            this.resolve('shells', searchParams),
            this.auth,
        );

        return {
            result: result.result.map(shell => this.toDocument(shell)),
            paging_metadata: { cursor: result.paging_metadata.cursor },
        };
    }

    public override async getSubmodels(cursor: string | undefined, limit?: number): Promise<PagedResult<aas.Submodel>> {
        const searchParams: Record<string, string | number> = {};
        if (cursor) {
            searchParams.cursor = cursor;
        }

        if (limit) {
            searchParams.limit = limit;
        }

        return await this.http.get<PagedResult<aas.Submodel>>(this.resolve('submodels', searchParams), this.auth);
    }

    public override async getConceptDescriptions(
        cursor: string | undefined,
        limit?: number,
    ): Promise<PagedResult<aas.ConceptDescription>> {
        const searchParams: Record<string, string | number> = {};
        if (cursor) {
            searchParams.cursor = cursor;
        }

        if (limit) {
            searchParams.limit = limit;
        }

        return await this.http.get<PagedResult<aas.ConceptDescription>>(
            this.resolve('concept-descriptions', searchParams),
            this.auth,
        );
    }

    public override getThumbnail(id: string): Promise<NodeJS.ReadableStream> {
        return this.http.getReadable(
            this.resolve(`shells/${encodeBase64Url(id)}/asset-information/thumbnail`),
            this.auth,
        );
    }

    public override async getEnvironment(id: string): Promise<aas.Environment> {
        const shell = await this.http.get<aas.AssetAdministrationShell>(
            this.resolve(`shells/${encodeBase64Url(id)}`),
            this.auth,
        );

        const submodels = await this.getShellSubmodels(shell);
        const conceptDescriptions = await this.getShellConceptDescriptions(shell);
        const env: aas.Environment = {
            assetAdministrationShells: [shell],
            submodels,
            conceptDescriptions,
        };

        return new JsonReaderV3(env, true).readEnvironment();
    }

    public override async setEnvironment(_: string, env: aas.Environment): Promise<void> {
        if (env.conceptDescriptions) {
            for (const conceptDescription of env.conceptDescriptions) {
                if (await this.hasConceptDescription(conceptDescription)) {
                    await this.putConceptDescription(conceptDescription);
                } else {
                    await this.postConceptDescription(conceptDescription);
                }
            }
        }

        if (env.submodels) {
            for (const submodel of env.submodels) {
                if (await this.hasSubmodel(submodel)) {
                    await this.putSubmodel(submodel);
                } else {
                    await this.postSubmodel(submodel);
                }
            }
        }

        if (env.assetAdministrationShells) {
            for (const aas of env.assetAdministrationShells) {
                if (await this.hasShell(aas)) {
                    await this.putShell(aas);
                } else {
                    await this.postShell(aas);
                }
            }
        }
    }

    public override async getFile(_: string, file: aas.File): Promise<NodeJS.ReadableStream> {
        if (!file.path) {
            throw new Error('Invalid argument "file".');
        }

        const id = encodeBase64Url(file.path.id);
        const idShortPath = encodeIdShortPath(file.path.idShortPath);
        const url = this.resolve(`submodels/${id}/submodel-elements/${idShortPath}/attachment`);
        return await this.http.getReadable(url, this.auth);
    }

    public override resolveNodeId(_: aas.AssetAdministrationShell, nodeId: string): string {
        const index = nodeId.indexOf('#');
        const smId = nodeId.substring(0, index);
        const idShortPath = encodeIdShortPath(nodeId.substring(index + 1));
        return this.resolve(`submodels/${smId}/submodel-elements/${idShortPath}`).href;
    }

    public override async getPackage(aasId: string): Promise<NodeJS.ReadableStream> {
        const result: PagedResult<PackageDescriptor> = await this.http.get(
            this.resolve(`packages?aasId=${encodeBase64Url(aasId)}`),
            this.auth,
        );

        const packageId = encodeBase64Url(result.result[0].packageId);
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

    public override async deletePackage(aasId: string): Promise<void> {
        const result: PagedResult<PackageDescriptor> = await this.http.get(
            this.resolve(`packages?aasId=${encodeBase64Url(aasId)}`),
            this.auth,
        );

        const packageId = encodeBase64Url(result.result[0].packageId);
        await this.http.delete(this.resolve(`packages/${packageId}`), this.auth);
    }

    public override async invoke(operation: aas.Operation): Promise<aas.Operation> {
        if (!operation.path) {
            throw new Error('Invalid argument ""operation.');
        }

        const smId = encodeBase64Url(operation.path.id);
        const idShortPath = encodeIdShortPath(operation.path.idShortPath);
        const request: OperationRequest = {};

        if (operation.inputVariables) {
            request.inputVariables = structuredClone(operation.inputVariables);
        }

        if (operation.inoutputVariables) {
            request.inoutputVariables = structuredClone(operation.inoutputVariables);
        }

        const result: OperationResult = await this.http.post(
            this.resolve(`submodels/${smId}/submodel-elements/${idShortPath}/invoke`),
            request,
            this.auth,
        );

        if (!result.success) {
            throw new ApplicationError(ERRORS.INVOKE_OPERATION_FAILED, {
                idShort: operation.idShort,
                message: result.messages?.map(message => message.text).join(' '),
            });
        }

        return { ...operation, outputVariables: result.outputVariables, inoutputVariables: result.inoutputVariables };
    }

    public override async getBlobValue(submodelId: string, idShortPath: string): Promise<string | undefined> {
        const blob = await this.http.get<aas.Blob>(
            this.resolve(`submodels/${submodelId}/submodel-elements/${idShortPath}/?extent=WithBlobValue`),
            this.auth,
        );

        if (!blob) {
            throw new Error(`Blob element "${submodelId}.${idShortPath}" does not exist.`);
        }

        return blob.value;
    }

    public override async getAllAssetAdministrationShellIdsByAssetLink(assetId: string): Promise<PagedResult<string>> {
        try {
            const result = await this.http.get<PagedResult<string>>(
                this.resolve(`lookup/shells?assetId=${encodeBase64Url(assetId)}`),
                this.auth,
            );

            if (result.result?.length) {
                return result;
            }
        } catch {
            // fall through to the repository-level fallback below
        }

        // /lookup/shells is the AAS *Registry* "Basic Discovery" API -- a separate component whose job
        // is to index *where* shells live. Some servers don't implement it at all (404). Others do, but
        // its index can be an independently maintained, out-of-sync copy of the actual repository data
        // -- it responds 200 with an empty result for an asset that demonstrably exists. Either way,
        // fall back to filtering the plain shell repository directly: /shells also accepts an assetId
        // filter per spec, querying the live/authoritative data instead of a secondary index.
        try {
            const result = await this.http.get<PagedResult<aas.AssetAdministrationShell>>(
                this.resolve('shells', { assetId }),
                this.auth,
            );

            if (result.result?.length) {
                return { result: result.result.map(shell => shell.id), paging_metadata: {} };
            }
        } catch {
            // no match via this path either
        }

        return { result: [], paging_metadata: {} };
    }

    protected override getConceptDescription(id: string): Promise<aas.ConceptDescription> {
        return this.http.get<aas.ConceptDescription>(
            this.resolve(`concept-descriptions/${encodeBase64Url(id)}`),
            this.auth,
        );
    }

    private toDocument(shell: aas.AssetAdministrationShell): AASDocument {
        const document: AASDocument = {
            address: shell.id,
            assetId: shell.assetInformation.globalAssetId,
            content: { assetAdministrationShells: [shell] },
            endpoint: this.endpoint.name,
            id: shell.id,
            idShort: shell.idShort,
            timestamp: Date.now(),
            thumbnail: null,
        };

        return document;
    }

    private async getShellSubmodels(shell: aas.AssetAdministrationShell): Promise<aas.Submodel[]> {
        if (!shell.submodels) {
            return [];
        }

        const result = await Promise.allSettled(
            shell.submodels.map(async reference => {
                return this.http.get<aas.Submodel>(
                    this.resolve(`submodels/${encodeBase64Url(reference.keys[0].value)}`),
                    this.auth,
                );
            }),
        );

        return result.filter(item => item.status === 'fulfilled').map(item => item.value);
    }

    private async hasShell(shell: aas.AssetAdministrationShell): Promise<boolean> {
        try {
            return (
                (await this.http.get<aas.AssetAdministrationShell>(
                    this.resolve(`shells/${encodeBase64Url(shell.id)}`),
                    this.auth,
                )) !== undefined
            );
        } catch {
            return false;
        }
    }

    private async putShell(shell: aas.AssetAdministrationShell): Promise<void> {
        const aasId = encodeBase64Url(shell.id);
        await this.http.put(this.resolve(`shells/${aasId}`), new JsonWriterV3().convert(shell), this.auth);
    }

    private postShell(shell: aas.AssetAdministrationShell): Promise<void> {
        return this.http.post(this.resolve(`shells`), new JsonWriterV3().convert(shell), this.auth);
    }

    private async hasSubmodel(submodel: aas.Submodel): Promise<boolean> {
        try {
            return (
                (await this.http.get(this.resolve(`submodels/${encodeBase64Url(submodel.id)}`), this.auth)) !==
                undefined
            );
        } catch {
            return false;
        }
    }

    private async putSubmodel(submodel: aas.Submodel): Promise<void> {
        await this.http.put(
            this.resolve(`submodels/${encodeBase64Url(submodel.id)}`),
            new JsonWriterV3().convert(submodel),
            this.auth,
        );
    }

    private async postSubmodel(submodel: aas.Submodel): Promise<void> {
        await this.http.post(this.resolve(`submodels/`), new JsonWriterV3().convert(submodel), this.auth);
    }

    private async hasConceptDescription(conceptDescription: aas.ConceptDescription): Promise<boolean> {
        try {
            return (
                (await this.http.get(
                    this.resolve(`concept-descriptions/${encodeBase64Url(conceptDescription.id)}`),
                    this.auth,
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
            this.auth,
        );
    }

    private async postConceptDescription(conceptDescription: aas.ConceptDescription): Promise<void> {
        await this.http.post(
            this.resolve(`concept-descriptions`),
            new JsonWriterV3().convert(conceptDescription),
            this.auth,
        );
    }
}
