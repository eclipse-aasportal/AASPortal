/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { AASContainer, AASEndpoint } from "common";
import { Logger } from "../logging/logger.js";
import { OpcuaServer } from "../packages/opcua/opcua-server.js";
import { AASEndpointScan } from "./aas-endpoint-scan.js";

export class OpcuaEndpointScan extends AASEndpointScan {
    constructor(
        private readonly logger: Logger,
        private readonly endpoint: AASEndpoint,
        private readonly containers: AASContainer[]) {
        super();
    }

    public async scanAsync(): Promise<void> {
        const source = new OpcuaServer(this.logger, this.endpoint.url, this.endpoint.name);
        try {
            await source.openAsync();
            if (this.containers.every(item => item.url !== this.endpoint.url)) {
                this.emit('added', this.endpoint, { ...this.endpoint });
            }
        } catch (error) {
            if (this.containers.some(item => item.url === this.endpoint.url)) {
                this.emit('removed', this.endpoint, { ...this.endpoint });
            }
        } finally {
            await source.closeAsync();
        }
    }
}