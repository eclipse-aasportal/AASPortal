/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, injectable } from 'tsyringe';
import mongoose, { Mongoose, Schema, model } from 'mongoose';
import { Cookie } from 'aas-core';
import { UserData } from './user-data.js';
import { UserStorage } from './user-storage.js';
import { Variable } from '../variable.js';

export interface UserCookies {
    id: string;
    cookies: Array<Cookie>;
}

@injectable()
export class MongoDBUserStorage extends UserStorage {
    private connected: Promise<Mongoose>;

    private readonly userDataSchema = new Schema<UserData>({
        id: { type: String, required: true },
        name: { type: String, required: true },
        role: { type: String, required: true },
        password: { type: String, required: true },
        created: { type: Date, required: true },
        lastLoggedIn: { type: Date, required: true },
    });

    private readonly userCookiesSchema = new Schema<UserCookies>({
        id: String,
        cookies: [
            {
                name: String,
                data: String,
            },
        ],
    });

    public readonly userModel = model<UserData>('UserDataModel', this.userDataSchema);

    public readonly cookieModel = model<UserCookies>('UserCookiesModel', this.userCookiesSchema);

    public constructor(@inject(Variable) private readonly variable: Variable) {
        super();

        this.connected = this.connect();
    }

    public async exist(userId: string): Promise<boolean> {
        await this.connected;
        return (await this.userModel.findOne({ id: userId }).exec()) != null;
    }

    public async read(userId: string): Promise<UserData | undefined> {
        await this.connected;
        return (await this.userModel.findOne({ id: userId }).exec()) ?? undefined;
    }

    public async write(userId: string, data: UserData): Promise<void> {
        await this.connected;
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

    public async delete(userId: string): Promise<boolean> {
        await this.connected;
        return (await this.userModel.findOneAndDelete({ id: userId }).exec()) != null;
    }

    public async checkCookie(userId: string, name: string): Promise<boolean> {
        await this.connected;
        const user = await this.cookieModel.findOne({ id: userId }).exec();
        if (user != null) {
            return user.cookies.some(cookie => cookie.name === name);
        }

        return false;
    }

    public async getCookie(userId: string, name: string): Promise<Cookie | undefined> {
        await this.connected;
        const user = await this.cookieModel.findOne({ id: userId }).exec();
        if (user != null) {
            return user.cookies.find(cookie => cookie.name === name);
        }

        return undefined;
    }

    public async getCookies(userId: string): Promise<Cookie[]> {
        await this.connected;
        const user = await this.cookieModel.findOne({ id: userId }).exec();
        if (user != null) {
            return user.cookies;
        }

        return [];
    }

    public async setCookie(userId: string, name: string, data: string): Promise<void> {
        await this.connected;
        let user = await this.cookieModel.findOne({ id: userId }).exec();
        if (user) {
            const index = user.cookies.findIndex(cookie => cookie.name === name);
            if (index < 0) {
                user.cookies.push({ name, data });
            } else {
                user.cookies[index].data = data;
            }
        } else {
            user = new this.cookieModel({ id: userId, cookies: [{ name, data }] });
        }

        await user.save();
    }

    public async deleteCookie(userId: string, name: string): Promise<void> {
        await this.connected;
        const user = await this.cookieModel.findOne({ id: userId }).exec();
        if (user) {
            const index = user.cookies.findIndex(cookie => cookie.name === name);
            if (index >= 0) {
                user.cookies.splice(index, 1);
                if (user.cookies.length > 0) {
                    await user.save();
                } else {
                    await user.deleteOne();
                }
            }
        }
    }

    private connect(): Promise<Mongoose> {
        const url = new URL(this.variable.USER_STORAGE!);
        const username = url.username ?? this.variable.AAS_NODE_USERNAME;
        const password = url.password ?? this.variable.AAS_NODE_PASSWORD;
        const dbName = url.pathname?.substring(1) ?? 'aasportal-users';
        url.username = '';
        url.password = '';
        url.pathname = '';
        return mongoose.connect(url.href, {
            dbName: dbName,
            user: username,
            pass: password,
        });
    }
}
