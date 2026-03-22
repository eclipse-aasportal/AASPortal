/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { AASDocument, PagedResult } from 'aas-core';
import { OpcuaClient } from '../client/opcua/opcua-client.js';
import { EndpointScanner } from './endpoint-scanner.js';

export class OpcuaServerScanner extends EndpointScanner {
    public constructor(private readonly client: OpcuaClient) {
        super();
    }

    protected override open(): Promise<void> {
        return this.client.open();
    }

    protected override close(): Promise<void> {
        return this.client.close();
    }

    protected override async getDocuments(cursor: string | undefined): Promise<PagedResult<AASDocument>> {
        return await this.client.getDocuments(cursor);
    }

    protected override getDocument(address: string): Promise<AASDocument | undefined> {
        return this.client.createDocument(address);
    }
}
