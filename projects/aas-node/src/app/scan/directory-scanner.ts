/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
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
    private readonly map = new Map<string, AASDocument>();

    public constructor(private readonly client: AasxDirectory) {
        super();
    }

    protected override async open(): Promise<void> {
        this.map.clear();
        await this.client.open();
    }

    protected override async close(): Promise<void> {
        this.map.clear();
        await this.client.close();
    }

    protected override createDocument(filename: string): Promise<AASDocument> {
        return new Promise((resolve, reject) => {
            const document = this.map.get(filename);
            if (document) {
                resolve(document);
            } else {
                reject(new Error(`${filename} not found.`));
            }
        });
    }

    protected override async nextEndpointPage(cursor: string | undefined): Promise<PagedResult<string>> {
        const result = await this.client.getFiles(cursor);
        const filenames: string[] = [];
        for (const filename of result.result) {
            try {
                const document = await this.client.createDocument(filename);
                filenames.push(document.address);
                this.map.set(document.address, document);
            } catch (error) {
                this.emit('error', error, this.client, filename);
            }
        }

        return { result: filenames, paging_metadata: {} };
    }
}
