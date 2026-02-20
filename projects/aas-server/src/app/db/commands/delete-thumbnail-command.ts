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

export class DeleteThumbnailCommand extends DatabaseCommand {
    public constructor(
        database: Database,
        resolve: () => void,
        reject: (reason: Error) => void,
        private readonly aasId: string,
    ) {
        super(database, resolve, reject);
    }

    public override async execute(): Promise<void> {
        const key = await this.database.shells.getKey(this.aasId);
        const item = await this.database.shells.get(key);
        if (!item) {
            throw new Error('Invalid operation.');
        }

        for (const packageKey of new KeyList(item.packageKeys)) {
            const aasxFile = await this.database.packages.createBackup(packageKey);
            const aasx = await AasxPackage.createFromFile(aasxFile);
            await aasx.removeThumbnail();
            await aasx.save();
        }
    }
}
