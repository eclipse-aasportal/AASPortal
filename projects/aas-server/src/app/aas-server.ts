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

container.register(LOGGER, { useFactory: c => new ConsoleLogger(c.resolve(Variable).LOG_LEVEL) });
container.afterResolution(
    Database,
    (_, instance) => {
        (instance as Database).start(container.resolve(WSServer));
    },
    { frequency: 'Once' },
);

await container.resolve(PackageRepository).start();
container.resolve(WSServer).run();
