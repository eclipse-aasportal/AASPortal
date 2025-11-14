/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { v4 as uuid } from 'uuid';
import { aas, ApplicationError, types } from 'aas-core';

import { DatabaseEnvironment, DatabaseKey, PackageItem, IdentifiableItem } from '../database-types.js';
import { DatabaseCommand } from '../database-command.js';
import { Database } from '../database.js';
import { IdentifiableTable } from '../identifiable-table.js';
import { PackageTable } from '../package-table.js';
import { KeyList } from '../key-list.js';
import { hasSubmodel, referenceToString } from '../../utilities.js';
import { ERROR } from '../../error.js';
import { AasxPackage } from '../../aasx-package.js';

export class AddPackageCommand extends DatabaseCommand<string> {
    private readonly table: PackageTable;

    public constructor(
        database: Database,
        private readonly sourceFile: string,
        private readonly filename: string,
        private readonly env?: types.Environment,
    ) {
        super(database);

        this.table = database.packages;
    }

    public async execute(): Promise<string> {
        const aasx = await AasxPackage.createFromFile(this.sourceFile);
        const env = this.env ?? (await aasx.getEnvironment());
        const environment: DatabaseEnvironment = {
            assetAdministrationShells: [],
            submodels: [],
            conceptDescriptions: [],
        };

        this.checkEnvironment(env);

        const key = this.table.createKey();
        if (env.assetAdministrationShells) {
            environment.assetAdministrationShells = await this.addIdentifiables(
                this.database.shells,
                env.assetAdministrationShells,
                key,
            );
        }

        if (env.submodels) {
            environment.submodels = await this.addIdentifiables(this.database.submodels, env.submodels, key);
        }

        if (env.conceptDescriptions) {
            environment.conceptDescriptions = await this.addIdentifiables(
                this.database.conceptDescriptions,
                env.conceptDescriptions,
                key,
            );
        }

        const packageId = uuid();
        await this.add({ key: key, id: packageId, filename: this.filename, environment }, this.sourceFile);
        return packageId;
    }

    private checkEnvironment(env: types.Environment): void {
        if (env.assetAdministrationShells) {
            for (const aas of env.assetAdministrationShells) {
                if (!aas.submodels) {
                    continue;
                }

                for (const submodelRef of aas.submodels) {
                    const id = referenceToString(submodelRef);
                    if (!hasSubmodel(env, id) && !this.database.submodels.findKey(id)) {
                        throw new ApplicationError(ERROR.SUBMODEL_NOT_CONTAINED, undefined, 400);
                    }
                }
            }
        }
    }

    private async addIdentifiables(
        table: IdentifiableTable<aas.Identifiable>,
        identifiables: types.IIdentifiable[],
        packageKey: DatabaseKey,
    ): Promise<DatabaseKey[]> {
        const keys: DatabaseKey[] = [];
        for (const identifiable of identifiables) {
            let key = await table.findKey(identifiable.id);
            if (key === undefined) {
                key = table.createKey();
                const page = await table.getEditablePage(key);
                const item: IdentifiableItem = {
                    key,
                    id: identifiable.id,
                    idShort: identifiable.idShort,
                    packageKeys: [packageKey],
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

                await table.setKey(identifiable.id, key);
                await table.writeFile(identifiable, key);
            } else {
                if (identifiable.modelType() === types.ModelType.AssetAdministrationShell) {
                    throw new ApplicationError(ERROR.AAS_ALREADY_EXISTS, { id: identifiable.id }, 409);
                }

                const page = await table.getEditablePage(key);
                const item = page.items[key % this.table.pageSize];
                if (item === null) {
                    throw new Error('Invalid operation.');
                }

                new KeyList(item.packageKeys).add(packageKey);
            }

            keys.push(key);
        }

        return keys;
    }

    private async add(item: PackageItem, aasxFile: string): Promise<void> {
        await this.table.add(aasxFile, item.key);
        await this.table.setKey(item.id, item.key);
        const index = item.key % this.table.pageSize;
        const page = await this.table.getEditablePage(item.key);
        ++page.count;
        if (index < page.items.length) {
            page.items[index] = item;
        } else if (index === page.items.length) {
            page.items.push(item);
        } else {
            throw new Error('Invalid operation.');
        }
    }
}
