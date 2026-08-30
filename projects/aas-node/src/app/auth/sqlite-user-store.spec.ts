/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { container } from 'tsyringe';
import { beforeEach, describe, expect, it } from 'vitest';

import { SqliteUserStore } from './sqlite-user-store.js';
import { SqliteConnectionProvider } from '../sqlite-connection-provider.js';
import { Variable } from '../variable.js';
import { createSpyObj } from '../../test/mocks.js';
import { LOGGER, Logger } from 'aas-package';

describe('SqliteUserStore', () => {
    let store: SqliteUserStore;

    beforeEach(() => {
        container.clearInstances();
        container.registerInstance(LOGGER, createSpyObj<Logger>(['error', 'warning', 'info']));
        container.registerInstance(Variable, createSpyObj<Variable>([], { USER_STORE: ':memory:', CONTENT_ROOT: '' }));
        container.registerSingleton(SqliteConnectionProvider);
        container.registerSingleton(SqliteUserStore);

        store = container.resolve(SqliteUserStore);
    });

    it('should add, retrieve, update, and delete users', async () => {
        const created = new Date('2026-08-28T12:00:00.000Z');

        await store.set('user-1', { id: 'user-1', name: 'Alice', password: 'hash-1', created });
        expect(await store.get('user-1')).toEqual({
            id: 'user-1',
            name: 'Alice',
            password: 'hash-1',
            created,
        });

        await store.set('user-1', {
            id: 'user-1',
            name: 'Alice Smith',
            password: 'hash-2',
            created: new Date('2026-08-29T12:00:00.000Z'),
        });

        expect(await store.get('user-1')).toEqual({
            id: 'user-1',
            name: 'Alice Smith',
            password: 'hash-2',
            created,
        });

        await expect(store.delete('user-1')).resolves.toBe(true);
        await expect(store.delete('user-1')).resolves.toBe(false);
        await expect(store.get('user-1')).resolves.toBeUndefined();
    });
});
