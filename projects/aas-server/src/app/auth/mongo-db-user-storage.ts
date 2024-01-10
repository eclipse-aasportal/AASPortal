/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { injectable } from 'tsyringe';
import { Schema, model } from 'mongoose';
import { UserData } from "./user-data.js";
import { UserStorage } from "./user-storage.js";

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

    public readonly UserDataModel = model<UserData>('UserDataModel', this.userDataSchema);

    public async existAsync(userId: string): Promise<boolean> {
        return (await this.UserDataModel.findOne({ id: userId }).exec()) != null;
    }

    public async readAsync(userId: string): Promise<UserData | undefined> {
        return await this.UserDataModel.findOne({ id: userId }).exec() ?? undefined;
    }

    public async writeAsync(userId: string, data: UserData): Promise<void> {
        let instance = await this.UserDataModel.findOne({ id: userId }).exec();
        if (instance) {
            instance.name = data.name;
            instance.role = data.role;
            instance.password = data.password;
        } else {
            instance = new this.UserDataModel(data);
        }

        await instance.save();
    }

    public async deleteAsync(userId: string): Promise<boolean> {
        return (await this.UserDataModel.findOneAndDelete({ id: userId }).exec()) != null
    }
}