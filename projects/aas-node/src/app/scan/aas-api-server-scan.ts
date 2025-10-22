/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { AASDocument, PagedResult } from 'aas-core';
import { Logger } from '../logging/logger.js';
import { ApiClient } from '../client/api/api-client.js';
import { AASServerScan } from './aas-server-scan.js';

export class AASApiServerScan extends AASServerScan {
    private readonly logger: Logger;
    private readonly client: ApiClient;

    public constructor(logger: Logger, client: ApiClient) {
        super();

        this.logger = logger;
        this.client = client;
    }

    protected override open(): Promise<void> {
        return this.client.open();
    }
    protected override close(): Promise<void> {
        return this.client.close();
    }

    protected override createDocument(id: string): Promise<AASDocument> {
        return this.client.createDocument(id);
    }

    protected override nextEndpointPage(cursor: string | undefined): Promise<PagedResult<string>> {
        return this.client.getShells(cursor);
    }
}
