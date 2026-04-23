/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { aas, ApplicationError, jsonization, toAssetAdministrationShell, toJsonValue, types } from 'aas-core';

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
        const result = jsonization.assetAdministrationShellFromJsonable(toJsonValue(this.shell));
        if (result.error) {
            throw result.error;
        }

        const value = result.mustValue();
        await this.addAssetAdministrationShell(value);
        return toAssetAdministrationShell(value);
    }

    private async addAssetAdministrationShell(shell: types.AssetAdministrationShell): Promise<void> {
        let key = await this.table.findKey(shell.id);
        if (key !== undefined) {
            throw new ApplicationError(ERROR.AAS_ALREADY_EXISTS, { id: shell.id }, 409);
        }

        key = await this.table.insert(toAssetAdministrationShell(shell));
        const globalAssetId = shell.assetInformation.globalAssetId;
        if (globalAssetId) {
            const assetIndex = this.database.assetIndex;
            const globalAssetKey =
                (await assetIndex.findKey(globalAssetId)) ?? (await assetIndex.create(globalAssetId));
            await this.database.assetIndex.add(globalAssetKey, this.table, key);
        }
    }
}
