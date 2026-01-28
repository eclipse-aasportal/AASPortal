/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import path from 'path';
import fs from 'fs';
import { nanoid } from 'nanoid';
import { aas, ApplicationError, jsonization, toAssetAdministrationShell, toJsonValue, types } from 'aas-core';

import { DatabaseEnvironment, DatabaseKey, PackageItem, IdentifiableItem } from '../database-types.js';
import { DatabaseCommand } from '../database-command.js';
import { Database } from '../database.js';
import { ERROR } from '../../error.js';
import { AasxPackageBuilder } from '../../aasx-package-builder.js';
import { AssetAdministrationShellTable } from '../asset-administration-shell-table.js';

/**
 * Adds an Asset Administration Shell into the database.
 */
export class AddShellCommand extends DatabaseCommand {
    private readonly table: AssetAdministrationShellTable;

    public constructor(
        database: Database,
        resolve: (result: aas.AssetAdministrationShell) => void,
        reject: (reason: Error) => void,
        private readonly packageBuilder: AasxPackageBuilder,
        private readonly shell: aas.AssetAdministrationShell,
    ) {
        super(database, resolve, reject);

        this.table = database.shells;
    }

    public async execute(): Promise<aas.AssetAdministrationShell> {
        const filename = this.shell.idShort + '.aasx';
        const sourceFile = path.join(this.database.tmpDir, filename);
        if (fs.existsSync(sourceFile)) {
            await fs.promises.unlink(sourceFile);
        }

        const result = jsonization.assetAdministrationShellFromJsonable(toJsonValue(this.shell));
        if (result.error) {
            throw result.error;
        }

        const value = result.mustValue();
        const env = new types.Environment([value], [], []);
        await this.packageBuilder.build(sourceFile, env);

        const packageKey = this.database.packages.createKey();
        const packageId = nanoid();
        const key = await this.addAssetAdministrationShell(value, packageKey);

        const environment: DatabaseEnvironment = {
            assetAdministrationShells: [key],
            submodels: [],
            conceptDescriptions: [],
        };

        await this.addPackage({ key: packageKey, id: packageId, filename, environment }, sourceFile);
        return toAssetAdministrationShell(value);
    }

    private async addAssetAdministrationShell(
        shell: types.AssetAdministrationShell,
        packageKey: DatabaseKey,
    ): Promise<DatabaseKey> {
        let key = await this.table.findKey(shell.id);
        if (key) {
            throw new ApplicationError(ERROR.AAS_ALREADY_EXISTS, { id: shell.id }, 409);
        }

        key = this.table.createKey();
        const page = await this.table.getEditablePage(key);
        const item: IdentifiableItem = {
            key,
            id: shell.id,
            idShort: shell.idShort,
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

        await this.table.setKey(shell.id, key);
        await this.table.writeFile(shell, key);
        return key;
    }

    private async addPackage(item: PackageItem, aasxFile: string): Promise<void> {
        const table = this.database.packages;
        await table.add(aasxFile, item.key);
        await table.setKey(item.id, item.key);
        const index = item.key % this.table.pageSize;
        const page = await table.getEditablePage(item.key);
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
