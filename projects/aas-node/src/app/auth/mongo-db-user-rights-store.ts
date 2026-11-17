/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { container, singleton } from 'tsyringe';
import mongoose from 'mongoose';
import { AASEndpointAuth, UserRole } from 'aas-core';
import { Logger, LOGGER, MongoDBConnectionProvider } from 'aas-package';

import { Rights, UserRights, UserRightsStore } from './user-rights-store.js';
import { Variable } from '../variable.js';

interface UserRightsDocument extends UserRights, mongoose.Document {}

@singleton()
export class MongoDBUserRightsStore implements UserRightsStore {
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
        this.model = this.connectionProvider
            .getConnection(this.variable.USER_RIGHTS_STORE)
            .model<UserRightsDocument>('UserRights', this.schema);

        this.logger.info(`Using MongoDB user rights store ${this.variable.USER_RIGHTS_STORE}.`);

        this.setupDefaultAdmin();
    }

    public async getRole(userId: string): Promise<UserRole> {
        const value = await this.model.findOne({ id: userId }).exec();
        if (!value) {
            return 'viewer';
        }

        return value.role;
    }

    public async getEndpoints(userId: string): Promise<AASEndpointAuth[]> {
        const value = await this.model.findOne({ id: userId }).exec();
        if (!value) {
            return [];
        }

        return value.endpoints;
    }

    public async add(userId: string, rights: Rights): Promise<void> {
        await new this.model({ id: userId, ...rights }).save();
    }

    public async update(userId: string, rights: Partial<Rights>): Promise<void> {
        if (rights.role !== undefined) {
            await this.model.updateOne({ id: userId }, { role: rights.role }).exec();
        }

        if (rights.endpoints !== undefined) {
            await this.model.updateOne({ id: userId }, { endpoints: rights.endpoints }).exec();
        }
    }

    public async delete(userId: string): Promise<void> {
        await this.model.deleteOne({ id: userId }).exec();
    }

    private async setupDefaultAdmin(): Promise<void> {
        const adminId = this.variable.DEFAULT_ADMIN;
        if (!adminId) {
            return;
        }

        const value = await this.model.findOne({ id: adminId }).exec();
        if (!value) {
            await new this.model({ id: adminId, role: 'admin', endpoints: [] }).save();
            this.logger.info(`"${adminId}" is set up as default admin.`);
        }
    }
}
