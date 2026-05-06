/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, singleton } from 'tsyringe';
import mongoose from 'mongoose';
import { Cookie } from 'aas-core';

import { Logger, LOGGER, MongoDBConnectionProvider } from 'aas-package';
import { Variable } from '../variable.js';
import { CookieStorage } from './cookie-storage.js';

export interface UserCookies {
    id: string;
    cookies: Array<Cookie>;
}

interface UserCookiesDocument extends UserCookies, mongoose.Document {}

/**
 * A cookie storage implementation that uses MongoDB to store cookies.
 */
@singleton()
export class MongoDBCookieStorage implements CookieStorage {
    private readonly connection: mongoose.Connection;
    private readonly model: mongoose.Model<UserCookiesDocument>;
    private readonly userCookiesSchema = new mongoose.Schema<UserCookiesDocument>({
        id: String,
        cookies: [
            {
                name: String,
                data: String,
            },
        ],
    });

    public constructor(
        @inject(LOGGER) private readonly logger: Logger,
        @inject(MongoDBConnectionProvider) connectionProvider: MongoDBConnectionProvider,
        @inject(Variable) variable: Variable,
    ) {
        if (!variable.COOKIE_STORAGE) {
            throw new Error('COOKIE_STORAGE variable is not set');
        }

        this.connection = connectionProvider.getConnection(variable.COOKIE_STORAGE);
        this.model = this.connection.model<UserCookiesDocument>('UserCookies', this.userCookiesSchema);
        this.logger.info('Using MongoDB cookie storage');
    }

    public async getCookie(userId: string, name: string): Promise<Cookie | undefined> {
        const user = await this.model.findOne({ id: userId }).exec();
        if (user != null) {
            return user.cookies.find(cookie => cookie.name === name);
        }

        return undefined;
    }

    public async setCookie(userId: string, name: string, data: string): Promise<void> {
        let user = await this.model.findOne({ id: userId }).exec();
        if (user) {
            const index = user.cookies.findIndex(cookie => cookie.name === name);
            if (index < 0) {
                user.cookies.push({ name, data });
            } else {
                user.cookies[index].data = data;
            }
        } else {
            user = new this.model({ id: userId, cookies: [{ name, data }] });
        }

        await user.save();
    }

    public async deleteCookie(userId: string, name: string): Promise<void> {
        const user = await this.model.findOne({ id: userId }).exec();
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
