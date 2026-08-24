/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { aas, AASEndpoint, convertFromString, DefaultType, LiveRequest } from 'aas-core';
import { Logger } from 'aas-package';

import { HttpClient } from '../../http-client.js';
import { HttpSubscription } from '../../live/http/http-subscription.js';
import { SocketClient } from '../../live/socket-client.js';
import { EndpointClient } from '../endpoint-client.js';
import { SocketSubscription } from '../../live/socket-subscription.js';
import { AasxPackage } from '../fs/aasx-package.js';
import { AASIndexClient } from '../../index/aas-index-client.js';

interface PropertyValue {
    value: string;
}

/**
 * Provides access to an AAS API endpoint.
 */
export abstract class ApiClient extends EndpointClient {
    private reentry = 0;

    /**
     * @param logger The logger.
     * @param endpoint The AAS endpoint
     * @param auth The authentication/authorization parameter.
     * @param http The HTTP client.
     */
    public constructor(
        logger: Logger,
        index: AASIndexClient,
        endpoint: AASEndpoint,
        auth: Record<string, string> | undefined,
        protected readonly http: HttpClient,
    ) {
        super(logger, index, endpoint, auth);
    }

    public override get isOpen(): boolean {
        return this.reentry > 0;
    }

    public override async test(): Promise<void> {
        if (this.reentry === 0) {
            await this.http.checkUrlExist(this.endpoint.url, this.auth);
        }
    }

    public override open(): Promise<void> {
        ++this.reentry;
        return Promise.resolve();
    }

    public override close(): Promise<void> {
        return new Promise(resolve => {
            if (this.reentry > 0) {
                --this.reentry;
            }

            resolve();
        });
    }

    public override async determineAddress(aasxFile: string): Promise<string | undefined> {
        const aasxPackage = await AasxPackage.createFromFile(aasxFile);
        const env = await aasxPackage.getEnvironment();
        return env.assetAdministrationShells?.at(0)?.id;
    }

    public override createSubscription(
        client: SocketClient,
        request: LiveRequest,
        env: aas.Environment,
    ): SocketSubscription {
        return new HttpSubscription(this, client, request, env);
    }

    /**
     * Reads the current value from a submodel element.
     * @param url The path of the submodel element value.
     * @param valueType The
     * @returns The current value.
     */
    public async readValue(url: string, valueType: aas.DataTypeDefXsd): Promise<DefaultType | undefined> {
        const property = await this.http.get<PropertyValue>(new URL(url), this.auth);
        return convertFromString(property.value, valueType);
    }

    /**
     * Returns the URL to a Property.
     * @param aas The Asset Administration Shell.
     * @param nodeId The path from the Submodel to the Property.
     */
    public abstract resolveNodeId(aas: aas.AssetAdministrationShell, nodeId: string): string;

    /**
     * Gets the ConceptDescription with the specified identifier.
     * @param id The identifier of the ConceptDescription.
     */
    protected abstract getConceptDescription(id: string): Promise<aas.ConceptDescription>;

    /**
     * Gets the ConceptDescriptions referenced by all submodels of the given shell.
     * @param shell The AssetAdministrationShell
     * @returns A promise resolving to an array of ConceptDescriptions
     */
    protected async getShellConceptDescriptions(
        shell: aas.AssetAdministrationShell,
    ): Promise<aas.ConceptDescription[]> {
        if (!shell.submodels) {
            return [];
        }

        const set = new Set<string>();
        await Promise.all(
            shell.submodels.map(async submodelRef => {
                (
                    await this.index.getSubmodelConceptDescriptionIds(this.endpoint.name, submodelRef.keys[0].value)
                ).forEach(id => set.add(id));
            }),
        );

        const result = await Promise.allSettled(
            Array.from(set.values()).map(id => {
                return this.getConceptDescription(id);
            }),
        );

        const conceptDescriptions: aas.ConceptDescription[] = [];
        result.forEach(item => {
            if (item.status === 'fulfilled') {
                conceptDescriptions.push(item.value);
            } else {
                this.logger.warning(`Failed to retrieve concept description: ${item.reason}`);
            }
        });

        return conceptDescriptions;
    }
}
