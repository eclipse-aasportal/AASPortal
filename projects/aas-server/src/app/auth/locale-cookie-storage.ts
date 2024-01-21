/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, injectable } from 'tsyringe';
import fs from 'fs';
import path from 'path';
import { CookieStorage } from './cookie-storage.js';
import { Cookie } from 'common';
import { Logger } from '../logging/logger.js';

@injectable()
export class LocaleCookieStorage extends CookieStorage {
    private readonly usersDirectory: string;

    public constructor(
        @inject('Logger') private readonly logger: Logger,
        @inject('USERS_DIR') dir: string,
    ) {
        super();

        this.usersDirectory = path.resolve(dir);
    }

    public async checkAsync(id: string, name: string): Promise<boolean> {
        const file = this.getCookiesFile(id);
        if (fs.existsSync(file)) {
            const cookies = await this.readCookies(file);
            return cookies.some(cookie => cookie.name === name);
        }

        return false;
    }

    public async getAsync(id: string, name: string): Promise<Cookie | undefined> {
        const file = this.getCookiesFile(id);
        if (fs.existsSync(file)) {
            const cookies = await this.readCookies(file);
            return cookies.find(cookie => cookie.name === name);
        }

        return undefined;
    }

    public async getAllAsync(id: string): Promise<Cookie[]> {
        const file = this.getCookiesFile(id);
        if (fs.existsSync(file)) {
            const cookies = await this.readCookies(file);
            return cookies;
        }

        return [];
    }

    public async setAsync(id: string, name: string, data: string): Promise<void> {
        const file = this.getCookiesFile(id);
        const cookies = fs.existsSync(file) ? await this.readCookies(file) : [];
        const index = cookies.findIndex(cookie => cookie.name === name);
        if (index < 0) {
            cookies.push({ name, data });
        } else {
            cookies[index].data = data;
        }

        await fs.promises.writeFile(file, JSON.stringify(cookies));
    }

    public async deleteAsync(id: string, name: string): Promise<void> {
        const file = this.getCookiesFile(id);
        const cookies = fs.existsSync(file) ? await this.readCookies(file) : [];
        const index = cookies.findIndex(cookie => cookie.name === name);
        if (index >= 0) {
            cookies.splice(index, 1);
            if (cookies.length > 0) {
                await fs.promises.writeFile(file, JSON.stringify(cookies));
            } else {
                await fs.promises.unlink(file);
            }
        }
    }

    private getCookiesFile(id: string): string {
        return path.join(this.usersDirectory, id, 'cookies.json');
    }

    private async readCookies(path: string): Promise<Cookie[]> {
        try {
            return JSON.parse((await fs.promises.readFile(path)).toString()) as Cookie[];
        } catch (error) {
            this.logger.error(`Reading cookies failed: ${error?.message}`);
            return [];
        }
    }
}
