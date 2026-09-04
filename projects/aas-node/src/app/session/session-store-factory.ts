/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { container, singleton } from 'tsyringe';
import { MongoDbSessionStore } from './mongo-db-session-store.js';
import { Variable } from '../variable.js';
import { SqliteSessionStore } from './sqlite-session-store.js';
import { SessionStore } from './session-store.js';

/**
 * A factory class for creating and managing a singleton instance of the `SessionStore`.
 * This class provides a static method to retrieve the instance of the `SessionStore`, creating it if it doesn't already exist.
 * The session store is configured based on the provided dependency container, which resolves necessary dependencies such as
 * the session store URL and MongoDB connection provider.
 */
@singleton()
export class SessionStoreFactory {
    private static instance?: SessionStore;
    private readonly variable = container.resolve(Variable);

    public getInstance(): SessionStore | undefined {
        if (!SessionStoreFactory.instance) {
            const url = this.variable.SESSION_STORE;
            if (url?.startsWith('mongodb:')) {
                SessionStoreFactory.instance = container.resolve(MongoDbSessionStore);
            } else {
                SessionStoreFactory.instance = container.resolve(SqliteSessionStore);
            }
        }

        return SessionStoreFactory.instance;
    }
}
