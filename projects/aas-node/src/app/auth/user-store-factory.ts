/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { container, singleton } from 'tsyringe';
import { Variable } from '../variable.js';
import { UserStore } from './user-store.js';
import { MongoDBUserStore } from './mongo-db-user-store.js';
import { SqliteUserStore } from './sqlite-user-store.js';

@singleton()
export class UserStoreFactory {
    private readonly variable = container.resolve(Variable);
    private static instance: UserStore;

    public getInstance(): UserStore {
        if (!UserStoreFactory.instance) {
            if (this.variable.USER_STORE.startsWith('mongodb:')) {
                UserStoreFactory.instance = container.resolve(MongoDBUserStore);
            } else {
                UserStoreFactory.instance = container.resolve(SqliteUserStore);
            }
        }

        return UserStoreFactory.instance;
    }
}
