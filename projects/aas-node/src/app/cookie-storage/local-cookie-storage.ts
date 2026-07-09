/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, singleton } from 'tsyringe';
import { join } from 'path/posix';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { Cookie } from 'aas-core';
import { LOGGER, Logger } from 'aas-package';
import { slash } from '../utilities.js';
import { CookieStorage } from './cookie-storage.js';
import { Variable } from '../variable.js';

/**
 * A cookie storage implementation that uses the local file system to store cookies.
 */
@singleton()
export class LocalCookieStorage extends CookieStorage {
    private readonly cookiesDirectory: string;

    public constructor(
        @inject(LOGGER) private readonly logger: Logger,
        @inject(Variable) variable: Variable,
    ) {
        super();

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

    public override async deleteCookie(userId: string, name: string): Promise<void> {
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

    protected override async getCookieData(userId: string, name: string): Promise<string | undefined> {
        const file = this.getCookiesFile(userId);
        if (fs.existsSync(file)) {
            const cookies = await this.readCookies(file);
            const cookie = cookies.find(cookie => cookie.name === name);
            if (!cookie) {
                return undefined;
            }

            return cookie.data;
        }

        return undefined;
    }

    protected override async setCookieData(userId: string, name: string, data: string): Promise<void> {
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
