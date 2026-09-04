/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { beforeEach, afterEach, describe, vi, it, expect } from 'vitest';
import { container } from 'tsyringe';
import { SessionStoreFactory } from './session-store-factory.js';
import { createSpyObj } from '../../test/mocks.js';
import { Variable } from '../variable.js';
import { MongoDbSessionStore } from './mongo-db-session-store.js';
import { Logger, LOGGER } from 'aas-package';
import { SqliteSessionStore } from './sqlite-session-store.js';

describe('SessionStoreFactory', () => {
    let factory: SessionStoreFactory;
    let variable: Variable;

    beforeEach(() => {
        container.clearInstances();
        container.registerInstance(LOGGER, createSpyObj<Logger>(['info', 'error', 'warning']));
        container.registerInstance(MongoDbSessionStore, createSpyObj<MongoDbSessionStore>([]));
        container.registerInstance(SqliteSessionStore, createSpyObj<SqliteSessionStore>([]));
        container.registerInstance(
            Variable,
            createSpyObj<Variable>([], { SESSION_STORE: 'mongodb://localhost:27017/test' }),
        );

        variable = container.resolve(Variable);
        factory = container.resolve(SessionStoreFactory);
        SessionStoreFactory['instance'] = undefined;
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
        vi.resetAllMocks();
    });

    it('should create a SqliteSessionStore instance if SESSION_STORE is a file name', () => {
        vi.spyOn(variable, 'SESSION_STORE', 'get').mockReturnValue('sqlite.db');
        const result = factory.getInstance();
        expect(result).toBe(container.resolve(SqliteSessionStore));
    });

    it('should create a MongoDbSessionStore instance if SESSION_STORE is set to a valid MongoDB URL', () => {
        vi.spyOn(variable, 'SESSION_STORE', 'get').mockReturnValue('mongodb://localhost:27017/test');
        const result = factory.getInstance();
        expect(result).toBe(container.resolve(MongoDbSessionStore));
    });
});
