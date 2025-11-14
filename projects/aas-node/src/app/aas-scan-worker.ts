/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { container } from 'tsyringe';
import { parentPort } from 'worker_threads';
import { WorkerApp } from './worker-app.js';
<<<<<<< HEAD
import { AASIndexFactory } from './aas-index/aas-index-factory.js';
import { LOGGER } from './logging/logger.js';
import { ConsoleLogger } from './logging/console-logger.js';
import { Variable } from './variable.js';
import { AAS_INDEX } from './aas-index/aas-index.js';
=======
import { AASIndexFactory } from './index/aas-index-factory.js';
import { LOGGER } from './logging/logger.js';
import { ConsoleLogger } from './logging/console-logger.js';
import { Variable } from './variable.js';
import { AAS_INDEX } from './index/aas-index.js';
>>>>>>> development

parentPort?.on('close', () => {
    container.dispose();
});

container.register(LOGGER, { useFactory: c => new ConsoleLogger(c.resolve(Variable).LOG_LEVEL) });
container.register(AAS_INDEX, { useFactory: c => new AASIndexFactory(c).create() });

const app = container.resolve(WorkerApp);
app.run();
