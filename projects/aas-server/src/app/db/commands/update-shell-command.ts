/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { aas, ApplicationError, jsonization, toAssetAdministrationShell, toJsonObject } from 'aas-core';
import { DatabaseCommand } from '../database-command.js';
import { Database } from '../database.js';
import { ERROR } from '../../error.js';

/**
 * Command to update an Asset Administration Shell in the database.
 */
export class UpdateShellCommand extends DatabaseCommand {
    public constructor(
        database: Database,
        resolve: (result: aas.AssetAdministrationShell) => void,
        reject: (reason: Error) => void,
        private readonly shell: aas.AssetAdministrationShell,
    ) {
        super(database, resolve, reject);
    }

    public override async execute(): Promise<aas.AssetAdministrationShell> {
        const result = jsonization.assetAdministrationShellFromJsonable(toJsonObject(this.shell));
        const obj = toAssetAdministrationShell(result.mustValue());
        const key = await this.database.shells.findKey(this.shell.id);
        if (key === undefined) {
            throw new ApplicationError(ERROR.AAS_DOES_NOT_EXIST, { id: this.shell.id }, 404);
        }

        await this.database.shells.update(key, obj);
        return obj;
    }
}
