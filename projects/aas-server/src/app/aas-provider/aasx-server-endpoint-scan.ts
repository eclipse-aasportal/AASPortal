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
            if (this.containers.length === 0) {
                const container: AASContainer = { ...this.endpoint };
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