/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { AASDocument } from 'aas-core';
import { Logger } from '../logging/logger.js';
import { AasxPackage } from '../packages/file-system/aasx-package.js';
import { AasxDirectory } from '../packages/file-system/aasx-directory.js';
import { AASResourceScan } from './aas-resource-scan.js';
import { PagedResult } from '../types/paged-result.js';

export class DirectoryScan extends AASResourceScan {
    public constructor(
        private readonly logger: Logger,
        private readonly source: AasxDirectory,
    ) {
        super();
    }

    public async scanAsync(cursor?: string): Promise<PagedResult<AASDocument>> {
        try {
            await this.source.openAsync();
            const result = await this.source.getFiles(cursor);
            const documents: AASDocument[] = [];
            for (const file of result.result) {
                try {
                    const aasxPackage = new AasxPackage(this.logger, this.source, file);
                    const document = await aasxPackage.createDocumentAsync();
                    documents.push(document);
                    this.emit('scanned', document);
                } catch (error) {
                    this.emit('error', error, this.source, file);
                }
            }

            return { result: documents, paging_metadata: { cursor: result.paging_metadata.cursor } };
        } finally {
            await this.source.closeAsync();
        }
    }
}
