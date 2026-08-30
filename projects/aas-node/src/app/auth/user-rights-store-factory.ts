/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { container, singleton } from 'tsyringe';
import { Variable } from '../variable.js';
import { UserRightsStore } from './user-rights-store.js';
import { MongoDBUserRightsStore } from './mongo-db-user-rights-store.js';
import { SqliteUserRightsStore } from './sqlite-user-rights-store.js';

@singleton()
export class UserRightsStoreFactory {
    private readonly variable = container.resolve(Variable);
    private static instance: UserRightsStore;

    public getInstance(): UserRightsStore {
        if (!UserRightsStoreFactory.instance) {
            if (this.variable.USER_RIGHTS_STORE.startsWith('mongodb:')) {
                UserRightsStoreFactory.instance = container.resolve(MongoDBUserRightsStore);
            } else {
                UserRightsStoreFactory.instance = container.resolve(SqliteUserRightsStore);
            }
        }

        return UserRightsStoreFactory.instance;
    }
}
