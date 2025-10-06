/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { aas, types } from 'aas-core';
import { DatabaseCommand } from '../database-command.js';
import { DatabaseEnvironment, DatabaseKey, IdentifiableItem, PackageItem } from '../database-types.js';
import { Database } from '../database.js';
import { ApplicationError } from '../../application-error.js';
import { ERROR } from '../../error.js';
import { PackageTable } from '../package-table.js';
import { IdentifiableTable } from '../identifiable-table.js';
import { KeyList } from '../key-list.js';

export class UpdatePackageCommand extends DatabaseCommand<boolean> {
    private table: PackageTable;
    private packageKey: DatabaseKey = NaN;

    public constructor(
        database: Database,
        private readonly packageId: string,
        private readonly sourceFile: string,
        private readonly filename: string,
        private readonly environment: types.Environment,
    ) {
        super(database);

        this.table = database.packages;
    }

    public override async execute(): Promise<boolean> {
        this.packageKey = await this.table.getKey(this.packageId);
        const packageItem = await this.getPackageItem();
        packageItem.filename = this.filename;
        packageItem.environment = await this.update(packageItem.environment);
        this.table.update(this.sourceFile, this.packageKey);
        return true;
    }

    private async getPackageItem(): Promise<PackageItem> {
        const page = await this.table.getEditablePage(this.packageKey);
        const item = page.items[this.packageKey % this.table.pageSize];
        if (item === null) {
            throw new ApplicationError(
                `An AASX package with the identifier ${this.packageId} does not exist.`,
                ERROR.AASX_PACKAGE_DOES_NOT_EXIST,
                404,
            );
        }

        return item;
    }

    private async update(state: DatabaseEnvironment): Promise<DatabaseEnvironment> {
        return {
            assetAdministrationShells: await this.updateIdentifiables(
                this.database.shells,
                this.environment.assetAdministrationShells ?? [],
                state.assetAdministrationShells,
            ),
            submodels: await this.updateIdentifiables(
                this.database.submodels,
                this.environment.submodels ?? [],
                state.submodels,
            ),
            conceptDescriptions: await this.updateIdentifiables(
                this.database.conceptDescriptions,
                this.environment.conceptDescriptions ?? [],
                state.conceptDescriptions,
            ),
        };
    }

    private async updateIdentifiables(
        table: IdentifiableTable<aas.Identifiable>,
        identifiables: types.IIdentifiable[],
        keys: DatabaseKey[],
    ): Promise<DatabaseKey[]> {
        const result: DatabaseKey[] = [];
        for (const identifiable of identifiables) {
            if (identifiable === null) {
                continue;
            }

            let key = await table.findKey(identifiable.id);
            if (key === undefined) {
                key = table.createKey();
                const page = await table.getEditablePage(key);
                const item: IdentifiableItem = {
                    key,
                    id: identifiable.id,
                    idShort: identifiable.idShort,
                    packageKeys: [this.packageKey],
                };

                const index = key % this.table.pageSize;
                ++page.count;
                if (index < page.items.length) {
                    page.items[index] = item;
                } else if (index === page.items.length) {
                    page.items.push(item);
                } else {
                    throw new Error('Invalid operation.');
                }

                await this.table.setKey(identifiable.id, key);
                table.writeFile(identifiable, key);
                result.push(key);
            } else {
                const page = await table.getEditablePage(key);
                const item = page.items[key % this.table.pageSize];
                if (item === null) {
                    throw new Error('Invalid operation.');
                }

                item.idShort = identifiable.idShort;
                new KeyList(item.packageKeys).add(key);
                table.writeFile(identifiable, key);

                result.push(item.key);
                keys = keys.filter(item => item !== key);
            }
        }

        for (const key of keys) {
            const page = await table.getEditablePage(key);
            const itemIndex = key % this.table.pageSize;
            const item = page.items[itemIndex];
            if (item === null) {
                continue;
            }

            page.items[itemIndex] = null;
            await table.deleteFile(key);
        }

        return result;
    }
}
