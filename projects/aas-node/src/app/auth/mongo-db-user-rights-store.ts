/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, singleton } from 'tsyringe';
import mongoose from 'mongoose';
import { Logger, LOGGER, MongoDBConnectionProvider } from 'aas-package';

import { Rights, UserRights, UserRightsStore } from './user-rights-store.js';
import { Variable } from '../variable.js';

interface UserRightsDocument extends UserRights, mongoose.Document {}

@singleton()
export class MongoDBUserRightsStore extends UserRightsStore {
    private readonly model: mongoose.Model<UserRightsDocument>;
    private readonly schema = new mongoose.Schema<UserRightsDocument>({
        id: { type: String, required: true, unique: true },
        role: { type: String, required: true },
    });

    public constructor(
        @inject(LOGGER) private readonly logger: Logger,
        @inject(MongoDBConnectionProvider) connectionProvider: MongoDBConnectionProvider,
        @inject(Variable) variable: Variable,
    ) {
        super();

        this.model = connectionProvider
            .getConnection(variable.USER_RIGHTS_STORE)
            .model<UserRightsDocument>('UserRights', this.schema);

        this.logger.info(`Using MongoDB user rights store ${variable.USER_RIGHTS_STORE}.`);
    }

    public override async get(userId: string): Promise<UserRights> {
        return (await this.model.findOne({ id: userId }).exec()) ?? { id: userId, role: 'user' };
    }

    public override async add(userId: string, rights: Rights): Promise<void> {
        await new this.model({ id: userId, ...rights }).save();
    }

    public override async update(userId: string, rights: Partial<Rights>): Promise<void> {
        if (rights.role !== undefined) {
            await this.model.updateOne({ id: userId }, { role: rights.role }).exec();
        }
    }

    public override async delete(userId: string): Promise<void> {
        await this.model.deleteOne({ id: userId }).exec();
    }
}
