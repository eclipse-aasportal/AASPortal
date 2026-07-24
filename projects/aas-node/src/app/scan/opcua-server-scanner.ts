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
import { ScannerController } from './scanner-controller.js';

export class OpcuaServerScanner extends EndpointScanner {
    public constructor(
        controller: ScannerController,
        private readonly client: OpcuaClient,
    ) {
        super(controller);
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

    protected override async getDocument(address: string): Promise<AASDocument | undefined> {
        try {
            return await this.client.createDocument(address);
        } catch {
            return undefined;
        }
    }
}
