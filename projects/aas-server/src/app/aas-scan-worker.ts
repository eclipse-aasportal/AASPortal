/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { MemoryLogger, MemoryLoggerLevel } from './logging/memory-logger.js';
import { container } from 'tsyringe';
import { WorkerApp } from './worker-app.js';

container.register('Logger', MemoryLogger);
container.registerInstance(
    'LOG_LEVEL',
    process.env.NODE_ENV === 'production' ? MemoryLoggerLevel.Error : MemoryLoggerLevel.All,
);

const app = container.resolve(WorkerApp);
app.run();
