/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import path from 'path';
import fs from 'fs';
import { ApplicationError, PackageDescription } from 'aas-core';
import { DatabaseKey, DatabaseTableData, PackageItem } from './database-types.js';
import { Database } from './database.js';
import { DatabaseTable } from './database-table.js';
import { ERROR } from '../error.js';

export class PackageTable extends DatabaseTable<PackageItem, PackageDescription> {
    public constructor(database: Database, data: DatabaseTableData, clusterSize: number, dir: string) {
        super('PackageTable', database, data, clusterSize, dir, '.aasx');
    }

    public async getKey(id: string): Promise<DatabaseKey> {
        const key = await this.findKey(id);
        if (key === undefined) {
            throw new ApplicationError(ERROR.AASX_PACKAGE_DOES_NOT_EXIST, { id }, 404);
        }

        return key;
    }

    public async getItem(key: DatabaseKey): Promise<PackageItem> {
        const item = await this.get(key);
        if (!item) {
            throw new Error(ERROR.INVALID_OPERATION);
        }

        return item;
    }

    public async add(aasxFile: string, key: DatabaseKey): Promise<void> {
        const dir = path.join(this.dir, Math.trunc(key / this.pageSize).toString(), 'files');
        if (!fs.existsSync(dir)) {
            await fs.promises.mkdir(dir, { recursive: true });
        }

        const dest = path.join(dir, key + this.extension);
        await fs.promises.copyFile(aasxFile, dest);
        this.database.fileAdded(dest);
    }

    public async update(aasxFile: string, key: DatabaseKey): Promise<void> {
        await fs.promises.copyFile(aasxFile, await this.createBackup(key));
    }

    protected override async readPageItem(item: PackageItem): Promise<PackageDescription> {
        const aasIds: string[] = [];
        for (const key of item.environment.assetAdministrationShells) {
            const item = await this.database.shells.get(key);
            if (item === null) {
                continue;
            }

            aasIds.push(item.id);
        }

        return { packageId: item.id, aasIds };
    }
}
