/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, singleton } from 'tsyringe';
import path from 'path';
import { Readable } from 'stream';
import {
    AASDocument,
    aas,
    ApplicationError,
    isFile,
    isBlob,
    selectReferable,
    AASEndpointAuth,
    isLoadedEnvironment,
} from 'aas-core';

import { ImageProcessing } from '../image-processing.js';
import { EndpointClientFactory } from '../client/endpoint-client-factory.js';
import { ERRORS } from '../errors.js';
import { thumbnailToObjectUrl } from '../utilities.js';
import { AASIndexClient } from '../index/aas-index-client.js';

@singleton()
export class DocumentProvider {
    public constructor(
        @inject(EndpointClientFactory) private readonly clientFactory: EndpointClientFactory,
        @inject(AASIndexClient) private readonly index: AASIndexClient,
    ) {}

    /**
     * Gets the AAS document with the specified identifier.
     * @param endpoint The AAS endpoint name (optional).
     * @param modelType The model type to which `id` belongs.
     * @param id Depending on the model type the AAS or Asset identifier.
     * @param auth The user specific endpoint authorization.
     * @returns The AAS document with the specified identifier.
     */
    public async getDocument(
        endpoint: string | undefined,
        modelType: 'AssetAdministrationShell' | 'Asset',
        id: string,
        auth: AASEndpointAuth[] = [],
    ): Promise<AASDocument> {
        const document = await this.index.find(endpoint, modelType, id);
        if (document) {
            const headers = auth.find(item => item.name === document.endpoint)?.headers;
            const client = this.clientFactory.create(await this.index.getEndpoint(document.endpoint), headers);
            try {
                await client.open();
                document.content = await client.getEnvironment(document.address);
                if (document.thumbnail === null) {
                    // A missing or broken thumbnail (e.g. the endpoint has no thumbnail file stored for
                    // this shell, even though its asset information still references one) must not prevent
                    // the already successfully loaded document content from being returned.
                    try {
                        document.thumbnail = await thumbnailToObjectUrl(await client.getThumbnail(document.address));
                        if (document.thumbnail) {
                            await this.index.update(document);
                        }
                    } catch {
                        document.thumbnail = undefined;
                    }
                }

                return document;
            } finally {
                await client.close();
            }
        }

        if (endpoint) {
            const headers = auth.find(item => item.name === endpoint)?.headers ?? {};
            return await this.getDocumentById(endpoint, modelType, id, headers);
        }

        for (const item of await this.index.getEndpoints()) {
            try {
                const headers = auth.find(item => item.name === endpoint)?.headers ?? {};
                return await this.getDocumentById(item.name, modelType, id, headers);
            } catch {
                continue;
            }
        }

        throw new ApplicationError(ERRORS.AAS_NOT_FOUND, { id }, 404);
    }

    /**
     * Gets the thumbnail of the specified AAS.
     * @param endpoint The endpoint name.
     * @param id The AAS identifier.
     * @returns A readable stream.
     */
    public async getThumbnail(
        endpoint: string,
        id: string,
        auth: Record<string, string> | undefined,
    ): Promise<NodeJS.ReadableStream | undefined> {
        const document = await this.index.get(endpoint, 'AssetAdministrationShell', id);
        const client = this.clientFactory.create(await this.index.getEndpoint(endpoint), auth);
        try {
            await client.open();
            return await client.getThumbnail(document.address);
        } finally {
            await client.close();
        }
    }

