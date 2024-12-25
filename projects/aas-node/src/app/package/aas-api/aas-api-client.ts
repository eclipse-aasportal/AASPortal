/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { aas, AASEndpoint, convertFromString, DefaultType, DifferenceItem, LiveRequest } from 'aas-core';
import { HttpClient } from '../../http-client.js';
import { Logger } from '../../logging/logger.js';
import { HttpSubscription } from '../../live/http/http-subscription.js';
import { SocketClient } from '../../live/socket-client.js';
import { AASPackage } from '../aas-package.js';
import { AASClient } from '../aas-client.js';
import { AASApiPackage } from './aas-api-package.js';
import { SocketSubscription } from '../../live/socket-subscription.js';
import { PagedResult } from '../../types/paged-result.js';

interface PropertyValue {
    value: string;
}

/** The label of an AAS.  */
export type AASLabel = { id: string; idShort: string };

/** Provides access to an AASX-Server. */
export abstract class AASApiClient extends AASClient {
    private reentry = 0;

    /**
     * @param logger The logger.
     * @param http The HTTP client.
     * @param endpoint AAS endpoint.
     * @param name The endpoint name.
     */
    public constructor(logger: Logger, http: HttpClient, endpoint: AASEndpoint) {
        super(logger, endpoint);

        this.http = http;
    }

    protected readonly http: HttpClient;

    /** Indicates whether a connection to an AAS endpoint exits. */
    public get isOpen(): boolean {
        return this.reentry > 0;
    }

    /** Tests the connection to the endpoint. */
    public async testAsync(): Promise<void> {
        if (this.reentry === 0) {
            await this.http.checkUrlExist(this.endpoint.url);
        }
    }

    /**
     * Reads the environment of the AAS with the specified identifier.
     * @param label The AAS label.
     * @returns An AAS environment.
     */
    public abstract readEnvironmentAsync(label: AASLabel): Promise<aas.Environment>;

    /**
     * Gets the thumbnail of the AAS with the specified identifier.
     * @param id The identifier of the current AAS.
     */
    public abstract getThumbnailAsync(id: string): Promise<NodeJS.ReadableStream>;

    /** Opens a connection to the AAS endpoint. */
    public override openAsync(): Promise<void> {
        ++this.reentry;
        return Promise.resolve();
    }

    /** Closes the connection to the AAS endpoint. */
    public override closeAsync(): Promise<void> {
        return new Promise(resolve => {
            if (this.reentry > 0) {
                --this.reentry;
            }

            resolve();
        });
    }

    /**
     * Creates a package from the specified arguments.
     * @param args The AAS identifier (args[0]) and the name (args[1]) of the AAS.
     * @returns A new `AASServerPackage` instance.
     **/
    public override createPackage(...args: string[]): AASPackage {
        return new AASApiPackage(this.logger, this, args[0], args[1]);
    }

    /**
     * Creates a subscription for live data from an AAS endpoint.
     * @param client The socket.
     * @param request The list of SubmodelElements to get live data.
     * @param env The AAS.
     * @returns A new `HttpSubscription` instance.
     */
    public override createSubscription(
        client: SocketClient,
        request: LiveRequest,
        env: aas.Environment,
    ): SocketSubscription {
        return new HttpSubscription(this.logger, this, client, request, env);
    }

    /**
     * Gets the names of the Asset Administration Shells contained in the current AASX server.
     * @returns The names of the AASs contained in the current AASX server.
     */
    public abstract getShellsAsync(cursor?: string): Promise<PagedResult<AASLabel>>;

    /**
     * ToDo
     * @param source The source AAS.
     * @param destination The destination
     * @param diffs
     */
    public abstract commitAsync(
        source: aas.Environment,
        destination: aas.Environment,
        diffs: DifferenceItem[],
    ): Promise<string[]>;

    /**
     * Opens the specified file from the AASX server.
     * @param env The environment of the AAS.
     * @param address The file.
     * @returns A readable stream.
     */
    public abstract openFileAsync(shell: aas.AssetAdministrationShell, file: aas.File): Promise<NodeJS.ReadableStream>;

    /**
     * Reads the current value from a submodel element.
     * @param url The path of the submodel element value.
     * @param valueType The
     * @returns The current value.
     */
    public async readValueAsync(url: string, valueType: aas.DataTypeDefXsd): Promise<DefaultType | undefined> {
        const property = await this.http.get<PropertyValue>(new URL(url), this.endpoint.headers);
        return convertFromString(property.value, valueType);
    }

    /**
     * Returns the URL to a Property.
     * @param aas The Asset Administration Shell.
     * @param nodeId The path from the Submodel to the Property.
     */
    public abstract resolveNodeId(aas: aas.AssetAdministrationShell, nodeId: string): string;
}
