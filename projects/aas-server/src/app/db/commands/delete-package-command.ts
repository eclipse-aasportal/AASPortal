/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { aas, ApplicationError } from 'aas-core';
import { DatabaseCommand } from '../database-command.js';
import { DatabaseKey } from '../database-types.js';
import { Database } from '../database.js';
import { ERROR } from '../../error.js';
import { IdentifiableTable } from '../identifiable-table.js';
import { PackageTable } from '../package-table.js';
import { KeyList } from '../key-list.js';

export class DeletePackageCommand extends DatabaseCommand<void> {
    private readonly table: PackageTable;

    public constructor(
        database: Database,
        private readonly packageId: string,
    ) {
        super(database);

        this.table = this.database.packages;
    }

    public override async execute(): Promise<void> {
        const key = await this.table.getKey(this.packageId);
        const index = key % this.table.pageSize;
        const page = await this.table.getEditablePage(key);
        const item = page.items[index];
        if (item === null) {
            throw new ApplicationError(
                ERROR.AASX_PACKAGE_DOES_NOT_EXIST,
                {
                    packageId: this.packageId,
                },
                404,
            );
        }

        await this.removePackageId(this.database.shells, item.environment.assetAdministrationShells, key);
        await this.removePackageId(this.database.submodels, item.environment.submodels, key);
        await this.removePackageId(this.database.conceptDescriptions, item.environment.conceptDescriptions, key);

        page.items[index] = null;
        await this.table.deleteFile(key);
        await this.table.deleteKey(this.packageId);
    }

    private async removePackageId(
        table: IdentifiableTable<aas.Identifiable>,
        keys: DatabaseKey[],
        packageKey: DatabaseKey,
    ): Promise<void> {
        for (const key of keys) {
            const page = await table.getEditablePage(key);
            const itemIndex = key % table.pageSize;
            const item = page.items[itemIndex];
            if (item === null) {
                throw new Error('Invalid operation.');
            }

            new KeyList(item.packageKeys).remove(packageKey);
            if (item.packageKeys.length === 0) {
                await table.deleteFile(key);
                await table.deleteKey(item.id);
                page.items[itemIndex] = null;
            }
        }
    }
}
