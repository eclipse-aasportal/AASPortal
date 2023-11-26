/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { AASContainer, AASEndpoint } from "common";
import { Logger } from "../logging/logger.js";
import { AASResourceFactory } from "../packages/aas-resource-factory.js";
import { AASEndpointScan } from "./aas-endpoint-scan.js";

export class AASXServerEndpointScan extends AASEndpointScan {
    constructor(
        private readonly logger: Logger,
        private readonly resourceFactory: AASResourceFactory,
        private endpoint: AASEndpoint,
        private containers: AASContainer[]
    ) {
        super();
    }

    public async scanAsync(): Promise<void> {
        const server = this.resourceFactory.create(this.endpoint);
        try {
            await server.openAsync();
            if (this.containers.every(item => item.url !== this.endpoint.url)) {
                this.emit('added', this.endpoint, { ...this.endpoint });
            }
        } catch (error) {
            if (this.containers.some(item => item.url === this.endpoint.url)) {
                this.emit('removed', this.endpoint, { ...this.endpoint });
            }
        } finally {
            await server.closeAsync();
        }
    }
}