/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { container, singleton } from 'tsyringe';
import mongoose from 'mongoose';
import { Logger, LOGGER, MongoDBConnectionProvider } from 'aas-package';

import { Rights, UserRights, UserRightsStore } from './user-rights-store.js';
import { Variable } from '../variable.js';
import { AASEndpointAuth, UserRole } from 'aas-core';

interface UserRightsDocument extends UserRights, mongoose.Document {}

@singleton()
export class MongoDBUserRightsStore extends UserRightsStore {
    private readonly logger: Logger = container.resolve(LOGGER);
    private readonly variable = container.resolve(Variable);
    private readonly connectionProvider = container.resolve(MongoDBConnectionProvider);
    private readonly model: mongoose.Model<UserRightsDocument>;
    private readonly schema = new mongoose.Schema<UserRightsDocument>({
        id: { type: String, required: true, unique: true },
        role: { type: String, required: true },
        endpoints: [{ type: Object, required: true }],
    });

    public constructor() {
        super();

        this.model = this.connectionProvider
            .getConnection(this.variable.USER_RIGHTS_STORE)
            .model<UserRightsDocument>('UserRights', this.schema);

        this.logger.info(`Using MongoDB user rights store ${this.variable.USER_RIGHTS_STORE}.`);
    }

    public override async getRole(userId: string): Promise<UserRole> {
        const value = await this.model.findOne({ id: userId }).exec();
        if (!value) {
            return 'viewer';
        }

        return value.role;
    }

    public override async getEndpoints(userId: string): Promise<AASEndpointAuth[]> {
        const value = await this.model.findOne({ id: userId }).exec();
        if (!value) {
            return [];
        }

        return value.endpoints;
    }

    public override async add(userId: string, rights: Rights): Promise<void> {
        await new this.model({ id: userId, ...rights }).save();
    }

    public override async update(userId: string, rights: Partial<Rights>): Promise<void> {
        if (rights.role !== undefined) {
            await this.model.updateOne({ id: userId }, { role: rights.role }).exec();
        }

        if (rights.endpoints !== undefined) {
            await this.model.updateOne({ id: userId }, { endpoints: rights.endpoints }).exec();
        }
    }

    public override async delete(userId: string): Promise<void> {
        await this.model.deleteOne({ id: userId }).exec();
    }
}
