/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { DatabaseCommand } from '../database-command.js';
import { Database } from '../database.js';
import { AssetAdministrationShellTable } from '../asset-administration-shell-table.js';

export class DeleteThumbnailCommand extends DatabaseCommand {
    private readonly table: AssetAdministrationShellTable;

    public constructor(
        database: Database,
        resolve: () => void,
        reject: (reason: Error) => void,
        private readonly aasId: string,
    ) {
        super(database, resolve, reject);

        this.table = this.database.shells;
    }

    public override async execute(): Promise<void> {
        const key = await this.table.getKey(this.aasId);
        const shell = await this.table.readObject(key);
        const path = shell.assetInformation.defaultThumbnail?.path;
        if (path) {
            await this.table.deleteAsset(key, path);
        }
    }
}
