/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { aas, AASDocument, AASEndpoint, ApplicationError, LiveRequest, PagedResult } from 'aas-core';
import { Logger } from 'aas-package';
import { SocketClient } from '../live/socket-client.js';
import { SocketSubscription } from '../live/socket-subscription.js';
import { thumbnailToObjectUrl } from '../utilities.js';
import { AASIndexClient } from '../index/aas-index-client.js';

/**
 * Represents a client of an endpoint or server that provides Asset Administration Shells.
 */
export abstract class EndpointClient {
    protected constructor(
        protected readonly logger: Logger,
        protected readonly index: AASIndexClient,
        public readonly endpoint: AASEndpoint,
        protected readonly auth?: Record<string, string>,
    ) {}

    /**
     * Indicates whether an active connection is established.
     */
    public abstract readonly isOpen: boolean;

    /**
     * @deprecated
     * Indicates whether the AAS source is read-only.
     */
    public abstract readonly readOnly: boolean;

    /**
     * @deprecated
     * Indicates whether the AAS source provides real-time data.
     */
    public abstract readonly providesLiveData: boolean;

    /**
     * Gets the documents of the current endpoint.
     * @param cursor The cursor for the next page or undefined for the first page.
     * @param limit The maximum number of items per page.
     * @returns The documents of the current endpoint.
     */
    public abstract getDocuments(cursor: string | undefined, limit?: number): Promise<PagedResult<AASDocument>>;

    /**
     * Determines whether the document with the specified address exists in the endpoint.
     * @param address The address of the document in the endpoint.
     * @returns True if the document exists, false otherwise.
     */
    public abstract hasDocument(address: string): Promise<boolean>;

    /**
     * Creates an AAS document.
     * @param address The address of the AAS at the endpoint.
     * @returns The created document.
     */
    public async getDocument(address: string): Promise<AASDocument> {
        const environment = await this.getEnvironment(address);
        const aas = environment.assetAdministrationShells?.at(0);
        if (!aas) {
            throw new ApplicationError('Environment contains no AAS.');
        }

        const document: AASDocument = {
            id: aas.id,
            endpoint: this.endpoint.name,
            address: address,
            idShort: aas.idShort,
            assetId: aas.assetInformation.globalAssetId,
            content: environment,
            timestamp: Date.now(),
        };

        const thumbnail = await this.createThumbnail(address);
        if (thumbnail) {
            document.thumbnail = thumbnail;
        }

        return document;
    }

    /**
     * Tests the connection to the AAS endpoint.
     */
    public abstract test(): Promise<void>;

    /**
     * Opens a connection to the AAS endpoint.
     */
    public abstract open(): Promise<void>;

    /**
     * Closes the connection to the AAS endpoint.
     */
    public abstract close(): Promise<void>;

    /**
     * Gets the thumbnail of the AAS package with the specified address.
     * @param address The address of the package in the AAS endpoint.
     */
    public abstract getThumbnail(address: string): Promise<NodeJS.ReadableStream | undefined>;

    /**
     * Gets the AAS environment contained in the package with the specified address.
     * @param address The address of the package in the AAS endpoint.
     */
    public abstract getEnvironment(address: string): Promise<aas.Environment>;

    /**
     * Sets a new AAS environment in the package with the specified address.
     * @param address The address of the package in the AAS endpoint.
     * @param env The AAS environment.
     */
    public abstract setEnvironment(address: string, env: aas.Environment): Promise<void>;

    /**
     * Gets the submodels of the current endpoint.
     * @param cursor The position for the next page.
     * @param limit The maximum number of submodels of a page.
     * @returns The submodels of the current endpoint.
     */
    public abstract getSubmodels(cursor: string | undefined, limit?: number): Promise<PagedResult<aas.Submodel>>;

    /**
     * Gets the concept descriptions of the current endpoint.
     * @param cursor The position for the next page.
     * @param limit The maximum number of submodels of a page.
     * @returns The concept descriptions of the current endpoint.
     */
    public abstract getConceptDescriptions(
        cursor: string | undefined,
        limit?: number,
    ): Promise<PagedResult<aas.ConceptDescription>>;

    /**
     * Opens a readable stream.
     * @param address The address of the package in the AAS endpoint.
     * @param file The File element to read the content.
     */
    public abstract getFile(address: string, file: aas.File): Promise<NodeJS.ReadableStream>;

    /**
     * Determines the address of the AAS in the concrete AASClient context.
     * @param aasxFile The path of the AASX package file.
     */
    public abstract determineAddress(aasxFile: string): Promise<string | undefined>;

    /**
     * Creates a WebSocket subscription.
     * @param client The client.
     * @param request The request.
     * @param env The AAS environment.
     */
    public abstract createSubscription(
        client: SocketClient,
        request: LiveRequest,
        env: aas.Environment,
    ): SocketSubscription;

    /**
     * Downloads an aasx package form the current source.
     * @param endpoint The endpoint name.
     * @param id The AAS identifier.
     * @returns A readable stream.
     */
    public abstract getPackage(endpoint: string, id: string): Promise<NodeJS.ReadableStream>;

    /**
     * Uploads an AASX package.
     * @param file The AASX package file.
     */
    public abstract insertPackage(file: string): Promise<void>;

    /**
     * Delete an aasx package from the current source.
     * @param id The AAS identifier.
     * @param name The name of the package in the source.
     */
    public abstract deletePackage(id: string, name: string): Promise<void>;

    /**
     * Invokes the specified operation synchronously.
     * @param operation The operation to invoke.
     * @returns The invoked operation.
     */
    public abstract invoke(operation: aas.Operation): Promise<aas.Operation>;

    /**
     * Reads the value of the current Blob element.
     * @param submodelId The Submodel to which the Blob belongs.
     * @param idShortPath The path from the Submodel to the Blob element.
     * @returns The Blob value.
     */
    public abstract getBlobValue(submodelId: string, idShortPath: string): Promise<string | undefined>;

    /**
     * Returns a list of Asset Administration Shell identifiers based on the specified asset identifier.
     * @param assetId The Asset identifier.
     */
    public abstract getAllAssetAdministrationShellIdsByAssetLink(assetId: string): Promise<PagedResult<string>>;

    /**
     * Resolves a new URL from the base URL and the specified URL.
     * @param url The URL.
     * @returns A new URL.
     */
    protected resolve(url: string, searchParams?: Record<string, string | number>): URL {
        const resolvedUrl = new URL(url, this.endpoint.url);
        if (searchParams) {
            for (const name in searchParams) {
                resolvedUrl.searchParams.set(name, String(searchParams[name]));
            }
        }

        return resolvedUrl;
    }

    /**
     * Creates a thumbnail as Base64URL.
     * @param address The thumbnail address.
     * @returns A Base64URL string or `undefined` if the thumbnail does not exists.
     */
    protected async createThumbnail(address: string): Promise<string | undefined> {
        try {
            return await thumbnailToObjectUrl(await this.getThumbnail(address));
        } catch {
            return undefined;
        }
    }
}
