/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { singleton, container } from 'tsyringe';
import { DatabaseSync, StatementSync } from 'node:sqlite';
import { LOGGER } from 'aas-package';

import { CookieStore } from './cookie-store.js';
import { SqliteConnectionProvider } from '../sqlite-connection-provider.js';
import { Variable } from '../variable.js';

const initDatabase = `
CREATE TABLE IF NOT EXISTS cookies (
	user_id TEXT NOT NULL,
	name TEXT NOT NULL,
	data TEXT NOT NULL,
	PRIMARY KEY (user_id, name)
);
`;

/** A cookie storage implementation backed by native Node.js SQLite. */
@singleton()
export class SqliteCookieStore extends CookieStore {
    private readonly connectionProvider = container.resolve(SqliteConnectionProvider);
    private readonly logger = container.resolve(LOGGER);
    private readonly variable = container.resolve(Variable);
    private readonly db: DatabaseSync;
    private readonly getCookieSql: StatementSync;
    private readonly setCookieSql: StatementSync;
    private readonly deleteCookieSql: StatementSync;

    public constructor() {
        super();

        this.db = this.connectionProvider.getConnection(this.variable.COOKIE_STORE);
        this.db.exec(initDatabase);
        this.getCookieSql = this.db.prepare('SELECT data FROM cookies WHERE user_id = ? AND name = ?');
        this.setCookieSql = this.db.prepare(
            `INSERT INTO cookies (user_id, name, data) VALUES (?, ?, ?)
			 ON CONFLICT(user_id, name) DO UPDATE SET data = excluded.data`,
        );

        this.deleteCookieSql = this.db.prepare('DELETE FROM cookies WHERE user_id = ? AND name = ?');

        this.logger.info('Using SQLite cookie store "${this.variable.COOKIE_STORE}".');
    }

    public override async deleteCookie(userId: string, name: string): Promise<void> {
        this.deleteCookieSql.run(userId, name);
    }

    protected override async getCookieData(userId: string, name: string): Promise<string | undefined> {
        const value = this.getCookieSql.get(userId, name);
        return value ? String(value.data) : undefined;
    }

    protected override async setCookieData(userId: string, name: string, data: string): Promise<void> {
        this.setCookieSql.run(userId, name, data);
    }
}
