/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { aas, jsonization, toAssetAdministrationShell, toJsonObject, types } from 'aas-core';
import { AssetAdministrationShellTable } from '../asset-administration-shell-table.js';
import { DatabaseCommand } from '../database-command.js';
import { Database } from '../database.js';
import { DatabaseKey } from '../database-types.js';

/**
 * Command to update an Asset Administration Shell in the database.
 */
export class UpdateShellCommand extends DatabaseCommand {
    private readonly table: AssetAdministrationShellTable;

    public constructor(
        database: Database,
        resolve: (result: aas.AssetAdministrationShell) => void,
        reject: (reason: Error) => void,
        private readonly shell: aas.AssetAdministrationShell,
    ) {
        super(database, resolve, reject);

        this.table = database.shells;
    }

    public override async execute(): Promise<aas.AssetAdministrationShell> {
        const key = await this.table.getKey(this.shell.id);
        const value = await this.updateAssetAdministrationShell(key);
        return toAssetAdministrationShell(value);
    }

    private async updateAssetAdministrationShell(key: DatabaseKey): Promise<types.AssetAdministrationShell> {
        const currentShell = await this.table.readJson(key);
        const updatedShell = { ...this.shell, submodels: currentShell.submodels };
        const result = jsonization.assetAdministrationShellFromJsonable(toJsonObject(updatedShell));
        if (result.error) {
            throw result.error;
        }

        const value = result.mustValue();
        await this.table.writeFile(value, key);
        return value;
    }
}
