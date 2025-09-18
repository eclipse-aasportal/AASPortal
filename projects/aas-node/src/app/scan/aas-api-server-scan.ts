/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { AASDocument } from 'aas-core';
import { Logger } from '../logging/logger.js';
import { ApiClient, AASLabel } from '../package/api/api-client.js';
import { ApiPackage } from '../package/api/api-package.js';
import { AASServerScan } from './aas-server-scan.js';
import { PagedResult } from '../types/paged-result.js';

export class AASApiServerScan extends AASServerScan {
    private readonly logger: Logger;
    private readonly client: ApiClient;

    public constructor(logger: Logger, server: ApiClient) {
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
        const aasPackage = new ApiPackage(this.logger, this.client, id.id, id.idShort);
        return aasPackage.createDocument();
    }

    protected override nextEndpointPage(cursor: string | undefined): Promise<PagedResult<AASLabel>> {
        return this.client.getShells(cursor);
    }
}
