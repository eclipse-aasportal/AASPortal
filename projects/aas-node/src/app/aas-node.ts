/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { container, instanceCachingFactory } from 'tsyringe';
import path from 'path';
import { LOGGER, LoggerProxy, LOGGER_SCRIPT } from 'aas-package';
import { Variable } from './variable.js';
import { IDENTITY_PROVIDER } from './auth/identity-provider-client.js';
import { COOKIE_STORE } from './cookie-storage/cookie-store.js';
import { SESSION_STORE } from './session/session-store.js';
import { USER_RIGHTS_STORE } from './auth/user-rights-store.js';
import { USER_STORE } from './auth/user-store.js';
import { AAS_INDEX } from './index/aas-index.js';
import { AASIndexClient } from './index/aas-index-client.js';
import { WSNode } from './ws-node.js';
import { MongoDBUserStore } from './auth/mongo-db-user-store.js';
import { SqliteUserStore } from './auth/sqlite-user-store.js';
import { MongoDBUserRightsStore } from './auth/mongo-db-user-rights-store.js';
import { SqliteUserRightsStore } from './auth/sqlite-user-rights-store.js';
import { MongoDbSessionStore } from './session/mongo-db-session-store.js';
import { SqliteSessionStore } from './session/sqlite-session-store.js';
import { OidcClient } from './auth/oidc-client.js';
import { IdentityProvider } from './auth/identity-provider.js';
import { MongoDBCookieStore } from './cookie-storage/mongo-db-cookie-store.js';
import { SqliteCookieStore } from './cookie-storage/sqlite-cookie-store.js';

container.registerSingleton(LOGGER, LoggerProxy);
container.register(LOGGER_SCRIPT, { useFactory: c => path.join(c.resolve(Variable).CONTENT_ROOT, 'aas-log.js') });

container.register(COOKIE_STORE, {
    useFactory: instanceCachingFactory(c => {
        const value = c.resolve(Variable).COOKIE_STORE;
        if (value.startsWith('mongodb:')) {
            return c.resolve(MongoDBCookieStore);
        } else {
            return c.resolve(SqliteCookieStore);
        }
    }),
});

container.register(IDENTITY_PROVIDER, {
    useFactory: instanceCachingFactory(c => {
        const value = c.resolve(Variable).IDENTITY_PROVIDER;
        if (value.startsWith('https:') || value.startsWith('http:')) {
            return c.resolve(OidcClient);
        } else {
            return c.resolve(IdentityProvider);
        }
    }),
});

container.register(SESSION_STORE, {
    useFactory: instanceCachingFactory(c => {
        const url = c.resolve(Variable).SESSION_STORE;
        if (url?.startsWith('mongodb:')) {
            return c.resolve(MongoDbSessionStore);
        } else {
            return c.resolve(SqliteSessionStore);
        }
    }),
});

container.register(USER_RIGHTS_STORE, {
    useFactory: instanceCachingFactory(c => {
        const variable = c.resolve(Variable);
        if (variable.USER_RIGHTS_STORE.startsWith('mongodb:')) {
            return c.resolve(MongoDBUserRightsStore);
        } else {
            return c.resolve(SqliteUserRightsStore);
        }
    }),
});

container.register(USER_STORE, {
    useFactory: instanceCachingFactory(c => {
        const variable = c.resolve(Variable);
        if (variable.USER_STORE.startsWith('mongodb:')) {
            return c.resolve(MongoDBUserStore);
        } else {
            return c.resolve(SqliteUserStore);
        }
    }),
});

container.registerSingleton(AAS_INDEX, AASIndexClient);

container.resolve(WSNode);
