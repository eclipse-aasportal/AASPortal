/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { container } from 'tsyringe';
import { LOG_LEVEL, LOGGER, LoggerFactory } from 'aas-package';

import { WSServer } from './ws-server.js';
import { PackageRepository } from './package-repository.js';
import { Database } from './db/database.js';
import { Variable } from './variable.js';
import { API_KEY_HANDLER } from './auth/api-key-handler.js';
import { ApiKeyHandlerFactory } from './auth/api-key-handler-factory.js';

container.register(LOG_LEVEL, { useValue: container.resolve(Variable).LOG_LEVEL });
container.register(LOGGER, { useFactory: c => c.resolve(LoggerFactory).getInstance() });
container.register(API_KEY_HANDLER, { useFactory: c => ApiKeyHandlerFactory.getInstance(c) });

container.afterResolution(
    Database,
    (_, instance) => {
        (instance as Database).start(container.resolve(WSServer));
    },
    { frequency: 'Once' },
);

await container.resolve(PackageRepository).start();
container.resolve(WSServer).run();
