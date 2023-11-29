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

export class AASIndexFactory {
    constructor(
        private readonly container: DependencyContainer
    ) { }

    public create(): AASIndex {
        const variable = this.container.resolve(Variable);
        const dbFile = path.join(variable.CONTENT_ROOT, 'db.json');
        const db = new Low<LowDbData>(new JSONFile(dbFile), { documents: [], endpoints: [], elements: [] });
        return new LowDbIndex(db, variable);
    }
}