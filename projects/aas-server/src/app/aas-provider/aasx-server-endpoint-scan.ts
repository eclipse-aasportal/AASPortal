/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { AASContainer } from "common";
import { Logger } from "../logging/logger.js";
import { AASResourceFactory } from "../packages/aas-resource-factory.js";
import { AASEndpointScan } from "./aas-endpoint-scan.js";
import { getEndpointName } from '../configuration.js';

export class AASXServerEndpointScan extends AASEndpointScan {
    constructor(
        private readonly logger: Logger,
        private readonly resourceFactory: AASResourceFactory,
        private endpoint: string,
        private containers: AASContainer[]
    ) {
        super();
    }

    public async scanAsync(): Promise<void> {
        const server = this.resourceFactory.create(this.endpoint);
        try {
            await server.openAsync();
            const url = new URL(this.endpoint);
            if (this.containers.length === 0) {
                const container: AASContainer = {
                    url: url.href,
                    name: getEndpointName(url)
                };

                this.emit('added', this.endpoint, container);
            }
        } catch (error) {
            if (this.containers.length > 0) {
                this.emit('removed', this.endpoint, this.containers[0]);
            }
        } finally {
            await server.closeAsync();
        }
    }
}