    /**
     * Gets the value of the specified DataElement.
     * @param endpoint The endpoint name.
     * @param id The AAS identifier.
     * @param smId The Submodel identifier.
     * @param idShortPath The idShort path.
     * @param options Additional options.
     * @returns A readable stream.
     */
    public async getDataElementValue(
        endpoint: string,
        id: string,
        smId: string,
        idShortPath: string,
        auth: Record<string, string> | undefined,
        options?: object,
    ): Promise<NodeJS.ReadableStream> {
        const document = await this.index.get(endpoint, 'AssetAdministrationShell', id);
        let stream: NodeJS.ReadableStream;
        const client = this.clientFactory.create(await this.index.getEndpoint(endpoint), auth);
        try {
            await client.open();
            if (!isLoadedEnvironment(document.content)) {
                document.content = await client.getEnvironment(document.address);
            }

            const dataElement: aas.DataElement | undefined = selectReferable(document.content, smId, idShortPath);
            if (!dataElement) {
                throw new Error('DataElement not found.');
            }

            if (isFile(dataElement)) {
                if (!dataElement.value) {
                    throw new Error('Invalid operation.');
                }

                stream = await client.getFile(document.address, dataElement);
                const extension = dataElement.value ? path.extname(dataElement.value).toLowerCase() : '';
                const imageOptions = options as { width?: number; height?: number };
                if (dataElement.contentType.startsWith('image/')) {
                    if (imageOptions?.width || imageOptions?.height) {
                        stream = await ImageProcessing.resizeAsync(stream, imageOptions.width, imageOptions.height);
                    }

                    if (extension === '.tiff' || extension === '.tif') {
                        stream = await ImageProcessing.convertAsync(stream);
                    }
                }
            } else if (isBlob(dataElement)) {
                const value = await client.getBlobValue(smId, idShortPath);
                const readable = new Readable();
                readable.push(value);
                readable.push(null);
                stream = readable;
            } else {
                throw new Error('Not implemented');
            }
        } finally {
            await client.close();
        }

        return stream;
    }

    /**
     * Updates the content of an AAS document.
     * @param endpoint The endpoint name.
     * @param id The unique AAS identifier.
     * @param content The modified elements of the document content.
     */
    public async updateDocument(
        endpoint: string,
        id: string,
        content: aas.Environment,
        auth: Record<string, string> | undefined,
    ): Promise<void> {
        const document = await this.index.get(endpoint, 'AssetAdministrationShell', id);
        if (!document) {
            throw new Error(`The destination document ${id} is not available.`);
        }

        const client = this.clientFactory.create(await this.index.getEndpoint(endpoint), auth);
        try {
            await client.open();
            await client.setEnvironment(document.address, content);
        } finally {
            await client.close();
        }
    }

    /**
     * Invokes an operation synchronous.
     * @param endpoint The endpoint name.
     * @param id The AAS identifier.
     * @param operation The Operation element.
     * @returns ToDo.
     */
    public async invoke(
        endpoint: string,
        id: string,
        operation: aas.Operation,
        auth: Record<string, string> | undefined,
    ): Promise<aas.Operation> {
        const document = await this.index.get(endpoint, 'AssetAdministrationShell', id);
        const client = this.clientFactory.create(await this.index.getEndpoint(endpoint), auth);
        try {
            await client.open();
            let env = document.content;
            if (!env) {
                env = await client.getEnvironment(document.address);
            }

            return await client.invoke(operation);
        } finally {
            await client.close();
        }
    }

    private async getDocumentById(
        endpoint: string,
        modelType: 'Asset' | 'AssetAdministrationShell',
        id: string,
        auth: Record<string, string> | undefined,
    ): Promise<AASDocument> {
        const client = this.clientFactory.create(await this.index.getEndpoint(endpoint), auth);
        try {
            await client.open();
            let address: string | undefined;
            if (modelType === 'AssetAdministrationShell') {
                address = id;
            } else {
                const result = await client.getAllAssetAdministrationShellIdsByAssetLink(id);
                if (!result.result?.length) {
                    throw new ApplicationError(ERRORS.AAS_NOT_FOUND_BY_ASSET_LINK, { assetId: id }, 404);
                }

                address = result.result[0];
            }

            const document = await client.getDocument(address);
            await this.index.insert(document);
            return document;
        } finally {
            await client.close();
        }
    }
}
