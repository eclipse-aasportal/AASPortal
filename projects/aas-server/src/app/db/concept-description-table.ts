/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { aas, ApplicationError, jsonization, types } from 'aas-core';
import { DatabaseKey, DatabaseTableData, Table } from './database-types.js';
import { Database } from './database.js';
import { IdentifiableTable } from './identifiable-table.js';
import { ERROR } from '../error.js';

export class ConceptDescriptionTable extends IdentifiableTable<aas.ConceptDescription> {
    public constructor(database: Database, data: DatabaseTableData, clusterSize: number, dir: string) {
        super('ConceptDescriptionTable', database, data, clusterSize, dir);
    }

    public override readonly index = Table.CONCEPT_DESCRIPTION_TABLE;

    public override async getKey(id: string): Promise<DatabaseKey> {
        const key = await this.findKey(id);
        if (key === undefined) {
            throw new ApplicationError(ERROR.CONCEPT_DESCRIPTION_DOES_NOT_EXIST, { id }, 404);
        }

        return key;
    }

    public async readConceptDescription(key: DatabaseKey): Promise<types.ConceptDescription> {
        return jsonization
            .conceptDescriptionFromJsonable((await this.readObject(key)) as unknown as jsonization.JsonValue)
            .mustValue();
    }
}
