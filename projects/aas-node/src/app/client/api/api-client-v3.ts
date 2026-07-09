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
import { aas, AASEndpoint, ApplicationError, traverse, getSemanticId, PagedResult, AASDocument, Cache } from 'aas-core';

import { ApiClient } from './api-client.js';
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

class ConceptDescriptionCache extends Cache<string, aas.ConceptDescription | null> {
    public constructor() {
        super(250);
    }

    public set(id: string, conceptDescription: aas.ConceptDescription | null): void {
        this.setItem(id, conceptDescription);
    }

    public get(id: string): aas.ConceptDescription | null | undefined {
        return this.getItem(id);
    }
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
    private readonly cdCache = new ConceptDescriptionCache();

    public constructor(
        logger: Logger,
        endpoint: AASEndpoint,
        auth: Record<string, string> | undefined,
        http: HttpClient,
    ) {
        super(logger, endpoint, auth, http);
    }

    public static readonly version = '^3.0.0';

    public readonly readOnly = false;

    public readonly providesLiveData = true;

    /**
     * Tests the connection to the endpoint by requesting a page of Asset Administration Shells.
     */
    public override async test(): Promise<void> {
        await this.http.get<PagedResult<aas.AssetAdministrationShell>>(
            this.resolve('shells', { limit: 10 }),
            this.auth,
        );
    }

    /**
     * Gets a page of Asset Administration Shells IDs from the endpoint.
     * @param cursor The cursor for pagination. If undefined, the first page will be returned.
     * @returns A page of Asset Administration Shells IDs.
     */
    public override async getDocuments(
        cursor: string | undefined,
        limit: number = 100,
    ): Promise<PagedResult<AASDocument>> {
        const searchParams: Record<string, string | number> = { limit };
        if (cursor) {
            searchParams.cursor = cursor;
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

    /**
     * Gets a readable stream for the thumbnail of the AAS with the given ID.
     * @param id The ID of the AAS.
     * @returns A readable stream.
     */
    public override getThumbnail(id: string): Promise<NodeJS.ReadableStream> {
        return this.http.getReadable(
            this.resolve(`shells/${encodeBase64Url(id)}/asset-information/thumbnail`),
            this.auth,
        );
    }

    /**
     * Gets the environment of the AAS with the given ID.
     * @param id The ID of the AAS.
     * @returns The environment of the AAS.
     */
    public override async getEnvironment(id: string): Promise<aas.Environment> {
        const shell = await this.http.get<aas.AssetAdministrationShell>(
            this.resolve(`shells/${encodeBase64Url(id)}`),
            this.auth,
        );

        const submodels = await this.readSubmodels(shell.submodels);
        const conceptDescriptions = await this.readConceptDescriptions(submodels);
        const env: aas.Environment = {
            assetAdministrationShells: [shell],
            submodels,
            conceptDescriptions,
        };

        return new JsonReaderV3(env, true).readEnvironment();
    }

    /**
     * Creates or updates the AAS, Submodels and Concept Descriptions contained in the given environment.
     * @param env The environment to set for the AAS. The environment must contain the AAS with the given ID.
     */
    public override async setEnvironment(_: string, env: aas.Environment): Promise<void> {
        for (const conceptDescription of env.conceptDescriptions) {
            if (await this.hasConceptDescription(conceptDescription)) {
                await this.putConceptDescription(conceptDescription);
            } else {
                await this.postConceptDescription(conceptDescription);
            }
        }

        for (const submodel of env.submodels) {
            if (await this.hasSubmodel(submodel)) {
                await this.putSubmodel(submodel);
            } else {
                await this.postSubmodel(submodel);
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

    public override async getFile(_: string, file: aas.File): Promise<NodeJS.ReadableStream> {
        if (!file.path) {
            throw new Error('Invalid argument "file".');
        }

        const id = encodeBase64Url(file.path.id);
        const idShortPath = file.path.idShortPath;
        const url = this.resolve(`submodels/${id}/submodel-elements/${idShortPath}/attachment`);
        return await this.http.getReadable(url, this.auth);
    }

    public override resolveNodeId(_: aas.AssetAdministrationShell, nodeId: string): string {
        const index = nodeId.indexOf('#');
        const smId = nodeId.substring(0, index);
        const idShortPath = nodeId.substring(index + 1);
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
        const idShortPath = operation.path.idShortPath;
        const request: OperationRequest = {};

        if (operation.inputVariables) {
            request.inputVariables = structuredClone(operation.inputVariables);
        }

        if (operation.inoutputVariables) {
            request.inoutputVariables = structuredClone(operation.inoutputVariables);
        }

        const result: OperationResult = JSON.parse(
            await this.http.post(
                this.resolve(`submodels/${smId}/submodel-elements/${idShortPath}/invoke`),
                request,
                this.auth,
            ),
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

    public override getAllAssetAdministrationShellIdsByAssetLink(assetId: string): Promise<PagedResult<string>> {
        return this.http.get(this.resolve(`lookup/shells?assetIds=${encodeBase64Url(assetId)}`), this.auth);
    }

    private toDocument(shell: aas.AssetAdministrationShell): AASDocument {
        return {
            address: shell.id,
            assetId: shell.assetInformation.globalAssetId,
            content: null,
            crc32: 0,
            endpoint: this.endpoint.name,
            id: shell.id,
            idShort: shell.idShort,
            readonly: false,
            onlineReady: true,
            timestamp: Date.now(),
            thumbnail: null,
        };
    }

    private async readSubmodels(submodelRefs: aas.Reference[] | undefined): Promise<aas.Submodel[]> {
        if (submodelRefs === undefined) {
            return [];
        }

        const result = await Promise.allSettled(
            submodelRefs.map(async reference => {
                return this.http.get<aas.Submodel>(
                    this.resolve(`submodels/${encodeBase64Url(reference.keys[0].value)}`),
                    this.auth,
                );
            }),
        );

        return result
            .filter(item => item.status === 'fulfilled')
            .map(item => item.value)
            .sort((a, b) => a.id.localeCompare(b.id));
    }

    private async readConceptDescriptions(submodels: aas.Submodel[]): Promise<aas.ConceptDescription[]> {
        const conceptDescriptions: aas.ConceptDescription[] = [];
        const set = new Set<string>();
        for (const submodel of submodels) {
            for (const referable of traverse(submodel)) {
                const semanticId = getSemanticId(referable);
                if (!semanticId || set.has(semanticId)) {
                    continue;
                }

                set.add(semanticId);
                let conceptDescription = this.cdCache.get(semanticId);
                if (conceptDescription) {
                    conceptDescriptions.push(conceptDescription);
                    continue;
                }

                if (conceptDescription === null) {
                    continue;
                }

                try {
                    conceptDescription = await this.http.get<aas.ConceptDescription>(
                        this.resolve(`concept-descriptions/${encodeBase64Url(semanticId)}`),
                        this.auth,
                    );

                    this.cdCache.set(semanticId, conceptDescription);
                    conceptDescriptions.push(conceptDescription);
                } catch {
                    this.cdCache.set(semanticId, null);
                }
            }
        }

        return conceptDescriptions.sort((a, b) => a.id.localeCompare(b.id));
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

    private async postShell(shell: aas.AssetAdministrationShell): Promise<string> {
        return await this.http.post(this.resolve(`shells`), new JsonWriterV3().convert(shell), this.auth);
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
