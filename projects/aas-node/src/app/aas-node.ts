/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { container } from 'tsyringe';
import { UserStorageFactory } from './auth/user-storage-factory.js';
import { WSNode } from './ws-node.js';
import { AASProvider } from './provider/aas-provider.js';
import { AASIndexFactory } from './index/aas-index-factory.js';
import { TemplateStorage } from './template/template-storage.js';
import { LOGGER } from './logging/logger.js';
import { ConsoleLogger } from './logging/console-logger.js';
import { Variable } from './variable.js';
import { AAS_INDEX } from './index/aas-index.js';
import { USER_STORAGE } from './auth/user-storage.js';

container.registerInstance('USERS_DIR', './users');
container.register(LOGGER, { useFactory: c => new ConsoleLogger(c.resolve(Variable).LOG_LEVEL) });
container.register(AAS_INDEX, { useFactory: c => new AASIndexFactory(c).create() });
container.register(USER_STORAGE, { useFactory: c => new UserStorageFactory(c).create() });

container.afterResolution(
    AASProvider,
    (_, instance) => {
        (instance as AASProvider).start(container.resolve(WSNode));
    },
    { frequency: 'Once' },
);

container.resolve(WSNode).run();
container.resolve(AASProvider);
container.resolve(TemplateStorage).start();
