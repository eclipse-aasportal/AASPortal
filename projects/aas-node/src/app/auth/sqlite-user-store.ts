/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { DatabaseSync, StatementSync } from 'node:sqlite';
import { container } from 'tsyringe';

import { UserData, UserStore } from './user-store.js';
import { SqliteConnectionProvider } from '../sqlite-connection-provider.js';
import { Variable } from '../variable.js';
import { LOGGER, Logger } from 'aas-package';

const initDatabase = `
CREATE TABLE IF NOT EXISTS users (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL,
	password TEXT NOT NULL,
	created TEXT NOT NULL
);
`;

export class SqliteUserStore extends UserStore {
    private readonly logger: Logger = container.resolve(LOGGER);
    private readonly connectionProvider = container.resolve(SqliteConnectionProvider);
    private readonly variable = container.resolve(Variable);
    private readonly db: DatabaseSync;
    private readonly getUserSql: StatementSync;
    private readonly insertUserSql: StatementSync;
    private readonly updateUserSql: StatementSync;
    private readonly deleteUserSql: StatementSync;

    public constructor() {
        super();

        this.db = this.connectionProvider.getConnection(this.variable.USER_STORE);
        this.db.exec(initDatabase);
        this.getUserSql = this.db.prepare('SELECT id, name, password, created FROM users WHERE id = ?');
        this.insertUserSql = this.db.prepare('INSERT INTO users (id, name, password, created) VALUES (?, ?, ?, ?)');
        this.updateUserSql = this.db.prepare('UPDATE users SET name = ?, password = ? WHERE id = ?');
        this.deleteUserSql = this.db.prepare('DELETE FROM users WHERE id = ?');

        this.logger.info(`Using SQLite user store "${this.variable.USER_STORE}".`);
    }

    public override async get(userId: string): Promise<UserData | undefined> {
        const value = this.getUserSql.get(userId);
        if (!value) {
            return undefined;
        }

        return {
            id: String(value.id),
            name: String(value.name),
            password: String(value.password),
            created: new Date(String(value.created)),
        };
    }

    public override async set(userId: string, data: UserData): Promise<void> {
        if (this.getUserSql.get(userId)) {
            this.updateUserSql.run(data.name, data.password, userId);
            return;
        }

        this.insertUserSql.run(userId, data.name, data.password, data.created.toISOString());
    }

    public override async delete(userId: string): Promise<boolean> {
        return this.deleteUserSql.run(userId).changes > 0;
    }
}
