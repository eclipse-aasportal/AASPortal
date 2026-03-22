/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { AASDocument, PagedResult } from 'aas-core';
import { ApiClient } from '../client/api/api-client.js';
import { EndpointScanner } from './endpoint-scanner.js';

/**
 * Implements an automate to scan an AAS server for new, deleted or updated Asset Administration Shells.
 */
export class AASServerScanner extends EndpointScanner {
    public constructor(private readonly client: ApiClient) {
        super();
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
    protected override getDocuments(cursor: string | undefined): Promise<PagedResult<AASDocument>> {
        return this.client.getDocuments(cursor);
    }

    protected override getDocument(address: string): Promise<AASDocument | undefined> {
        return this.client.createDocument(address);
    }
}
