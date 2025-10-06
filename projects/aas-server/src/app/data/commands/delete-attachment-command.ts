/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { types } from 'aas-core';
import { DatabaseCommand } from '../database-command.js';
import { Database } from '../database.js';
import { ApplicationError } from '../../application-error.js';
import { ERROR } from '../../error.js';
import { checkSubmodelIsReferenced, selectISubmodelElement } from '../../utilities.js';
import { AasxPackage } from '../../aasx-package.js';
import { KeyList } from '../key-list.js';

export class DeleteAttachmentCommand extends DatabaseCommand<void> {
    public constructor(
        database: Database,
        private readonly aasId: string | undefined,
        private readonly smId: string,
        private readonly idShortPath: string,
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

        const value = element.value;
        if (!value) {
            return;
        }

        element.value = null;
        element.contentType = '';
        await this.database.submodels.writeFile(submodel, key);

        for (const packageKey of new KeyList(item.packageKeys)) {
            const aasxFile = await this.database.packages.createBackup(packageKey);
            const aasx = new AasxPackage(aasxFile);
            await aasx.remove(value);
            await aasx.save();
        }
    }
}
