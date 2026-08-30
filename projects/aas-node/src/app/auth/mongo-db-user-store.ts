/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { container, injectable } from 'tsyringe';
import mongoose from 'mongoose';
import { Logger, LOGGER, MongoDBConnectionProvider } from 'aas-package';

import { Variable } from '../variable.js';
import { UserData, UserStore } from './user-store.js';

interface UserDocument extends UserData, mongoose.Document {}

@injectable()
export class MongoDBUserStore extends UserStore {
    private readonly logger: Logger = container.resolve(LOGGER);
    private readonly variable = container.resolve(Variable);
    private readonly connection = container.resolve(MongoDBConnectionProvider).getConnection(this.variable.USER_STORE!);

    private readonly userModel: mongoose.Model<UserDocument>;

    private readonly schema = new mongoose.Schema<UserDocument>({
        id: { type: String, required: true },
        name: { type: String, required: true },
        password: { type: String, required: true },
        created: { type: Date, required: true },
    });

    public constructor() {
        super();

        this.userModel = this.connection.model<UserDocument>('User', this.schema);
        this.logger.info(`Using MongoDB user store ${this.variable.USER_STORE}.`);
    }

    public override async get(userId: string): Promise<UserData | undefined> {
        return (await this.userModel.findOne({ id: userId }).exec()) ?? undefined;
    }

    public override async set(userId: string, data: UserData): Promise<void> {
        let instance = await this.userModel.findOne({ id: userId }).exec();
        if (instance) {
            instance.name = data.name;
            instance.password = data.password;
        } else {
            instance = new this.userModel(data);
        }

        await instance.save();
    }

    public override async delete(userId: string): Promise<boolean> {
        return (await this.userModel.findOneAndDelete({ id: userId }).exec()) != null;
    }
}
