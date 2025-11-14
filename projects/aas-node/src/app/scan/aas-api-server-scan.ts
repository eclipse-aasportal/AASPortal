/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { AASDocument, PagedResult } from 'aas-core';
import { ApiClient } from '../client/api/api-client.js';
import { AASServerScan } from './aas-server-scan.js';

export class AASApiServerScan extends AASServerScan {
    public constructor(private readonly client: ApiClient) {
        super();
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
