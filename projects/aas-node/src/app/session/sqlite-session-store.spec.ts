/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { beforeEach, afterEach, describe, it, expect, vi, Mocked } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { LOGGER, Logger } from 'aas-package';
import { container } from 'tsyringe';

import { SqliteSessionStore } from './sqlite-session-store.js';
import { SqliteConnectionProvider } from '../sqlite-connection-provider.js';
import { Variable } from '../variable.js';
import { createSpyObj } from '../../test/mocks.js';

describe('SqliteSessionStore', () => {
    let store: SqliteSessionStore;
    let logger: Mocked<Logger>;
    let connectionProvider: Mocked<SqliteConnectionProvider>;
    let variable: Mocked<Variable>;
    let db: DatabaseSync;

    beforeEach(() => {
        logger = createSpyObj<Logger>(['info', 'warning', 'error']);
        connectionProvider = createSpyObj<SqliteConnectionProvider>(['getConnection']);
        variable = createSpyObj<Variable>([], { SESSION_TTL: 86400, SESSION_STORE: ':memory:' });

        // Create an in-memory SQLite database for testing
        db = new DatabaseSync(':memory:');

        connectionProvider.getConnection.mockReturnValue(db);

        container.clearInstances();
        container.registerInstance(LOGGER, logger);
        container.registerInstance(SqliteConnectionProvider, connectionProvider);
        container.registerInstance(Variable, variable);
        container.registerSingleton(SqliteSessionStore);
        store = container.resolve(SqliteSessionStore);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        db.close();
    });

    it('should create', () => {
        expect(store).toBeInstanceOf(SqliteSessionStore);
    });
});
