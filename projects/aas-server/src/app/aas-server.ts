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
import { LOGGER, LOGGER_SCRIPT, LoggerProxy } from 'aas-package';

import { PackageRepository } from './package-repository.js';
import { Database } from './db/database.js';
import { Variable } from './variable.js';
import { API_KEY_HANDLER } from './auth/api-key-handler.js';
import { ApiKeyHandlerFactory } from './auth/api-key-handler-factory.js';
import { WSServer } from './ws-server.js';

container.register(LOGGER_SCRIPT, { useFactory: c => path.join(c.resolve(Variable).CONTENT_ROOT, 'aas-log.js') });
container.registerSingleton(LOGGER, LoggerProxy);
container.register(API_KEY_HANDLER, { useFactory: c => ApiKeyHandlerFactory.getInstance(c) });

container.resolve(Database).start(container.resolve(WSServer));
await container.resolve(PackageRepository).start();
