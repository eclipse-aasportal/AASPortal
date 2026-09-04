/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { singleton, Disposable, container } from 'tsyringe';
import { Variable } from './variable.js';

@singleton()
export class SqliteConnectionProvider implements Disposable {
    private readonly variable = container.resolve(Variable);
    private readonly connections: Map<string, DatabaseSync> = new Map();

    public getConnection(url: string): DatabaseSync {
        const file = path.isAbsolute(url) ? url : path.join(this.variable.CONTENT_ROOT, url);
        let db = this.connections.get(file);
        if (!db) {
            db = new DatabaseSync(file, { timeout: 5000 });
            db.exec('PRAGMA journal_mode = WAL');
            this.connections.set(file, db);
        }

        return db;
    }

    public dispose(): void {
        for (const connection of this.connections.values()) {
            connection.close();
        }

        this.connections.clear();
    }
}
