/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { aas, AASDocument, AASEndpoint, LiveRequest } from 'aas-core';
import { computeCrc32 } from 'aas-package';
import { Logger } from '../logging/logger.js';
import { SocketClient } from '../live/socket-client.js';
import { SocketSubscription } from '../live/socket-subscription.js';
import { createThumbnail } from '../utilities.js';

/** Represents a client of a server that provides Asset Administration Shells. */
export abstract class AASClient {
    protected constructor(
        protected readonly logger: Logger,
        public readonly endpoint: AASEndpoint,
    ) {}

    /** Indicates whether an active connection is established. */
    public abstract readonly isOpen: boolean;

    /** Indicates whether the AAS source is read-only. */
    public abstract readonly readOnly: boolean;

    /** Indicates whether the AAS source provides live data. */
    public abstract readonly onlineReady: boolean;

    public async createDocument(address: string): Promise<AASDocument> {
        const environment = await this.getEnvironment(address);
        const document: AASDocument = {
            id: environment.assetAdministrationShells[0].id,
            endpoint: this.endpoint.name,
            address: address,
            idShort: environment.assetAdministrationShells[0].idShort,
            assetId: environment.assetAdministrationShells[0].assetInformation.globalAssetId,
            readonly: this.readOnly,
            onlineReady: true,
            content: environment,
            timestamp: Date.now(),
            crc32: computeCrc32(environment),
        };

        const thumbnail = await createThumbnail(await this.getThumbnail(address));
        if (thumbnail) {
            document.thumbnail = thumbnail;
        }

        return document;
    }

    /** Tests the connection to the AAS source. */
    public abstract test(): Promise<void>;

    /** Opens the container. */
    public abstract open(): Promise<void>;

    /** Closes the container. */
    public abstract close(): Promise<void>;

    public abstract getThumbnail(address: string): Promise<NodeJS.ReadableStream | undefined>;

    public abstract getEnvironment(address: string): Promise<aas.Environment>;

    public abstract setEnvironment(address: string, env: aas.Environment): Promise<void>;

    public abstract openRead(address: string, file: aas.File): Promise<NodeJS.ReadableStream>;

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
    public abstract insertPackage(file: Express.Multer.File): Promise<string>;

    /**
     * Delete an aasx package from the current source.
     * @param id The AAS identifier.
     * @param name The name of the package in the source.
     */
    public abstract deletePackage(id: string, name: string): Promise<string>;

    /**
     * Invokes the specified operation synchronously.
     * @param env The current AAS environment.
     * @param operation The operation to invoke.
     * @returns The invoked operation.
     */
    public abstract invoke(env: aas.Environment, operation: aas.Operation): Promise<aas.Operation>;

    /**
     * Reads the value of the current Blob element.
     * @param env The AAS environment.
     * @param submodelId The Submodel to which the Blob belongs.
     * @param idShortPath The path from the Submodel to the Blob element.
     * @returns The Blob value.
     */
    public abstract getBlobValue(
        env: aas.Environment,
        submodelId: string,
        idShortPath: string,
    ): Promise<string | undefined>;

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
}
