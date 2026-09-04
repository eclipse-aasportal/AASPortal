/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { beforeEach, describe, expect, it } from 'vitest';
import { container } from 'tsyringe';

import { SqliteUserRightsStore } from './sqlite-user-rights-store.js';
import { SqliteConnectionProvider } from '../sqlite-connection-provider.js';
import { Variable } from '../variable.js';
import { createSpyObj } from '../../test/mocks.js';
import { Logger, LOGGER } from 'aas-package';

describe('SqliteUserRightsStore', () => {
    let store: SqliteUserRightsStore;

    beforeEach(() => {
        container.clearInstances();
        container.registerInstance(LOGGER, createSpyObj<Logger>(['error', 'warning', 'info']));
        container.registerInstance(
            Variable,
            createSpyObj<Variable>([], { USER_RIGHTS_STORE: ':memory:', CONTENT_ROOT: '' }),
        );

        container.registerSingleton(SqliteConnectionProvider);
        container.registerSingleton(SqliteUserRightsStore);

        store = container.resolve(SqliteUserRightsStore);
    });
    it('should add, retrieve, update, and delete user rights', async () => {
        await store.add('user-1', { role: 'user' });
        expect(await store.get('user-1')).toEqual({ id: 'user-1', role: 'user' });

        await store.update('user-1', { role: 'admin' });
        expect(await store.get('user-1')).toEqual({ id: 'user-1', role: 'admin' });

        await store.delete('user-1');
        expect(await store.get('user-1')).toEqual({ id: 'user-1', role: 'user' });
    });

    it('should preserve an unset user role', async () => {
        await store.add('user-1', { role: 'user' });
        await store.update('user-1', {});

        expect(await store.get('user-1')).toEqual({ id: 'user-1', role: 'user' });
    });
});
