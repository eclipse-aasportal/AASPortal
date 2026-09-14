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
import { ScanApp } from './scan/scan-app.js';
import { AAS_INDEX } from './index/aas-index.js';
import { AASIndexClient } from './index/aas-index-client.js';

parentPort?.on('close', () => {
    container.dispose();
});

container.registerSingleton(LOGGER, LoggerProxy);
container.registerSingleton(AAS_INDEX, AASIndexClient);

container.resolve(ScanApp);
