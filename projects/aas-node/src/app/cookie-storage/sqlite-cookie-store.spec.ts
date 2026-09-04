/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { container } from 'tsyringe';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LOGGER, Logger } from 'aas-package';

import { CookieStorageFactory } from './cookie-store-factory.js';
import { SqliteCookieStore } from './sqlite-cookie-store.js';
import { createSpyObj } from '../../test/mocks.js';
import { Variable } from '../variable.js';
import { COOKIE_STORE, CookieStore } from './cookie-store.js';

describe('SqliteCookieStore', () => {
    let store: CookieStore;

    beforeEach(() => {
        container.clearInstances();
        container.registerInstance(LOGGER, createSpyObj<Logger>(['info', 'warning', 'error']));
        container.registerInstance(
            Variable,
            createSpyObj<Variable>([], { COOKIE_STORE: ':memory:', CONTENT_ROOT: '' }),
        );

        container.registerSingleton(CookieStorageFactory);
        container.registerSingleton(SqliteCookieStore);
        container.register(COOKIE_STORE, { useFactory: c => c.resolve(CookieStorageFactory).getInstance() });
        store = container.resolve(COOKIE_STORE);
    });

    afterEach(() => {
        CookieStorageFactory['instance'] = undefined;
    });

    it('should add, retrieve, update, and delete cookies', async () => {
        await store.setCookie('user-1', 'theme', 'light');
        expect(await store.getCookie('user-1', 'theme')).toBe('light');

        await store.setCookie('user-1', 'theme', 'dark');
        await store.setCookie('user-2', 'theme', 'light');
        expect(await store.getCookie('user-1', 'theme')).toBe('dark');
        expect(await store.getCookie('user-2', 'theme')).toBe('light');

        await expect(store.deleteCookie('user-1', 'theme')).resolves.toBeUndefined();
        await expect(store.deleteCookie('user-1', 'theme')).resolves.toBeUndefined();
        await expect(store.getCookie('user-1', 'theme')).resolves.toBeUndefined();
        expect(await store.getCookie('user-2', 'theme')).toBe('light');
    });

    it('should persist endpoint data through the cookie store API', async () => {
        const endpoints = [{ name: 'endpoint-1', headers: { authorization: 'Bearer token' } }];

        await store.updatesEndpoints('user-1', endpoints);

        await expect(store.getEndpoints('user-1')).resolves.toEqual(endpoints);
    });

    it('should create a SQLite store for a sqlite cookie storage URL', () => {
        expect(container.resolve(CookieStorageFactory).getInstance()).toBeInstanceOf(SqliteCookieStore);
    });
});
