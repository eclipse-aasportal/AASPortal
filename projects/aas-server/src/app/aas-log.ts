/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { container, instanceCachingFactory } from 'tsyringe';
import { parentPort } from 'worker_threads';
import { ConsoleLogger, LOG_LEVEL, LOGGER, LoggerApp } from 'aas-package';
import { Variable } from './variable.js';

parentPort?.once('close', () => {
    container.dispose();
});

container.register(LOG_LEVEL, { useValue: container.resolve(Variable).LOG_LEVEL });
container.register(LOGGER, { useFactory: instanceCachingFactory(c => c.resolve(ConsoleLogger)) });

container.resolve(LoggerApp);
