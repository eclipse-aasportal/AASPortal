/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { aas, AASEndpoint, LiveRequest } from 'aas-core';
import { Logger } from '../logging/logger.js';
import { SocketClient } from '../live/socket-client.js';
import { AASPackage } from './aas-package.js';
import { SocketSubscription } from '../live/socket-subscription.js';

/** Represents a resource of Asset Administration Shells. */
export abstract class AASResource {
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

    /** Tests the connection to the AAS source. */
    public abstract testAsync(): Promise<void>;

    /** Opens the container. */
    public abstract openAsync(): Promise<void>;

    /** Closes the container. */
    public abstract closeAsync(): Promise<void>;

    /** Creates a package from the specified address. */
    public abstract createPackage(...args: string[]): AASPackage;

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
     * @param aasIdentifier The AAS identifier.
     * @returns A readable stream.
     */
    public abstract getPackageAsync(aasIdentifier: string, name: string): Promise<NodeJS.ReadableStream>;

    /**
     * Uploads an AASX package.
     * @param file The AASX package file.
     */
    public abstract postPackageAsync(file: Express.Multer.File): Promise<string>;

    /**
     * Delete an aasx package from the current source.
     * @param aasIdentifier The AAS identifier.
     * @param name The name of the package in the source.
     */
    public abstract deletePackageAsync(aasIdentifier: string, name: string): Promise<string>;

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
    public abstract getBlobValueAsync(
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
