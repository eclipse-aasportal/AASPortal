/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { container } from 'tsyringe';
import { LoggerFactory, LOGGER } from 'aas-package';
import { WSNode } from './ws-node.js';
import { DocumentProvider } from './provider/document-provider.js';
import { AASIndexFactory } from './index/aas-index-factory.js';
import { Variable } from './variable.js';
import { AAS_INDEX } from './index/aas-index.js';
import { IDENTITY_PROVIDER } from './auth/identity-provider-client.js';
import { COOKIE_STORAGE } from './cookie-storage/cookie-storage.js';
import { EndpointProvider } from './provider/endpoint-provider.js';
import { SESSION_STORE } from './session/session-store.js';
import { CookieStorageFactory } from './cookie-storage/cookie-storage-factory.js';
import { IdentityProviderFactory } from './auth/identity-provider-factory.js';
import { SessionStoreFactory } from './session/session-store-factory.js';

container.register(LOGGER, { useFactory: c => LoggerFactory.getInstance(c.resolve(Variable).LOG_LEVEL, false) });
container.register(AAS_INDEX, { useFactory: c => AASIndexFactory.getInstance(c) });
container.register(COOKIE_STORAGE, { useFactory: c => CookieStorageFactory.getInstance(c) });
container.register(IDENTITY_PROVIDER, { useFactory: c => IdentityProviderFactory.getInstance(c) });
container.register(SESSION_STORE, { useFactory: c => SessionStoreFactory.getInstance(c) });

container.afterResolution(
    EndpointProvider,
    (_, instance) => {
        (instance as EndpointProvider).start(container.resolve(WSNode));
    },
    { frequency: 'Once' },
);

container.resolve(WSNode).run();
container.resolve(DocumentProvider);
