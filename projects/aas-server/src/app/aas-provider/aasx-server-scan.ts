/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { AASDocument } from 'common';
import { Logger } from '../logging/logger.js';
import { AasxServer } from '../packages/aasx-server/aasx-server.js';
import { AasxServerPackage } from '../packages/aasx-server/aasx-server-package.js';
import { AASResourceScan } from './aas-resource-scan.js';

export class AASXServerScan extends AASResourceScan {
    private readonly logger: Logger;
    private readonly server: AasxServer;

    public constructor(logger: Logger, server: AasxServer) {
        super();

        this.logger = logger;
        this.server = server;
    }

    public async scanAsync(): Promise<AASDocument[]> {
        try {
            await this.server.openAsync();
            const documents: AASDocument[] = [];
            const listAAS = await this.server.getShellsAsync();
            for (const idShort of listAAS) {
                try {
                    const aasxPackage = new AasxServerPackage(this.logger, this.server, idShort);
                    const document = await aasxPackage.createDocumentAsync();
                    documents.push(document);
                    this.emit('scanned', document);
                } catch (error) {
                    this.emit('error', error, this.server, idShort);
                }
            }

            return documents;
        } finally {
            await this.server.closeAsync();
        }
    }
}