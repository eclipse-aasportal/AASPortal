/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { container, instanceCachingFactory } from 'tsyringe';
import { createEndpoint, LogClient, LOGGER } from 'aas-package';
import { Variable } from './variable.js';
import { IDENTITY_PROVIDER } from './auth/identity-provider-client.js';
import { COOKIE_STORE } from './cookie-storage/cookie-store.js';
import { SESSION_STORE } from './session/session-store.js';
import { USER_RIGHTS_STORE } from './auth/user-rights-store.js';
import { USER_STORE } from './auth/user-store.js';
import { AAS_INDEX } from './index/aas-index.js';
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
import { EndpointProvider } from './provider/endpoint-provider.js';
import { MdbIndex } from './index/mdb-index.js';
import { SqliteIndex } from './index/sqlite-index.js';

container.register(LOGGER, { useValue: new LogClient(createEndpoint('aas-node-log'), true) });

container.register(COOKIE_STORE, {
    useFactory: instanceCachingFactory(c => {
        const value = c.resolve(Variable).COOKIE_STORE;
        if (value.startsWith('mongodb:')) {
            return c.resolve(MongoDBCookieStore);
        }

        return c.resolve(SqliteCookieStore);
    }),
});

container.register(IDENTITY_PROVIDER, {
    useFactory: instanceCachingFactory(c => {
        const value = c.resolve(Variable).IDENTITY_PROVIDER;
        if (value.startsWith('https:') || value.startsWith('http:')) {
            return c.resolve(OidcClient);
        }

        return c.resolve(IdentityProvider);
    }),
});

container.register(SESSION_STORE, {
    useFactory: instanceCachingFactory(c => {
        const url = c.resolve(Variable).SESSION_STORE;
        if (url?.startsWith('mongodb:')) {
            return c.resolve(MongoDbSessionStore);
        }

        return c.resolve(SqliteSessionStore);
    }),
});

container.register(USER_RIGHTS_STORE, {
    useFactory: instanceCachingFactory(c => {
        const variable = c.resolve(Variable);
        if (variable.USER_RIGHTS_STORE.startsWith('mongodb:')) {
            return c.resolve(MongoDBUserRightsStore);
        }

        return c.resolve(SqliteUserRightsStore);
    }),
});

container.register(USER_STORE, {
    useFactory: instanceCachingFactory(c => {
        const variable = c.resolve(Variable);
        if (variable.USER_STORE.startsWith('mongodb:')) {
            return c.resolve(MongoDBUserStore);
        }

        return c.resolve(SqliteUserStore);
    }),
});

container.register(AAS_INDEX, {
    useFactory: instanceCachingFactory(c => {
        const url = c.resolve(Variable).AAS_INDEX.toLocaleLowerCase();
        if (url.startsWith('mysql:')) {
            return c.resolve(MdbIndex);
        }

        return c.resolve(SqliteIndex);
    }),
});

container.resolve(WSNode);
container.resolve(EndpointProvider);
