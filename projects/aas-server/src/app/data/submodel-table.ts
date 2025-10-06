/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { aas, jsonization, types } from 'aas-core';
import { ApplicationError } from '../application-error.js';
import { ERROR } from '../error.js';
import { DatabaseKey, DatabaseTableData } from './database-types.js';
import { Database } from './database.js';
import { IdentifiableTable } from './identifiable-table.js';

export class SubmodelTable extends IdentifiableTable<aas.Submodel> {
    public constructor(database: Database, data: DatabaseTableData, clusterSize: number, dir: string) {
        super('SubmodelTable', database, data, clusterSize, dir);
    }

    public async getKey(id: string): Promise<DatabaseKey> {
        const key = await this.findKey(id);
        if (key === undefined) {
            throw new ApplicationError(
                `A Submodel with the identifier ${id} does not exists.`,
                ERROR.SUBMODEL_DOES_NOT_EXIST,
                404,
            );
        }

        return key;
    }

    public async readSubmodel(key: DatabaseKey): Promise<types.Submodel> {
        return jsonization
            .submodelFromJsonable((await this.readJson(key)) as unknown as jsonization.JsonValue)
            .mustValue();
    }
}
