/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { container } from 'tsyringe';
import { WSServer } from './ws-server.js';
import { PackageRepository } from './package-repository.js';
import { Database } from './db/database.js';
import { ConsoleLogger } from './logging/console-logger.js';
import { LOGGER } from './logging/logger.js';
import { Variable } from './variable.js';
import { API_KEY_HANDLER } from './auth/api-key-handler.js';
import { MongoDBApiKeyManager } from './auth/mongodb-api-key-handler.js';
import { LocalApiKeyHandler } from './auth/local-api-key-handler.js';

container.register(LOGGER, { useFactory: c => new ConsoleLogger(c.resolve(Variable).LOG_LEVEL) });
container.register(API_KEY_HANDLER, {
    useFactory: c => {
        const value = c.resolve(Variable).API_KEY_HANDLER;
        if (!value || value.startsWith('file:')) {
            return c.resolve(LocalApiKeyHandler);
        }

        if (value.startsWith('mongodb')) {
            return c.resolve(MongoDBApiKeyManager);
        }

        throw new Error(`Unknown cookie storage: ${value}`);
    },
});

container.afterResolution(
    Database,
    (_, instance) => {
        (instance as Database).start(container.resolve(WSServer));
    },
    { frequency: 'Once' },
);

await container.resolve(PackageRepository).start();
container.resolve(WSServer).run();
