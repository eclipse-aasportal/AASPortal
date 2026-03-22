/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { aas, ApplicationError, jsonization, toJsonValue, toSubmodel, types } from 'aas-core';
import { DatabaseCommand } from '../database-command.js';
import { Database } from '../database.js';
import { ERROR } from '../../error.js';
import { SubmodelTable } from '../submodel-table.js';

/**
 * Command to add a Submodel to the database.
 */
export class AddSubmodelCommand extends DatabaseCommand {
    private readonly table: SubmodelTable;

    public constructor(
        database: Database,
        resolve: (result: types.Submodel) => void,
        reject: (reason: Error) => void,
        private readonly submodel: aas.Submodel,
    ) {
        super(database, resolve, reject);

        this.table = this.database.submodels;
    }

    public override async execute(): Promise<types.Submodel> {
        const result = jsonization.submodelFromJsonable(toJsonValue(this.submodel));
        if (result.error) {
            throw new ApplicationError(ERROR.DESERIALIZATION_ERROR, { message: result.error.message });
        }

        if (!result.value) {
            throw new Error('Invalid operation.');
        }

        return await this.add(result.value);
    }

    private async add(sm: types.Submodel): Promise<types.Submodel> {
        const key = await this.table.getKey(sm.id);
        if (key) {
            throw new ApplicationError(ERROR.SUBMODEL_ALREADY_EXISTS, { id: sm.id }, 409);
        }

        this.table.insert(toSubmodel(sm));
        return sm;
    }
}