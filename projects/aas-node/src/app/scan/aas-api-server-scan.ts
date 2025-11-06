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

    protected override async createDocument(id: string): Promise<AASDocument> {
        try {
            this.client.logger.info(`Creating document for AAS "${id}" from endpoint "${this.client.endpoint.name}"`);
            const document = await this.client.createDocument(id);
            this.client.logger.info(`Successfully created document for AAS "${document.idShort}" [${id}]`);
            return document;
        } catch (error) {
            // Log the error to help diagnose why some AAS fail to be indexed
            this.client.logger.error(
                `Failed to create document for AAS "${id}" from endpoint "${this.client.endpoint.name}": ${error?.message || error}`
            );
            throw error;
        }
    }

    protected override nextEndpointPage(cursor: string | undefined): Promise<PagedResult<string>> {
        return this.client.getShells(cursor);
    }
}
