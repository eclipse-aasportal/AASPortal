/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { DependencyContainer } from 'tsyringe';
import { UserStorage } from './user-storage.js';
import { LocaleUserStorage } from './locale-user-storage.js';
import { Variable } from '../variable.js';
import { MongoDBUserStorage } from './mongo-db-user-storage.js';
import { parseUrl } from '../convert.js';
import { Logger } from '../logging/logger.js';

/* istanbul ignore next */
export class UserStorageFactory {
    constructor(private readonly container: DependencyContainer) {
    }

    public create(): UserStorage {
        const url = this.container.resolve(Variable).USER_STORAGE;
        const logger = this.container.resolve<Logger>('Logger');
        if (url) {
            try {
                const protocol = parseUrl(url).protocol;
                if (protocol === 'mongodb:') {
                    return new MongoDBUserStorage();
                } else {
                    throw new Error(`"${url}" is a not supported user storage.`);
                }
            } catch (error) {
                logger.error(error);
            }
        }

        return this.container.resolve(LocaleUserStorage);
    }
}