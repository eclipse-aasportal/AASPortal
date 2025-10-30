/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import path from 'path';
import fs from 'fs';

import { aas, jsonization, types } from 'aas-core';
import { DatabaseKey, DatabaseTableData, IdentifiableItem } from './database-types.js';
import { Database } from './database.js';
import { DatabaseTable } from './database-table.js';
import { ERROR } from '../error.js';

export abstract class IdentifiableTable<TResult extends aas.Identifiable> extends DatabaseTable<
    IdentifiableItem,
    TResult
> {
    protected constructor(name: string, database: Database, data: DatabaseTableData, clusterSize: number, dir: string) {
        super(name, database, data, clusterSize, dir, '.json');
    }

    public async writeFile(identifiable: types.IIdentifiable, key: DatabaseKey): Promise<void> {
        const pageNumber = Math.trunc(key / this.pageSize);
        const dir = path.join(this.dir, pageNumber.toString(), 'files');
        const file = path.join(dir, key + '.json');
        if (fs.existsSync(file)) {
            const backup = path.join(dir, '~' + key + '.json');
            if (fs.existsSync(backup)) {
                await fs.promises.writeFile(file, JSON.stringify(jsonization.toJsonable(identifiable)));
            } else {
                await fs.promises.copyFile(file, backup);
                await fs.promises.writeFile(file, JSON.stringify(jsonization.toJsonable(identifiable)));
                this.database.fileUpdated(backup, file);
            }
        } else {
            if (!fs.existsSync(dir)) {
                await fs.promises.mkdir(dir, { recursive: true });
            }

            await fs.promises.writeFile(file, JSON.stringify(jsonization.toJsonable(identifiable)));
            this.database.fileAdded(file);
        }
    }

    public async getItem(key: DatabaseKey): Promise<IdentifiableItem> {
        const item = await this.get(key);
        if (!item) {
            throw new Error(ERROR.INVALID_OPERATION);
        }

        return item;
    }

    protected override readPageItem(item: IdentifiableItem): Promise<TResult> {
        return this.readJson(item.key);
    }
}
