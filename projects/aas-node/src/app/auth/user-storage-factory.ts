/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { DependencyContainer } from 'tsyringe';
import { UserStorage } from './user-storage.js';
import { LocalUserStorage } from './local-user-storage.js';
import { Variable } from '../variable.js';
import { MongoDBUserStorage } from './mongo-db-user-storage.js';
import { Logger } from '../logging/logger.js';
import { urlToString } from '../convert.js';

/* istanbul ignore next */
export class UserStorageFactory {
    public constructor(private readonly container: DependencyContainer) {}

    public create(): UserStorage {
        const url = this.container.resolve(Variable).USER_STORAGE;
        const logger = this.container.resolve<Logger>('Logger');
        if (url) {
            try {
                const protocol = new URL(url).protocol;
                if (protocol === 'mongodb:') {
                    const storage = this.container.resolve(MongoDBUserStorage);
                    logger.info(`User storage connected to "${urlToString(url)}".`);
                    return storage;
                } else {
                    throw new Error(`"${urlToString(url)}" is a not supported user storage.`);
                }
            } catch (error) {
                logger.error(error);
            }
        }

        const storage = this.container.resolve(LocalUserStorage);
        logger.info(`Using internal user storage.`);
        return storage;
    }
}
