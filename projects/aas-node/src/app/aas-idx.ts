/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { container } from 'tsyringe';
import { parentPort } from 'worker_threads';
import { LOGGER, LoggerProxy } from 'aas-package';
import { IndexApp } from './index/index-app.js';
import { AAS_INDEX } from './index/aas-index.js';
import { AASIndexFactory } from './index/aas-index-factory.js';

parentPort?.on('close', () => {
    container.dispose();
});

container.registerSingleton(LOGGER, LoggerProxy);
container.register(AAS_INDEX, { useFactory: c => c.resolve(AASIndexFactory).getInstance() });

container.resolve(IndexApp);
