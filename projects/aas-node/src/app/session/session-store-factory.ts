/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { DependencyContainer } from 'tsyringe';
import { LOGGER, MongoDBConnectionProvider } from 'aas-package';
import { ApplicationError } from 'aas-core';
import { SessionStore } from './session-store.js';
import { Variable } from '../variable.js';

/**
 * A factory class for creating and managing a singleton instance of the `SessionStore`.
 * This class provides a static method to retrieve the instance of the `SessionStore`, creating it if it doesn't already exist.
 * The session store is configured based on the provided dependency container, which resolves necessary dependencies such as
 * the session store URL and MongoDB connection provider.
 */
export class SessionStoreFactory {
    private static instance?: SessionStore;

    public static getInstance(c: DependencyContainer): SessionStore | undefined {
        if (!SessionStoreFactory.instance) {
            const url = c.resolve(Variable).SESSION_STORE;
            const variable = c.resolve(Variable);
            if (!url) {
                SessionStoreFactory.instance = undefined;
            } else if (url.startsWith('mongodb:')) {
                const connection = c.resolve(MongoDBConnectionProvider).getConnection(url);
                SessionStoreFactory.instance = new SessionStore(c.resolve(LOGGER), connection, variable);
            } else {
                throw new ApplicationError(`Unknown session store: ${url}`);
            }
        }

        return SessionStoreFactory.instance;
    }
}
