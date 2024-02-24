/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { aas, convertFromString, DefaultType, DifferenceItem, LiveRequest } from 'common';
import { ServerMessage } from '../server-message.js';
import { Logger } from '../../logging/logger.js';
import { HttpSubscription } from '../../live/http/http-subscription.js';
import { SocketClient } from '../../live/socket-client.js';
import { AASPackage } from '../aas-package.js';
import { AASResource } from '../aas-resource.js';
import { AASServerPackage } from './aas-server-package.js';
import { SocketSubscription } from '../../live/socket-subscription.js';

interface PropertyValue {
    value: string;
}

/** Provides access to an AASX-Server. */
export abstract class AASServer extends AASResource {
    private reentry = 0;

    /**
     * @param url The URL of the AASX-Server.
     */
    public constructor(logger: Logger, url: string, name: string) {
        super(logger, url, name);
    }

    protected readonly message = new ServerMessage();

    public get isOpen(): boolean {
        return this.reentry > 0;
    }

    public async testAsync(): Promise<void> {
        if (this.reentry === 0) {
            try {
                await this.openAsync();
            } finally {
                await this.closeAsync();
            }
        }
    }

    /**
     * Reads the environment of the AAS with the specified identifier.
     * @param id The AAS identifier.
     * @returns
     */
    public abstract readEnvironmentAsync(id: string): Promise<aas.Environment>;

    /** Gets the thumbnail of the AAS with the specified identifier.
     * @param id The identifier of the current AAS.
     */
    public abstract getThumbnailAsync(id: string): Promise<NodeJS.ReadableStream>;

    public async openAsync(): Promise<void> {
        if (this.reentry === 0) {
            await this.message.checkUrlExist(this.url);
        }

        ++this.reentry;
    }

    public closeAsync(): Promise<void> {
        return new Promise(resolve => {
            if (this.reentry > 0) {
                --this.reentry;
            }

            resolve();
        });
    }

    public createPackage(address: string): AASPackage {
        return new AASServerPackage(this.logger, this, address);
    }

    public override createSubscription(
        client: SocketClient,
        message: LiveRequest,
        env: aas.Environment,
    ): SocketSubscription {
        return new HttpSubscription(this.logger, this, client, message, env);
    }

    /**
     * Gets the names of the Asset Administration Shells contained in the current AASX server.
     * @returns The names of the AASs contained in the current AASX server.
     */
    public abstract getShellsAsync(): Promise<string[]>;

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
        const property = await this.message.get<PropertyValue>(new URL(url));
        return convertFromString(property.value, valueType);
    }

    /**
     * Returns the URL to a Property.
     * @param aas The Asset Administration Shell.
     * @param nodeId The path from the Submodel to the Property.
     */
    public abstract resolveNodeId(aas: aas.AssetAdministrationShell, nodeId: string): string;
}
