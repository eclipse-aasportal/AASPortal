/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { container } from 'tsyringe';
import { DatabaseSync, StatementSync } from 'node:sqlite';
import { AASEndpointAuth, UserRole } from 'aas-core';

import { Rights, UserRightsStore } from './user-rights-store.js';
import { SqliteConnectionProvider } from '../sqlite-connection-provider.js';
import { Variable } from '../variable.js';
import { LOGGER, Logger } from 'aas-package';

const initDatabase = `
CREATE TABLE IF NOT EXISTS userRights (
	id TEXT PRIMARY KEY,
	role TEXT,
    endpoints TEXT
);
`;

export class SqliteUserRightsStore extends UserRightsStore {
    private readonly logger: Logger = container.resolve(LOGGER);
    private readonly connectionProvider = container.resolve(SqliteConnectionProvider);
    private readonly variable = container.resolve(Variable);
    private readonly db: DatabaseSync;
    private readonly getUserRoleSql: StatementSync;
    private readonly getEndpointsSql: StatementSync;
    private readonly addUserRightsSql: StatementSync;
    private readonly updateUserRightsRoleSql: StatementSync;
    private readonly updateUserRightsEndpointsSql: StatementSync;
    private readonly deleteUserRightsSql: StatementSync;

    public constructor() {
        super();

        this.db = this.connectionProvider.getConnection(this.variable.USER_RIGHTS_STORE);
        this.db.exec(initDatabase);
        this.getUserRoleSql = this.db.prepare('SELECT role FROM userRights WHERE id = ?');
        this.getEndpointsSql = this.db.prepare('SELECT endpoints FROM userRights WHERE id = ?');
        this.addUserRightsSql = this.db.prepare('INSERT INTO userRights (id, role, endpoints) VALUES (?, ?, ?)');
        this.updateUserRightsRoleSql = this.db.prepare('UPDATE userRights SET role = ? WHERE id = ?');
        this.updateUserRightsEndpointsSql = this.db.prepare('UPDATE userRights SET endpoints = ? WHERE id = ?');
        this.deleteUserRightsSql = this.db.prepare('DELETE FROM userRights WHERE id = ?');

        this.logger.info(`Using SQLite user rights store "${this.variable.USER_RIGHTS_STORE}".`);
    }

    public override async getRole(userId: string): Promise<UserRole> {
        const value = this.getUserRoleSql.get(userId);
        if (!value) {
            return 'viewer';
        }

        return value.role as UserRole;
    }

    public override async getEndpoints(userId: string): Promise<AASEndpointAuth[]> {
        const value = this.getEndpointsSql.get(userId);
        if (!value) {
            return [];
        }

        return JSON.parse(String(value.endpoints));
    }

    public override async add(userId: string, rights: Rights): Promise<void> {
        this.addUserRightsSql.run(userId, rights.role, JSON.stringify(rights.endpoints));
    }

    public override async update(userId: string, rights: Partial<Rights>): Promise<void> {
        if (rights.role !== undefined) {
            this.updateUserRightsRoleSql.run(rights.role, userId);
        }

        if (rights.endpoints !== undefined) {
            this.updateUserRightsEndpointsSql.run(JSON.stringify(rights.endpoints), userId);
        }
    }

    public override async delete(userId: string): Promise<void> {
        this.deleteUserRightsSql.run(userId);
    }
}
