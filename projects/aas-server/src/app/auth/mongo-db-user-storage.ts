/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, injectable } from 'tsyringe';
import { Schema, model } from 'mongoose';
import { UserData } from './user-data.js';
import { UserStorage } from './user-storage.js';
import { MongoDBConnection } from './mongo-db-connection.js';

@injectable()
export class MongoDBUserStorage extends UserStorage {
    private readonly userDataSchema = new Schema<UserData>({
        id: { type: String, required: true },
        name: { type: String, required: true },
        role: { type: String, required: true },
        password: { type: String, required: true },
        created: { type: Date, required: true },
        lastLoggedIn: { type: Date, required: true },
    });

    public readonly model = model<UserData>('UserDataModel', this.userDataSchema);

    public constructor(@inject(MongoDBConnection) private readonly connection: MongoDBConnection) {
        super();
    }

    public async existAsync(userId: string): Promise<boolean> {
        await this.connection.ensureConnected();
        return (await this.model.findOne({ id: userId }).exec()) != null;
    }

    public async readAsync(userId: string): Promise<UserData | undefined> {
        await this.connection.ensureConnected();
        return (await this.model.findOne({ id: userId }).exec()) ?? undefined;
    }

    public async writeAsync(userId: string, data: UserData): Promise<void> {
        await this.connection.ensureConnected();
        let instance = await this.model.findOne({ id: userId }).exec();
        if (instance) {
            instance.name = data.name;
            instance.role = data.role;
            instance.password = data.password;
        } else {
            instance = new this.model(data);
        }

        await instance.save();
    }

    public async deleteAsync(userId: string): Promise<boolean> {
        await this.connection.ensureConnected();
        return (await this.model.findOneAndDelete({ id: userId }).exec()) != null;
    }
}