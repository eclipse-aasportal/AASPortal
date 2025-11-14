/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { AASDocument, PagedResult } from 'aas-core';
import { AasxDirectory } from '../client/fs/aasx-directory.js';
import { AASServerScan } from './aas-server-scan.js';

export class DirectoryScan extends AASServerScan {
    private readonly map = new Map<string, AASDocument>();

    public constructor(private readonly client: AasxDirectory) {
        super();
    }

    protected override open(): Promise<void> {
        this.map.clear();
        return this.client.open();
    }

    protected override close(): Promise<void> {
        this.map.clear();
        return this.client.close();
    }

    protected override createDocument(filename: string): Promise<AASDocument> {
        const document = this.map.get(filename);
        return document ? Promise.resolve(document) : Promise.reject(new Error(`${filename} not found.`));
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
