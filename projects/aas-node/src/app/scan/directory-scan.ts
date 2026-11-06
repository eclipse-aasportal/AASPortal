/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { AASDocument, PagedResult } from 'aas-core';
import { AasxDirectory } from '../client/fs/aasx-directory.js';
import { EndpointScan } from './endpoint-scan.js';
import { ScanController } from './scan-controller.js';
import { ConceptDescription, Submodel } from 'aas-core/dist/types/aas.js';
import { thumbnailToObjectUrl } from '../utilities.js';

/**
 * Defines an automate to scan a directory for new, deleted or updated Asset Administration Shells.
 */
export class DirectoryScan extends EndpointScan {
    public constructor(
        controller: ScanController,
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

    protected override getDocuments(cursor: string | undefined): Promise<PagedResult<AASDocument>> {
        return this.client.getDocuments(cursor);
    }

    protected override async getThumbnail(address: string): Promise<string | undefined> {
        return await thumbnailToObjectUrl(await this.client.getThumbnail(address));
    }

    protected override hasDocument(address: string): Promise<boolean> {
        return this.client.hasDocument(address);
    }

    protected override getSubmodels(cursor: string | undefined): Promise<PagedResult<Submodel>> {
        return this.client.getSubmodels(cursor);
    }

    protected override getConceptDescriptions(cursor: string | undefined): Promise<PagedResult<ConceptDescription>> {
        return this.client.getConceptDescriptions(cursor);
    }
}
