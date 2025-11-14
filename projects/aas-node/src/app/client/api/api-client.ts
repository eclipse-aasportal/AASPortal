/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

<<<<<<<< HEAD:projects/aas-node/src/app/package/api/api-client.ts
import { aas, AASEndpoint, convertFromString, DefaultType, getSemanticId, LiveRequest, traverse } from 'aas-core';
========
import {
    aas,
    AASEndpoint,
    convertFromString,
    DefaultType,
    getSemanticId,
    LiveRequest,
    PagedResult,
    traverse,
} from 'aas-core';
>>>>>>>> development:projects/aas-node/src/app/client/api/api-client.ts

import { HttpClient } from '../../http-client.js';
import { Logger } from '../../logging/logger.js';
import { HttpSubscription } from '../../live/http/http-subscription.js';
import { SocketClient } from '../../live/socket-client.js';
import { AASClient } from '../aas-client.js';
<<<<<<<< HEAD:projects/aas-node/src/app/package/api/api-client.ts
import { ApiPackage } from './api-package.js';
========
>>>>>>>> development:projects/aas-node/src/app/client/api/api-client.ts
import { SocketSubscription } from '../../live/socket-subscription.js';
import { AasxPackage } from '../fs/aasx-package.js';

interface PropertyValue {
    value: string;
}

/** Provides access to an AASX-Server. */
export abstract class ApiClient extends AASClient {
    private reentry = 0;

    /**
     * @param logger The logger.
     * @param http The HTTP client.
     * @param endpoint AAS endpoint.
     */
    public constructor(logger: Logger, http: HttpClient, endpoint: AASEndpoint) {
        super(logger, endpoint);

        this.http = http;
    }

    protected readonly http: HttpClient;

    /** Indicates whether a connection to an AAS endpoint exits. */
    public override get isOpen(): boolean {
        return this.reentry > 0;
    }

    /** Tests the connection to the endpoint. */
    public override async test(): Promise<void> {
        if (this.reentry === 0) {
            await this.http.checkUrlExist(this.endpoint.url);
        }
    }

<<<<<<<< HEAD:projects/aas-node/src/app/package/api/api-client.ts
    /**
     * Reads the environment of the AAS with the specified identifier.
     * @param id The unique identifier of the AAS.
     * @param idShort The short identifier of the AAS.
     * @returns The AAS environment.
     */
    public abstract readEnvironment(id: string, idShort: string): Promise<aas.Environment>;

    /**
     * Updates the elements contained in the specified AAS environment.
     * @param id The unique identifier of the AAS to which the environment belongs.
     * @param env The AAS environment.
     */
    public abstract writeEnvironment(id: string, env: aas.Environment): Promise<void>;

    /**
     * Gets the thumbnail of the AAS with the specified identifier.
     * @param id The identifier of the current AAS.
     */
    public abstract getThumbnail(id: string): Promise<NodeJS.ReadableStream>;

========
>>>>>>>> development:projects/aas-node/src/app/client/api/api-client.ts
    /** Opens a connection to the AAS endpoint. */
    public override open(): Promise<void> {
        ++this.reentry;
        return Promise.resolve();
    }

    /** Closes the connection to the AAS endpoint. */
    public override close(): Promise<void> {
        return new Promise(resolve => {
            if (this.reentry > 0) {
                --this.reentry;
            }

            resolve();
        });
    }

<<<<<<<< HEAD:projects/aas-node/src/app/package/api/api-client.ts
    /**
     * Creates a package from the specified arguments.
     * @param args The AAS identifier (args[0]) and the name (args[1]) of the AAS.
     * @returns A new `AASServerPackage` instance.
     **/
    public override createPackage(...args: string[]): AASPackage {
        return new ApiPackage(this.logger, this, args[0], args[1]);
========
    public override async determineAddress(aasxFile: string): Promise<string | undefined> {
        const aasxPackage = await AasxPackage.createFromFile(aasxFile);
        const env = await aasxPackage.getEnvironment();
        return env.assetAdministrationShells.at(0)?.id;
>>>>>>>> development:projects/aas-node/src/app/client/api/api-client.ts
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
<<<<<<<< HEAD:projects/aas-node/src/app/package/api/api-client.ts
    public abstract getShells(cursor?: string): Promise<PagedResult<AASLabel>>;

    /**
     * Opens the specified file from the AASX server.
     * @param shell The AAS that contains the file element.
     * @param file The file.
     * @returns A readable stream.
     */
    public abstract openFile(shell: aas.AssetAdministrationShell, file: aas.File): Promise<NodeJS.ReadableStream>;
========
    public abstract getShells(cursor?: string): Promise<PagedResult<string>>;
>>>>>>>> development:projects/aas-node/src/app/client/api/api-client.ts

    /**
     * Reads the current value from a submodel element.
     * @param url The path of the submodel element value.
     * @param valueType The
     * @returns The current value.
     */
    public async readValue(url: string, valueType: aas.DataTypeDefXsd): Promise<DefaultType | undefined> {
        const property = await this.http.get<PropertyValue>(new URL(url), this.endpoint.headers);
        return convertFromString(property.value, valueType);
    }

    /**
     * Returns the URL to a Property.
     * @param aas The Asset Administration Shell.
     * @param nodeId The path from the Submodel to the Property.
     */
    public abstract resolveNodeId(aas: aas.AssetAdministrationShell, nodeId: string): string;

    /**
     * Gets all concept description identifiers that are available in the specified referable and its descendants.
     * @param referable The current referable.
     * @returns The available semantic identifiers.
     */
    protected getConceptDescriptionIds(referable: aas.Referable): Set<string> {
        const result = new Set<string>();
        for (const element of traverse(referable)) {
            const id = getSemanticId(element);
            if (id) {
                result.add(id);
            }
        }

        return result;
    }
}
