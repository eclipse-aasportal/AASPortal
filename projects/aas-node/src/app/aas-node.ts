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
import { LoggerFactory } from './logging/logger-factory.js';
import { FileLogger } from './logging/file-logger.js';
import { WSNode } from './ws-node.js';
import { AASProvider } from './aas-provider/aas-provider.js';
import { AASIndexFactory } from './aas-index/aas-index-factory.js';
import { TemplateStorage } from './template/template-storage.js';

container.registerInstance('USERS_DIR', './users');
container.registerSingleton('Logger', FileLogger);
container.register('AASIndex', { useFactory: c => new AASIndexFactory(c).create() });
container.register('UserStorage', { useFactory: c => new UserStorageFactory(c).create() });
container.register('winston.Logger', { useFactory: () => new LoggerFactory().create() });

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
