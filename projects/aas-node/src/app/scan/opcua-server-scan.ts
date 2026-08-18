/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { aas, AASDocument, PagedResult } from 'aas-core';
import { OpcuaClient } from '../client/opcua/opcua-client.js';
import { EndpointScan } from './endpoint-scan.js';
import { ScanController } from './scan-controller.js';
import { thumbnailToObjectUrl } from '../utilities.js';

export class OpcuaServerScan extends EndpointScan {
    public constructor(
        controller: ScanController,
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

    protected override getConceptDescriptions(): Promise<PagedResult<aas.ConceptDescription>> {
        return this.client.getConceptDescriptions();
    }
}
