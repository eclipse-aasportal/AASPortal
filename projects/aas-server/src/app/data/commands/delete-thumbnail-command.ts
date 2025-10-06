/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { AasxPackage } from '../../aasx-package.js';
import { DatabaseCommand } from '../database-command.js';
import { Database } from '../database.js';
import { KeyList } from '../key-list.js';

export class DeleteThumbnailCommand extends DatabaseCommand<void> {
    public constructor(
        database: Database,
        private readonly aasId: string,
    ) {
        super(database);
    }

    public override async execute(): Promise<void> {
        const key = await this.database.shells.getKey(this.aasId);
        const item = await this.database.shells.get(key);
        if (!item) {
            throw new Error('Invalid operation.');
        }

        for (const packageKey of new KeyList(item.packageKeys)) {
            const aasxFile = await this.database.packages.createBackup(packageKey);
            const aasx = new AasxPackage(aasxFile);
            await aasx.removeThumbnail();
            await aasx.save();
        }
    }
}
