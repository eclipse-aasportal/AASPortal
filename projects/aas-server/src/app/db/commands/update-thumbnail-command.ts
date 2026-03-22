/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { extensionToMimeType, toAssetAdministrationShell, types } from 'aas-core';
import { DatabaseCommand } from '../database-command.js';
import { Database } from '../database.js';

export class UpdateThumbnailCommand extends DatabaseCommand {
    public constructor(
        database: Database,
        resolve: () => void,
        reject: (reason: Error) => void,
        private readonly aasId: string,
        private readonly path: string,
        private readonly filename: string,
    ) {
        super(database, resolve, reject);
    }

    public override async execute(): Promise<void> {
        const key = await this.database.shells.getKey(this.aasId);
        const item = await this.database.shells.get(key);
        if (!item) {
            throw new Error('Invalid operation.');
        }

        const shell = await this.database.shells.readShell(key);
        shell.assetInformation.defaultThumbnail = new types.Resource(this.path, extensionToMimeType(this.path));
        await this.database.shells.writeObject(toAssetAdministrationShell(shell), key);
        await this.database.shells.writeAsset(key, this.filename, this.path);
    }
}