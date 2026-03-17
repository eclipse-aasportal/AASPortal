/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, singleton } from 'tsyringe';
import { ApplicationError, PagedResult } from 'aas-core';
import { Database } from './db/database.js';
import { ERROR } from './error.js';

@singleton()
export class Discovery {
    public constructor(@inject(Database) private readonly db: Database) {}

    public async getAASIdsByAssetLink(
        assetIds: string[],
        limit: number,
        cursor: string | undefined,
    ): Promise<PagedResult<string>> {
        const assetIndex = this.db.assetIndex;
        const result: string[] = [];
        const start = cursor ? (JSON.parse(cursor) as [number, number]) : [0, 0];
        for (let i = start[0], n = assetIds.length; i < n; i++) {
            const key = await assetIndex.findKey(assetIds[i]);
            if (key === undefined) {
                throw new ApplicationError(ERROR.INVALID_ASSET_ID, { id: assetIds[i] }, 404);
            }

            const tableRefs = await assetIndex.getTableRefs(key);
            for (let j = start[1], m = tableRefs.length; j < m; j++) {
                if (result.length >= limit) {
                    return { result, paging_metadata: { cursor: JSON.stringify([i, j]) } };
                }

                const [table, key] = tableRefs[j];
                const linkedItem = await this.db.getTable(table).getItem(key);
                if (linkedItem) {
                    result.push(linkedItem.id);
                }
            }
        }

        return { result, paging_metadata: {} };
    }
}
