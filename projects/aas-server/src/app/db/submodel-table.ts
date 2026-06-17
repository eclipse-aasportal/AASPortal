/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { aas, ApplicationError, jsonization, toJsonObject, types } from 'aas-core';
import { ERROR } from '../error.js';
import { DatabaseKey, DatabaseTableData, Table } from './database-types.js';
import { Database } from './database.js';
import { IdentifiableTable } from './identifiable-table.js';

/**
 * Table for Submodel items.
 */
export class SubmodelTable extends IdentifiableTable<aas.Submodel> {
    public constructor(database: Database, data: DatabaseTableData, clusterSize: number, dir: string) {
        super('SubmodelTable', database, data, clusterSize, dir);
    }

    public override readonly index = Table.SUBMODEL_TABLE;

    /**
     * Retrieves the database key for a given submodel ID.
     *
     * @param id - The unique identifier of the submodel.
     * @returns A promise that resolves to the corresponding {@link DatabaseKey}.
     * @throws {@link ApplicationError} If the submodel does not exist, with error code {@link ERROR.SUBMODEL_DOES_NOT_EXIST}.
     */
    public override async getKey(id: string): Promise<DatabaseKey> {
        const key = await this.findKey(id);
        if (key === undefined) {
            throw new ApplicationError(ERROR.SUBMODEL_DOES_NOT_EXIST, { id }, 404);
        }

        return key;
    }

    /**
     * Reads a submodel from the database using the provided key.
     *
     * This method retrieves the JSON representation of the submodel from the database,
     * converts it to a strongly-typed `Submodel` object, and returns it.
     *
     * @param key - The database key used to locate the submodel.
     * @returns A promise that resolves to the `Submodel` object.
     * @throws If the submodel cannot be found or conversion fails.
     */
    public async readSubmodel(key: DatabaseKey): Promise<types.Submodel> {
        return jsonization.submodelFromJsonable(toJsonObject(await this.readObject(key))).mustValue();
    }
}
