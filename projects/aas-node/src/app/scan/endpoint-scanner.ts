/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import EventEmitter from 'events';
import { AASDocument, AASEndpoint, convertToString, PagedResult } from 'aas-core';
import { AASIndex } from '../index/aas-index.js';

/**
 * Defines an automate to scan an AAS endpoint for new, deleted or updated Asset Administration Shells.
 */
export abstract class EndpointScanner extends EventEmitter {
    /**
     * Gets all documents of the current endpoint.
     * @param index The AAS index.
     * @param endpoint The endpoint.
     */
    public async scanAsync(index: AASIndex, endpoint: AASEndpoint): Promise<void> {
        try {
            await this.open();
            let endpointCursor: string | undefined;
            do {
                const result = await this.getDocuments(endpointCursor);
                for (const b of result.result) {
                    const a = await index.find(b.endpoint, 'AssetAdministrationShell', b.id);
                    if (a === undefined) {
                        this.emit('add', b);
                    }
                }

                endpointCursor = result.paging_metadata.cursor;
            } while (endpointCursor);

            let indexCursor: string | undefined;
            do {
                const result = await index.getEndpointDocuments(endpoint.name, indexCursor);
                for (const a of result.result) {
                    const b = await this.getDocument(a.address);
                    if (b === undefined) {
                        this.emit('remove', a);
                    } else {
                        this.emit('compare', a, b);
                    }
                }

                indexCursor = result.paging_metadata.cursor;
            } while (indexCursor);
        } catch (error) {
            this.emit('error', `Scanning endpoint "${endpoint.name}" failed: ${convertToString(error)}`);
        } finally {
            await this.close();
        }
    }

    /**
     * Opens the endpoint and prepares it for scanning.
     */
    protected abstract open(): Promise<void>;

    /**
     * Closes the endpoint and releases all resources.
     */
    protected abstract close(): Promise<void>;

    /**
     * Gets a next page of document addresses from the endpoint.
     * @param cursor The cursor for pagination. If undefined, the first page will be returned.
     */
    protected abstract getDocuments(cursor: string | undefined): Promise<PagedResult<AASDocument>>;

    /**
     * Gets the document with the specified address from the endpoint.
     * @param address The address of the document in the endpoint.
     */
    protected abstract getDocument(address: string): Promise<AASDocument | undefined>;
}
