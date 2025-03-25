/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { AASDocument } from 'aas-core';
import { Logger } from '../logging/logger.js';
import { AASApiClient, AASLabel } from '../package/aas-api/aas-api-client.js';
import { AASApiPackage } from '../package/aas-api/aas-api-package.js';
import { AASServerScan } from './aas-server-scan.js';
import { PagedResult } from '../types/paged-result.js';

export class AASApiServerScan extends AASServerScan {
    private readonly logger: Logger;
    private readonly client: AASApiClient;

    public constructor(logger: Logger, server: AASApiClient) {
        super();

        this.logger = logger;
        this.client = server;
    }

    protected override open(): Promise<void> {
        return this.client.open();
    }
    protected override close(): Promise<void> {
        return this.client.close();
    }

    protected override createDocument(id: AASLabel): Promise<AASDocument> {
        const aasPackage = new AASApiPackage(this.logger, this.client, id.id, id.idShort);
        return aasPackage.createDocumentAsync();
    }

    protected override nextEndpointPage(cursor: string | undefined): Promise<PagedResult<AASLabel>> {
        return this.client.getShells(cursor);
    }
}
