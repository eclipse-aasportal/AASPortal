/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { container } from 'tsyringe';
import { createEndpoint, LogClient, LOGGER } from 'aas-package';

import { PackageRepository } from './package-repository.js';
import { Database } from './db/database.js';
import { API_KEY_HANDLER } from './auth/api-key-handler.js';
import { ApiKeyHandlerFactory } from './auth/api-key-handler-factory.js';
import { WSServer } from './ws-server.js';

container.register(LOGGER, { useValue: new LogClient(createEndpoint('aas-server-log'), true) });
container.register(API_KEY_HANDLER, { useFactory: c => ApiKeyHandlerFactory.getInstance(c) });

container.resolve(Database).start(container.resolve(WSServer));
await container.resolve(PackageRepository).start();
