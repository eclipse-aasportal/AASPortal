/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { AASContainer } from 'common';
import { Logger } from '../logging/logger.js';
import { AASEndpointScan } from './aas-endpoint-scan.js';
import { ServerMessage } from '../packages/server-message.js';
import { createEndpoint } from '../configuration.js';
import { AssetAdministrationShellDescriptor } from 'registry.js';

export class AASRegistryScan extends AASEndpointScan {
    private readonly registry = new ServerMessage();
    private readonly url: URL;

    constructor(
        private readonly logger: Logger,
        private readonly endpoint: string,
        private readonly containers: AASContainer[]) {
        super();

        this.url = new URL(endpoint.split('?')[0]);
    }

    public async scanAsync(): Promise<void> {
        try {
            const descriptors = await this.getAASDescriptorsAsync();
            this.computeDifference(descriptors);
        } catch (error) {
            this.logger.debug(`AAS registry not available: ${error?.message}`);
        }
    }

    private computeDifference(descriptors: AssetAdministrationShellDescriptor[]): void {
        const current = new Map<string, AASContainer>(this.containers.map(item => [item.url, item]));
        const reference = new Map<string, AASContainer>();
        for (const descriptor of descriptors) {
            let url: string | undefined;
            switch (descriptor.endpoints[0].type) {
                case 'http':
                    url = this.containerUrl(descriptor.endpoints[0].address);
                    break;
                case 'opc':
                    url = descriptor.endpoints[0].address;
                    break;
                default:
                    throw new Error(`'${descriptor.endpoints[0].type}' is a not supported endpoint type.`);
            }

            if (url) {
                const container = reference.get(url);
                if (!container) {
                    reference.set(url, { url: url, name: '' });
                }
            }
        }

        for (const entry of reference) {
            if (!current.has(entry[0])) {
                this.emit('added', this.endpoint, entry[1]);
            }
        }

        for (const entry of current) {
            if (!reference.has(entry[0])) {
                this.emit('removed', this.endpoint, entry[1]);
            }
        }
    }

    private containerUrl(value: string): string | undefined {
        try {
            return createEndpoint(value).href;
        } catch (error) {
            this.logger.error(`'${value}' is an invalid URL.`);
            return undefined;
        }
    }

    private async getAASDescriptorsAsync(): Promise<AssetAdministrationShellDescriptor[]> {
        const obj = await this.registry.get<AssetAdministrationShellDescriptor[] | AssetAdministrationShellDescriptor>(this.url);
        const descriptors = Array.isArray(obj) ? obj : [obj];
        return descriptors.filter(d => d.endpoints.length > 0);
    }
}