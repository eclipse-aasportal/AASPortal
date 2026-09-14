/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { container } from 'tsyringe';
import path from 'path';
import { LOGGER, LoggerProxy, LOGGER_SCRIPT } from 'aas-package';
import { WSNode } from './ws-node.js';
import { Variable } from './variable.js';
import { IDENTITY_PROVIDER } from './auth/identity-provider-client.js';
import { COOKIE_STORE } from './cookie-storage/cookie-store.js';
import { EndpointProvider } from './provider/endpoint-provider.js';
import { SESSION_STORE } from './session/session-store.js';
import { CookieStorageFactory } from './cookie-storage/cookie-store-factory.js';
import { IdentityProviderFactory } from './auth/identity-provider-factory.js';
import { SessionStoreFactory } from './session/session-store-factory.js';
import { UserRightsStoreFactory } from './auth/user-rights-store-factory.js';
import { USER_RIGHTS_STORE } from './auth/user-rights-store.js';
import { UserStoreFactory } from './auth/user-store-factory.js';
import { USER_STORE } from './auth/user-store.js';
import { AAS_INDEX } from './index/aas-index.js';
import { AASIndexClient } from './index/aas-index-client.js';

container.registerSingleton(LOGGER, LoggerProxy);
container.register(LOGGER_SCRIPT, { useFactory: c => path.join(c.resolve(Variable).CONTENT_ROOT, 'aas-log.js') });
container.register(COOKIE_STORE, { useFactory: c => c.resolve(CookieStorageFactory).getInstance() });
container.register(IDENTITY_PROVIDER, { useFactory: c => c.resolve(IdentityProviderFactory).getInstance() });
container.register(SESSION_STORE, { useFactory: c => c.resolve(SessionStoreFactory).getInstance() });
container.register(USER_RIGHTS_STORE, { useFactory: c => c.resolve(UserRightsStoreFactory).getInstance() });
container.register(USER_STORE, { useFactory: c => c.resolve(UserStoreFactory).getInstance() });
container.registerSingleton(AAS_INDEX, AASIndexClient);

await container.resolve(EndpointProvider).start(container.resolve(WSNode));
