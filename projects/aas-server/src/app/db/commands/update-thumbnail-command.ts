/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import fs from 'fs';
import { extensionToMimeType, types } from 'aas-core';
import { DatabaseCommand } from '../database-command.js';
import { Database } from '../database.js';
import { KeyList } from '../key-list.js';
import { AasxPackage } from '../../aasx-package.js';

export class UpdateThumbnailCommand extends DatabaseCommand<void> {
    public constructor(
        database: Database,
        private readonly aasId: string,
        private readonly path: string,
        private readonly filename: string,
    ) {
        super(database);
    }

    public override async execute(): Promise<void> {
        const key = await this.database.shells.getKey(this.aasId);
        const item = await this.database.shells.get(key);
        if (!item) {
            throw new Error('Invalid operation.');
        }

        const shell = await this.database.shells.readShell(key);
        shell.assetInformation.defaultThumbnail = new types.Resource(this.path, extensionToMimeType(this.path));
        this.database.shells.writeFile(shell, key);

        for (const packageKey of new KeyList(item.packageKeys)) {
            const aasxFile = await this.database.packages.createBackup(packageKey);
            const aasx = await AasxPackage.createFromFile(aasxFile);
            await aasx.setThumbnail(this.filename, fs.createReadStream(this.path));
            await aasx.save();
        }
    }
}
