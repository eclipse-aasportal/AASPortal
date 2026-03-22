/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ApplicationError } from 'aas-core';
import { DatabaseCommand } from '../database-command.js';
import { Database } from '../database.js';
import { ERROR } from '../../error.js';

export class DeletePackageCommand extends DatabaseCommand {
    public constructor(
        database: Database,
        resolve: () => void,
        reject: (reason: Error) => void,
        private readonly packageId: string,
    ) {
        super(database, resolve, reject);
    }

    public override async execute(): Promise<void> {
        if (!(await this.database.packageIndex.delete(this.packageId))) {
            throw new ApplicationError(
                ERROR.AASX_PACKAGE_DOES_NOT_EXIST,
                {
                    packageId: this.packageId,
                },
                404,
            );
        }
    }
}