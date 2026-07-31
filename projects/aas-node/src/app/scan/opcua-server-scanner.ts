/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { aas, AASDocument, PagedResult } from 'aas-core';
import { OpcuaClient } from '../client/opcua/opcua-client.js';
import { EndpointScanner } from './endpoint-scanner.js';
import { ScannerController } from './scanner-controller.js';
import { thumbnailToObjectUrl } from '../utilities.js';

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

    protected override async getDocuments(): Promise<PagedResult<AASDocument>> {
        return await this.client.getDocuments();
    }

    protected override async hasDocument(address: string): Promise<boolean> {
        return await this.client.hasDocument(address);
    }

    protected override async getThumbnail(address: string): Promise<string | undefined> {
        return thumbnailToObjectUrl(await this.client.getThumbnail(address));
    }

    protected override getSubmodels(): Promise<PagedResult<aas.Submodel>> {
        return this.client.getSubmodels();
    }
}
