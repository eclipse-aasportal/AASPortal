/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { DependencyContainer } from 'tsyringe';
import { CookieStorage } from './cookie-storage.js';
import { LocaleCookieStorage } from './locale-cookie-storage.js';
import { Variable } from '../variable.js';
import { MongoDBCookieStorage } from './mongo-db-cookie-storage.js';
import { Logger } from '../logging/logger.js';

/* istanbul ignore next */
export class CookieStorageFactory {
    constructor(private readonly container: DependencyContainer) {
    }

    public create(): CookieStorage {
        const url = this.container.resolve(Variable).USER_STORAGE;
        const logger = this.container.resolve<Logger>('Logger');
        if (url) {
            try {
                if (new URL(url).protocol === 'mongodb:') {
                    const storage = this.container.resolve(MongoDBCookieStorage);
                    logger.info(`Using user database at: ${url}`);
                    return storage;
                } else {
                    throw new Error(`${url} is not supported cookie storage.`);
                }
            } catch (error) {
                logger.error(error);
            }
        }

        const storage = this.container.resolve(LocaleCookieStorage);
        logger.info(`Using locale user database.`);
        return storage;
    }
}