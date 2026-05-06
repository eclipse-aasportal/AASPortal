/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, singleton } from 'tsyringe';
import { join } from 'path/posix';
import { resolve } from 'path';
import fs from 'fs';
import { Cookie } from 'aas-core';
import { LOGGER, Logger } from 'aas-package';
import { slash } from '../utilities.js';
import { CookieStorage } from './cookie-storage.js';
import { Variable } from '../variable.js';
import { fileURLToPath } from 'url';

/**
 * A cookie storage implementation that uses the local file system to store cookies.
 */
@singleton()
export class LocalCookieStorage implements CookieStorage {
    private readonly cookiesDirectory: string;

    public constructor(
        @inject(LOGGER) private readonly logger: Logger,
        @inject(Variable) variable: Variable,
    ) {
        this.cookiesDirectory = slash(
            resolve(
                variable.COOKIE_STORAGE
                    ? new URL(variable.COOKIE_STORAGE).pathname
                    : fileURLToPath(new URL('./users', import.meta.url)),
            ),
        );

        if (!fs.existsSync(this.cookiesDirectory)) {
            fs.mkdirSync(this.cookiesDirectory);
        }

        logger.info(`Using local cookie storage with directory ${this.cookiesDirectory}`);
    }

    public async getCookie(userId: string, name: string): Promise<Cookie | undefined> {
        const file = this.getCookiesFile(userId);
        if (fs.existsSync(file)) {
            const cookies = await this.readCookies(file);
            return cookies.find(cookie => cookie.name === name);
        }

        return undefined;
    }

    public async setCookie(userId: string, name: string, data: string): Promise<void> {
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

    public async deleteCookie(userId: string, name: string): Promise<void> {
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
        return join(this.cookiesDirectory, userId, 'cookies.json');
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
