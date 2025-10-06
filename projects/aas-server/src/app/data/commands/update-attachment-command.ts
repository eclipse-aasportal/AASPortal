/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import fs from 'fs';
import { dirname, join } from 'path/posix';
import { types } from 'aas-core';
import { DatabaseCommand } from '../database-command.js';
import { Database } from '../database.js';
import { checkSubmodelIsReferenced, mimeType, normalize, selectISubmodelElement } from '../../utilities.js';
import { AasxPackage } from '../../aasx-package.js';
import { ApplicationError } from '../../application-error.js';
import { ERROR } from '../../error.js';
import { KeyList } from '../key-list.js';

export class UpdateAttachmentCommand extends DatabaseCommand<void> {
    public constructor(
        database: Database,
        private readonly aasId: string | undefined,
        private readonly smId: string,
        private readonly idShortPath: string,
        private readonly path: string,
        private readonly filename: string,
    ) {
        super(database);
    }

    public override async execute(): Promise<void> {
        if (this.aasId) {
            const aas = await this.database.getShell(this.aasId);
            checkSubmodelIsReferenced(aas, this.smId);
        }

        const key = await this.database.submodels.getKey(this.smId);
        const item = await this.database.submodels.getItem(key);
        const submodel = await this.database.submodels.readSubmodel(key);
        const element = selectISubmodelElement(submodel, this.idShortPath);
        if (!(element instanceof types.File)) {
            throw new ApplicationError(`"${this.idShortPath}" does not reference a File.`, ERROR.INVALID_ID_SHORT_PATH);
        }

        const oldValue = normalize(element.value);
        const dir = dirname(oldValue) ?? 'suppl';
        element.value = join(dir, this.filename);
        element.contentType = mimeType(this.filename);
        await this.database.submodels.writeFile(submodel, key);

        for (const packageKey of new KeyList(item.packageKeys)) {
            const aasxFile = await this.database.packages.createBackup(packageKey);
            const aasx = new AasxPackage(aasxFile);

            if (oldValue) {
                await aasx.remove(oldValue);
            }

            await aasx.write(element.value, fs.createReadStream(this.path));
            await aasx.save();
        }
    }
}
