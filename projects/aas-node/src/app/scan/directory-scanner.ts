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
import { ScannerController } from './scanner-controller.js';
import { Submodel } from 'aas-core/dist/types/aas.js';
import { thumbnailToObjectUrl } from '../utilities.js';

/**
 * Defines an automate to scan a directory for new, deleted or updated Asset Administration Shells.
 */
export class DirectoryScanner extends EndpointScanner {
    public constructor(
        controller: ScannerController,
        private readonly client: AasxDirectory,
    ) {
        super(controller);
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

    protected override async getThumbnail(address: string): Promise<string | undefined> {
        return thumbnailToObjectUrl(await this.client.getThumbnail(address));
    }

    protected override async hasDocument(address: string): Promise<boolean> {
        return await this.client.hasDocument(address);
    }

    protected override async getSubmodels(cursor: string | undefined): Promise<PagedResult<Submodel>> {
        return await this.client.getSubmodels(cursor);
    }
}
