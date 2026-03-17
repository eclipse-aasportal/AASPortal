/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { dirname, join } from 'path/posix';
import { ApplicationError, extensionToMimeType, toSubmodel, types } from 'aas-core';

import { DatabaseCommand } from '../database-command.js';
import { Database } from '../database.js';
import { normalize, selectISubmodelElement } from '../../utilities.js';
import { ERROR } from '../../error.js';

export class UpdateAttachmentCommand extends DatabaseCommand {
    public constructor(
        database: Database,
        resolve: () => void,
        reject: (reason: Error) => void,
        private readonly smId: string,
        private readonly idShortPath: string,
        private readonly path: string,
        private readonly filename: string,
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

        const oldValue = normalize(element.value);
        const dir = dirname(oldValue) ?? 'suppl';
        element.value = join(dir, this.filename);
        element.contentType = extensionToMimeType(this.filename) ?? '';
        await this.database.submodels.writeObject(toSubmodel(submodel), key);
        await this.database.submodels.writeAsset(key, element.value, this.path);
    }
}
