/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { AASDocument, PagedResult } from 'aas-core';
import { AasxDirectory } from '../client/fs/aasx-directory.js';
import { EndpointScanner } from './endpoint-scanner.js';

/**
 * Defines an automate to scan a directory for new, deleted or updated Asset Administration Shells.
 */
export class DirectoryScanner extends EndpointScanner {
    public constructor(private readonly client: AasxDirectory) {
        super();
    }

    protected override async open(): Promise<void> {
        await this.client.open();
    }

    protected override async close(): Promise<void> {
        await this.client.close();
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
