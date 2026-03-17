/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { aas, ApplicationError, jsonization, types } from 'aas-core';
import { DatabaseKey, DatabaseTableData, Table } from './database-types.js';
import { Database } from './database.js';
import { IdentifiableTable } from './identifiable-table.js';
import { ERROR } from '../error.js';

export class AssetAdministrationShellTable extends IdentifiableTable<aas.AssetAdministrationShell> {
    public constructor(database: Database, data: DatabaseTableData, clusterSize: number, dir: string) {
        super('AssetAdministrationShellTable', database, data, clusterSize, dir);
    }

    public override readonly index = Table.AAS_TABLE;

    public override async getKey(id: string): Promise<DatabaseKey> {
        const key = await this.findKey(id);
        if (key === undefined) {
            throw new ApplicationError(ERROR.AAS_DOES_NOT_EXIST, { id }, 400);
        }

        return key;
    }

    public async readShell(key: DatabaseKey): Promise<types.AssetAdministrationShell> {
        return jsonization
            .assetAdministrationShellFromJsonable((await this.readObject(key)) as unknown as jsonization.JsonValue)
            .mustValue();
    }
}
