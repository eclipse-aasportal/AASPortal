/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { container } from 'tsyringe';
import { ConsoleLogger, LOGGER } from 'aas-package';
import { WSNode } from './ws-node.js';
import { AASProvider } from './provider/aas-provider.js';
import { AASIndexFactory } from './index/aas-index-factory.js';
import { Variable } from './variable.js';
import { AAS_INDEX } from './index/aas-index.js';
import { IDENTITY_PROVIDER } from './auth/identity-provider-client.js';
import { COOKIE_STORAGE } from './cookie-storage/cookie-storage.js';
import { LocalCookieStorage } from './cookie-storage/local-cookie-storage.js';
import { MongoDBCookieStorage } from './cookie-storage/mongo-db-cookie-storage.js';
import { MongoDBIdentityProvider } from './auth/mongo-db-identity-provider.js';
import { FileSystemIdentityProvider } from './auth/file-system-identity-provider.js';
import { OicdClient } from './auth/oicd-client.js';

container.register(LOGGER, { useFactory: c => new ConsoleLogger(c.resolve(Variable).LOG_LEVEL) });
container.register(AAS_INDEX, { useFactory: c => new AASIndexFactory(c).create() });

container.register(COOKIE_STORAGE, {
    useFactory: c => {
        const value = c.resolve(Variable).COOKIE_STORAGE;
        if (!value || value.startsWith('file:')) {
            return c.resolve(LocalCookieStorage);
        }

        if (value.startsWith('mongodb')) {
            return c.resolve(MongoDBCookieStorage);
        }

        throw new Error(`Unknown cookie storage: ${value}`);
    },
});

container.register(IDENTITY_PROVIDER, {
    useFactory: c => {
        const value = c.resolve(Variable).IDENTITY_PROVIDER;
        if (!value || value.startsWith('file:')) {
            return c.resolve(FileSystemIdentityProvider);
        }

        if (value.startsWith('mongodb:')) {
            return c.resolve(MongoDBIdentityProvider);
        }

        if (value.startsWith('https:') || value.startsWith('http:')) {
            return c.resolve(OicdClient);
        }

        throw new Error(`Unknown identity provider: ${value}`);
    },
});

container.afterResolution(
    AASProvider,
    (_, instance) => {
        (instance as AASProvider).start(container.resolve(WSNode));
    },
    { frequency: 'Once' },
);

container.resolve(WSNode).run();
container.resolve(AASProvider);
