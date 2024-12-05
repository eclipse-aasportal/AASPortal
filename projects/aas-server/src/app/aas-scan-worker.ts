/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { container } from 'tsyringe';
import { parentPort } from 'worker_threads';
import { MemoryLogger, MemoryLoggerLevel } from './logging/memory-logger.js';
import { WorkerApp } from './worker-app.js';
import { AASIndexFactory } from './aas-index/aas-index-factory.js';

parentPort?.on('close', () => {
    container.dispose();
});

container.register('Logger', MemoryLogger);
container.register('AASIndex', { useFactory: c => new AASIndexFactory(c).create() });
container.registerInstance(
    'LOG_LEVEL',
    process.env.NODE_ENV === 'production' ? MemoryLoggerLevel.Error : MemoryLoggerLevel.All,
);

const app = container.resolve(WorkerApp);
app.run();
