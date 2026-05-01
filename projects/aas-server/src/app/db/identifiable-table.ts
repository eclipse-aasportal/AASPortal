/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { aas } from 'aas-core';
import { DatabaseKey, DatabaseTableData, IdentifiableItem } from './database-types.js';
import { Database } from './database.js';
import { DatabaseTable } from './database-table.js';

export abstract class IdentifiableTable<TObject extends aas.Identifiable = aas.Identifiable> extends DatabaseTable<
    IdentifiableItem,
    TObject
> {
    protected constructor(name: string, database: Database, data: DatabaseTableData, clusterSize: number, dir: string) {
        super(name, database, data, clusterSize, dir, '.json');
    }

    protected override createItem(key: DatabaseKey, obj: aas.Identifiable): IdentifiableItem {
        return {
            key,
            id: obj.id,
            idShort: obj.idShort,
            indexRefs: [],
        };
    }
}
