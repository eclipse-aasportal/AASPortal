/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ApplicationError } from 'aas-core';
import { InjectionToken } from 'tsyringe';
import { ERRORS } from '../errors.js';

/** Injection token. */
export const COOKIE_STORE: InjectionToken<CookieStore> = 'COOKIE_STORE';

/** Defines user storage. */
export abstract class CookieStore {
    /**
     * Gets the value of a cookie.
     * @param userId The user identification.
     * @param name The cookie name.
     * @return The cookie value or undefined if the cookie does not exist.
     */
    public async getCookie(userId: string, name: string): Promise<string | undefined> {
        if (name === 'endpoints') {
            throw new ApplicationError(ERRORS.BAD_REQUEST, {}, 400);
        }

        return await this.getCookieData(userId, name);
    }

    /**
     * Sets a new cookie value.
     * @param userId The user identification.
     * @param name The cookie name.
     * @param data The cookie data.
     */
    public async setCookie(userId: string, name: string, data: string): Promise<void> {
        if (name === 'endpoints') {
            throw new ApplicationError(ERRORS.BAD_REQUEST, {}, 400);
        }

        await this.setCookieData(userId, name, data);
    }

    /**
     * Deletes a cookie.
     * @param userId The user identification.
     * @param name The cookie name.
     */
    public abstract deleteCookie(userId: string, name: string): Promise<void>;

    /** Must implement in a concrete cookie storage implementation. */
    protected abstract getCookieData(userId: string, name: string): Promise<string | undefined>;

    /** Must implement in a concrete cookie storage implementation. */
    protected abstract setCookieData(userId: string, name: string, data: string): Promise<void>;
}
