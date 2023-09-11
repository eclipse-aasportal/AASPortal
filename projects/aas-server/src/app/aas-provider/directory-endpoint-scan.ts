/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { AASContainer } from "common";
import { FileStorage } from "../file-storage/file-storage.js";
import { Logger } from "../logging/logger.js";
import { AASEndpointScan } from "./aas-endpoint-scan.js";
import { getEndpointName } from '../configuration.js';

export class DirectoryEndpointScan extends AASEndpointScan {

    constructor(
        private readonly logger: Logger,
        private readonly endpoint: string,
        private readonly fileStorage: FileStorage,
        private readonly containers: AASContainer[]) {
        super();
    }

    public async scanAsync(): Promise<void> {
        if (await this.fileStorage.exists('.')) {
            if (this.containers.length === 0) {
                const url = new URL(this.endpoint);
                const container: AASContainer = {
                    url: url.href,
                    name: getEndpointName(url)
                };

                this.emit('added', this.endpoint, container);
            }
        } else {
            if (this.containers.length > 0) {
                this.emit('removed', this.endpoint, this.containers[0]);
            }
        }
    }
}