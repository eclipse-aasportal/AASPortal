/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { types } from 'aas-core';
import { AssetAdministrationShellTable } from '../asset-administration-shell-table.js';
import { DatabaseCommand } from '../database-command.js';
import { Database } from '../database.js';

export class UpdateShellCommand extends DatabaseCommand<void> {
    private readonly table: AssetAdministrationShellTable;

    public constructor(
        database: Database,
        private readonly aas: types.AssetAdministrationShell,
    ) {
        super(database);

        this.table = database.shells;
    }

    public override execute(): Promise<void> {
        throw new Error('Method not implemented.');
    }
}
