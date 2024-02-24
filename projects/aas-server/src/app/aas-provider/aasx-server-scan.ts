/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { AASDocument } from 'common';
import { Logger } from '../logging/logger.js';
import { AASServer } from '../packages/aas-server/aas-server.js';
import { AASServerPackage } from '../packages/aas-server/aas-server-package.js';
import { AASResourceScan } from './aas-resource-scan.js';

export class AASXServerScan extends AASResourceScan {
    private readonly logger: Logger;
    private readonly server: AASServer;

    public constructor(logger: Logger, server: AASServer) {
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
                    const aasxPackage = new AASServerPackage(this.logger, this.server, idShort);
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
