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
import { LOGGER, Logger } from 'aas-package';

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

        container.register(COOKIE_STORE, SqliteCookieStore);
        store = container.resolve(COOKIE_STORE);
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
});
