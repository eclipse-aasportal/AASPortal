/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { DependencyContainer } from 'tsyringe';
import { CookieStorage } from './cookie-storage.js';
import { Variable } from '../variable.js';
import { LocalCookieStorage } from './local-cookie-storage.js';
import { MongoDBCookieStorage } from './mongo-db-cookie-storage.js';

export class CookieStorageFactory {
    private static instance?: CookieStorage;

    public static getInstance(c: DependencyContainer): CookieStorage {
        if (!CookieStorageFactory.instance) {
            const value = c.resolve(Variable).COOKIE_STORAGE;
            if (!value || value.startsWith('file:')) {
                CookieStorageFactory.instance = c.resolve(LocalCookieStorage);
            } else if (value.startsWith('mongodb')) {
                CookieStorageFactory.instance = c.resolve(MongoDBCookieStorage);
            } else {
                throw new Error(`Unknown cookie storage: ${value}`);
            }
        }

        return CookieStorageFactory.instance;
    }
}
