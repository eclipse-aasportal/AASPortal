/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ApplicationError, toSubmodel, types } from 'aas-core';
import { DatabaseCommand } from '../database-command.js';
import { Database } from '../database.js';
import { ERROR } from '../../error.js';
import { selectISubmodelElement } from '../../utilities.js';

export class DeleteAttachmentCommand extends DatabaseCommand {
    public constructor(
        database: Database,
        resolve: () => void,
        reject: (reason: Error) => void,
        private readonly smId: string,
        private readonly idShortPath: string,
    ) {
        super(database, resolve, reject);
    }

    public override async execute(): Promise<void> {
        const key = await this.database.submodels.getKey(this.smId);
        const submodel = await this.database.submodels.readSubmodel(key);
        const element = selectISubmodelElement(submodel, this.idShortPath);
        if (!(element instanceof types.File)) {
            throw new ApplicationError(ERROR.INVALID_ID_SHORT_PATH, { idShortPath: this.idShortPath });
        }

        const value = element.value;
        if (!value) {
            return;
        }

        element.value = null;
        element.contentType = '';
        await this.database.submodels.writeObject(toSubmodel(submodel), key);
        if (element.value) {
            await this.database.submodels.deleteAsset(key, element.value);
        }
    }
}