import { DependencyContainer } from 'tsyringe';
import path from 'path';
import { JSONFile } from 'lowdb/node'
import { Low } from 'lowdb';
import { AASIndex } from './aas-index.js';
import { LowIndex, Data } from './low-index.js';
import { Variable } from '../variable.js';

export class AASIndexFactory {
    constructor(
        private readonly container: DependencyContainer
    ) { }

    public create(): AASIndex {
        const variable = this.container.resolve(Variable);
        const dbFile = path.join(variable.CONTENT_ROOT, 'db.json');
        const db = new Low<Data>(new JSONFile(dbFile), { documents: [] });
        return new LowIndex(db);
    }
}