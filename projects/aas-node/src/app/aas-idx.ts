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
import { LOGGER, LoggerProxy } from 'aas-package';
import { IndexApp } from './index/index-app.js';
import { AAS_INDEX } from './index/aas-index.js';
import { MySqlIndex } from './index/mysql/mysql-index.js';
import { Variable } from './variable.js';
import { SqliteIndex } from './index/sqlite/sqlite-index.js';

parentPort?.on('close', () => {
    container.dispose();
});

container.registerSingleton(LOGGER, LoggerProxy);
container.register(AAS_INDEX, {
    useFactory: instanceCachingFactory(c => {
        const url = c.resolve(Variable).AAS_INDEX.toLocaleLowerCase();
        if (url.startsWith('mysql:')) {
            return c.resolve(MySqlIndex);
        }

        return c.resolve(SqliteIndex);
    }),
});

container.resolve(IndexApp);
