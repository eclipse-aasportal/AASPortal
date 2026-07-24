/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, injectable } from 'tsyringe';
import mongoose from 'mongoose';
import { Logger, LOGGER, MongoDBConnectionProvider } from 'aas-package';

import { Variable } from '../variable.js';
import { IdentityProvider, UserData } from './identity-provider.js';
import { COOKIE_STORE, type CookieStorage } from '../cookie-storage/cookie-storage.js';

interface UserDocument extends UserData, mongoose.Document {}

@injectable()
export class MongoDBIdentityProvider extends IdentityProvider {
    private readonly connection: mongoose.Connection;
    private readonly userModel: mongoose.Model<UserDocument>;

    private readonly schema = new mongoose.Schema<UserDocument>({
        id: { type: String, required: true },
        name: { type: String, required: true },
        role: { type: String, required: true },
        password: { type: String, required: true },
        created: { type: Date, required: true },
    });

    public constructor(
        @inject(LOGGER) logger: Logger,
        @inject(COOKIE_STORE) cookies: CookieStorage,
        @inject(Variable) variable: Variable,
        @inject(MongoDBConnectionProvider) connectionProvider: MongoDBConnectionProvider,
    ) {
        super(logger, cookies, variable);

        this.connection = connectionProvider.getConnection(variable.IDENTITY_PROVIDER!);
        this.userModel = this.connection.model<UserDocument>('User', this.schema);
        this.logger.info('Using MongoDB identity provider');
    }

    protected override async read(userId: string): Promise<UserData | undefined> {
        return (await this.userModel.findOne({ id: userId }).exec()) ?? undefined;
    }

    protected override async write(userId: string, data: UserData): Promise<void> {
        let instance = await this.userModel.findOne({ id: userId }).exec();
        if (instance) {
            instance.name = data.name;
            instance.role = data.role;
            instance.password = data.password;
        } else {
            instance = new this.userModel(data);
        }

        await instance.save();
    }

    protected override async delete(userId: string): Promise<boolean> {
        return (await this.userModel.findOneAndDelete({ id: userId }).exec()) != null;
    }
}
