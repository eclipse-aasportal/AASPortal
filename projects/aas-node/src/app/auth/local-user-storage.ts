/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, injectable } from 'tsyringe';
import { join } from 'path/posix';
import { resolve } from 'path';
import fs from 'fs';
import { Cookie } from 'aas-core';
import { UserStorage } from './user-storage.js';
import { UserData } from './user-data.js';
import { Logger } from '../logging/logger.js';
import { slash } from '../convert.js';

@injectable()
export class LocalUserStorage extends UserStorage {
    private readonly usersDirectory: string;

    public constructor(
        @inject('Logger') private readonly logger: Logger,
        @inject('USERS_DIR') usersDirectory: string,
    ) {
        super();

        this.usersDirectory = slash(resolve(usersDirectory));

        if (!fs.existsSync(this.usersDirectory)) {
            fs.mkdirSync(this.usersDirectory);
        }
    }

    public existAsync(userId: string): Promise<boolean> {
        return new Promise<boolean>(resolve => resolve(fs.existsSync(this.getUserDir(userId))));
    }

    public async readAsync(userId: string): Promise<UserData | undefined> {
        const userFile = this.getUserFile(userId);
        return fs.existsSync(userFile) ? await this.readUserData(userFile) : undefined;
    }

    public async writeAsync(userId: string, data: UserData): Promise<void> {
        const dir = this.getUserDir(userId);
        if (!fs.existsSync(dir)) {
            await fs.promises.mkdir(dir);
        }

        await fs.promises.writeFile(this.getUserFile(userId), JSON.stringify(data));
    }

    public async deleteAsync(userId: string): Promise<boolean> {
        const dir = this.getUserDir(userId);
        if (fs.existsSync(dir)) {
            await fs.promises.rm(dir, { recursive: true });
            return true;
        }

        return false;
    }

    public async checkCookieAsync(userId: string, name: string): Promise<boolean> {
        const file = this.getCookiesFile(userId);
        if (fs.existsSync(file)) {
            const cookies = await this.readCookies(file);
            return cookies.some(cookie => cookie.name === name);
        }

        return false;
    }

    public async getCookieAsync(userId: string, name: string): Promise<Cookie | undefined> {
        const file = this.getCookiesFile(userId);
        if (fs.existsSync(file)) {
            const cookies = await this.readCookies(file);
            return cookies.find(cookie => cookie.name === name);
        }

        return undefined;
    }

    public async getCookiesAsync(userId: string): Promise<Cookie[]> {
        const file = this.getCookiesFile(userId);
        if (fs.existsSync(file)) {
            const cookies = await this.readCookies(file);
            return cookies;
        }

        return [];
    }

    public async setCookieAsync(userId: string, name: string, data: string): Promise<void> {
        const file = this.getCookiesFile(userId);
        const cookies = fs.existsSync(file) ? await this.readCookies(file) : [];
        const index = cookies.findIndex(cookie => cookie.name === name);
        if (index < 0) {
            cookies.push({ name, data });
        } else {
            cookies[index].data = data;
        }

        await fs.promises.writeFile(file, JSON.stringify(cookies));
    }

    public async deleteCookieAsync(userId: string, name: string): Promise<void> {
        const file = this.getCookiesFile(userId);
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

    private getCookiesFile(userId: string): string {
        return join(this.usersDirectory, userId, 'cookies.json');
    }

    private async readCookies(path: string): Promise<Cookie[]> {
        try {
            return JSON.parse((await fs.promises.readFile(path)).toString()) as Cookie[];
        } catch (error) {
            this.logger.error(`Reading cookies failed: ${error?.message}`);
            return [];
        }
    }

    private async readUserData(path: string): Promise<UserData> {
        const data = JSON.parse((await fs.promises.readFile(path)).toString()) as UserData;
        data.created = new Date(data.created);
        data.lastLoggedIn = new Date(data.lastLoggedIn);
        return data as UserData;
    }

    private getUserFile(userId: string): string {
        return join(this.usersDirectory, userId, 'user.json');
    }

    private getUserDir(userId: string): string {
        return join(this.usersDirectory, userId);
    }
}
