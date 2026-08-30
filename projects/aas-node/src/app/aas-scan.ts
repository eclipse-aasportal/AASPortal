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
import { LOG_LEVEL, LOGGER, LoggerFactory } from 'aas-package';
import { ScanApp } from './scan/scan-app.js';
import { AASIndexFactory } from './index/aas-index-factory.js';
import { Variable } from './variable.js';
import { AAS_INDEX } from './index/aas-index.js';

parentPort?.on('close', () => {
    container.dispose();
});

container.register(LOG_LEVEL, { useValue: container.resolve(Variable).LOG_LEVEL });
container.register(LOGGER, { useFactory: c => c.resolve(LoggerFactory).getInstance() });
container.register(AAS_INDEX, { useFactory: c => c.resolve(AASIndexFactory).getInstance() });
container.resolve(ScanApp).run();
