/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { container, singleton } from 'tsyringe';
import { CookieStore } from './cookie-store.js';
import { Variable } from '../variable.js';
import { MongoDBCookieStore } from './mongo-db-cookie-store.js';
import { SqliteCookieStore } from './sqlite-cookie-store.js';

@singleton()
export class CookieStorageFactory {
    private static instance?: CookieStore;

    public getInstance(): CookieStore {
        if (!CookieStorageFactory.instance) {
            const value = container.resolve(Variable).COOKIE_STORE;
            if (value.startsWith('mongodb:')) {
                CookieStorageFactory.instance = container.resolve(MongoDBCookieStore);
            } else {
                CookieStorageFactory.instance = container.resolve(SqliteCookieStore);
            }
        }

        return CookieStorageFactory.instance;
    }
}
