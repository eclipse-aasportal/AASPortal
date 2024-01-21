/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, injectable } from 'tsyringe';
import { Cookie } from 'common';
import { model, Schema } from 'mongoose';
import { CookieStorage } from './cookie-storage.js';
import { MongoDBConnection } from './mongo-db-connection.js';

export interface UserCookies {
    id: string;
    cookies: Array<Cookie>;
}

@injectable()
export class MongoDBCookieStorage extends CookieStorage {
    private readonly userCookiesSchema = new Schema<UserCookies>({
        id: String,
        cookies: [
            {
                name: String,
                data: String,
            },
        ],
    });

    public readonly model = model<UserCookies>('UserCookiesModel', this.userCookiesSchema);

    public constructor(@inject(MongoDBConnection) private readonly connection: MongoDBConnection) {
        super();
    }

    public async checkAsync(id: string, name: string): Promise<boolean> {
        await this.connection.ensureConnected();
        const user = await this.model.findOne({ id: id }).exec();
        if (user != null) {
            return user.cookies.some(cookie => cookie.name === name);
        }

        return false;
    }

    public async getAsync(id: string, name: string): Promise<Cookie | undefined> {
        await this.connection.ensureConnected();
        const user = await this.model.findOne({ id: id }).exec();
        if (user != null) {
            return user.cookies.find(cookie => cookie.name === name);
        }

        return undefined;
    }

    public async getAllAsync(id: string): Promise<Cookie[]> {
        await this.connection.ensureConnected();
        const user = await this.model.findOne({ id: id }).exec();
        if (user != null) {
            return user.cookies;
        }

        return [];
    }

    public async setAsync(id: string, name: string, data: string): Promise<void> {
        await this.connection.ensureConnected();
        let user = await this.model.findOne({ id: id }).exec();
        if (user) {
            const index = user.cookies.findIndex(cookie => cookie.name === name);
            if (index < 0) {
                user.cookies.push({ name, data });
            } else {
                user.cookies[index].data = data;
            }
        } else {
            user = new this.model({ id: id, cookies: [{ name, data }] });
        }

        await user.save();
    }

    public async deleteAsync(id: string, name: string): Promise<void> {
        await this.connection.ensureConnected();
        const user = await this.model.findOne({ id: id }).exec();
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
}