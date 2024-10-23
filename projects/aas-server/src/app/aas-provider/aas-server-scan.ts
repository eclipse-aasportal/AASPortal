/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { AASDocument } from 'aas-core';
import { Logger } from '../logging/logger.js';
import { AASApiClient } from '../packages/aas-server/aas-api-client.js';
import { AASServerPackage } from '../packages/aas-server/aas-server-package.js';
import { AASResourceScan } from './aas-resource-scan.js';

export class AASServerScan extends AASResourceScan {
    private readonly logger: Logger;
    private readonly server: AASApiClient;

    private static set = new Set<string>();

    public constructor(logger: Logger, server: AASApiClient) {
        super();

        this.logger = logger;
        this.server = server;
    }

    public async scanAsync(): Promise<void> {
        try {
            await this.server.openAsync();

            const documents: AASDocument[] = [];
            const result = await this.server.getShellsAsync();
            const ids = new Set(result.result);
            for (const id of ids) {
                if (AASServerScan.set.has(id)) {
                    AASServerScan.set.delete(id);
                } else {
                    AASServerScan.set.add(id);
                }
                
                try {
                    const aasPackage = new AASServerPackage(this.logger, this.server, id);
                    const document = await aasPackage.createDocumentAsync();
                    documents.push(document);
                    this.emit('scanned', document);
                } catch (error) {
                    this.emit('error', error, this.server, id);
                }
            }
        } finally {
            await this.server.closeAsync();
        }
    }
}
