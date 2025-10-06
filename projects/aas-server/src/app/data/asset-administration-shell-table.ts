/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { aas, jsonization, types } from 'aas-core';
import { DatabaseKey, DatabaseTableData } from './database-types.js';
import { Database } from './database.js';
import { IdentifiableTable } from './identifiable-table.js';
import { ApplicationError } from '../application-error.js';
import { ERROR } from '../error.js';

export class AssetAdministrationShellTable extends IdentifiableTable<aas.AssetAdministrationShell> {
    public constructor(database: Database, data: DatabaseTableData, clusterSize: number, dir: string) {
        super('AssetAdministrationShellTable', database, data, clusterSize, dir);
    }

    public async getKey(id: string): Promise<DatabaseKey> {
        const key = await this.findKey(id);
        if (key === undefined) {
            throw new ApplicationError(
                `An AAS with the identifier ${id} does not exist.`,
                ERROR.ASSET_ADMINISTRATION_SHELL_DOES_NOT_EXIT,
                404,
            );
        }

        return key;
    }

    public async readShell(key: DatabaseKey): Promise<types.AssetAdministrationShell> {
        return jsonization
            .assetAdministrationShellFromJsonable((await this.readJson(key)) as unknown as jsonization.JsonValue)
            .mustValue();
    }
}
