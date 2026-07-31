/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { aas, AASDocument, PagedResult } from 'aas-core';
import { ApiClient } from '../client/api/api-client.js';
import { EndpointScanner } from './endpoint-scanner.js';
import { ScannerController } from './scanner-controller.js';
import { thumbnailToObjectUrl } from '../utilities.js';

/**
 * Implements an automate to scan an AAS server for new, deleted or updated Asset Administration Shells.
 */
export class AASServerScanner extends EndpointScanner {
    public constructor(
        controller: ScannerController,
        private readonly client: ApiClient,
    ) {
        super(controller);
    }

    /**
     * Opens the connection to the AAS server.
     */
    protected override open(): Promise<void> {
        return this.client.open();
    }

    /**
     * Closes the connection to the AAS server.
     */
    protected override close(): Promise<void> {
        return this.client.close();
    }

    /**
     * Returns a page of AAS identifiers from the endpoint.
     * @param cursor The cursor for pagination. If undefined, the first page will be returned.
     * @returns A page of AAS identifiers.
     */
    protected override async getDocuments(cursor: string | undefined): Promise<PagedResult<AASDocument>> {
        return this.client.getDocuments(cursor);
    }

    protected override async hasDocument(address: string): Promise<boolean> {
        return await this.client.hasDocument(address);
    }

    protected override async getThumbnail(id: string): Promise<string | undefined> {
        try {
            return thumbnailToObjectUrl(await this.client.getThumbnail(id));
        } catch {
            return undefined;
        }
    }

    protected override getSubmodels(cursor: string | undefined): Promise<PagedResult<aas.Submodel>> {
        return this.client.getSubmodels(cursor);
    }
}
