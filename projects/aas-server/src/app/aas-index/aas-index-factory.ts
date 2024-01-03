/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { DependencyContainer } from 'tsyringe';
import path from 'path';
import { JSONFile } from 'lowdb/node'
import { Low } from 'lowdb';
import { AASIndex } from './aas-index.js';
import { LowDbIndex } from './lowdb/lowdb-index.js';
import { Variable } from '../variable.js';
import { LowDbData } from './lowdb/lowdb-types.js';
import { MySqlIndex } from './mysql/mysql-index.js';

export class AASIndexFactory {
    constructor(
        private readonly container: DependencyContainer
    ) { }

    public create(): AASIndex {
        const variable = this.container.resolve(Variable);
        if (variable.AAS_INDEX) {
            const url = new URL(variable.AAS_INDEX);
            if (url.protocol === 'mysql:') {
                return new MySqlIndex(variable);
            }

            throw new Error('Not implemented.');
        }

        const dbFile = path.join(variable.CONTENT_ROOT, 'db.json');
        const db = new Low<LowDbData>(new JSONFile(dbFile), { documents: [], endpoints: [], elements: [] });
        return new LowDbIndex(db, variable);
    }
}