/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { container } from 'tsyringe';
import { DatabaseSync, StatementSync } from 'node:sqlite';
import { UserRole } from 'aas-core';

import { Rights, UserRights, UserRightsStore } from './user-rights-store.js';
import { SqliteConnectionProvider } from '../sqlite-connection-provider.js';
import { Variable } from '../variable.js';
import { LOGGER, Logger } from 'aas-package';

const initDatabase = `
CREATE TABLE IF NOT EXISTS userRights (
	id TEXT PRIMARY KEY,
	role TEXT
);
`;

export class SqliteUserRightsStore extends UserRightsStore {
    private readonly logger: Logger = container.resolve(LOGGER);
    private readonly connectionProvider = container.resolve(SqliteConnectionProvider);
    private readonly variable = container.resolve(Variable);
    private readonly db: DatabaseSync;
    private readonly getUserRightsSql: StatementSync;
    private readonly addUserRightsSql: StatementSync;
    private readonly updateUserRightsSql: StatementSync;
    private readonly deleteUserRightsSql: StatementSync;

    public constructor() {
        super();

        this.db = this.connectionProvider.getConnection(this.variable.USER_RIGHTS_STORE);
        this.db.exec(initDatabase);
        this.getUserRightsSql = this.db.prepare('SELECT id, role FROM userRights WHERE id = ?');
        this.addUserRightsSql = this.db.prepare('INSERT INTO userRights (id, role) VALUES (?, ?)');
        this.updateUserRightsSql = this.db.prepare('UPDATE userRights SET role = ? WHERE id = ?');
        this.deleteUserRightsSql = this.db.prepare('DELETE FROM userRights WHERE id = ?');

        this.logger.info(`Using SQLite user rights store "${this.variable.USER_RIGHTS_STORE}".`);
    }

    public override async get(userId: string): Promise<UserRights> {
        const value = this.getUserRightsSql.get(userId);
        if (!value) {
            return { id: userId, role: 'user' };
        }

        return { id: String(value.id), role: String(value.role) as UserRole };
    }

    public override async add(userId: string, rights: Rights): Promise<void> {
        this.addUserRightsSql.run(userId, rights.role);
    }

    public override async update(userId: string, rights: Partial<Rights>): Promise<void> {
        if (rights.role !== undefined) {
            this.updateUserRightsSql.run(rights.role, userId);
        }
    }

    public override async delete(userId: string): Promise<void> {
        this.deleteUserRightsSql.run(userId);
    }
}
