/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ApplicationError, EndpointAuth } from 'aas-core';
import { InjectionToken } from 'tsyringe';
import { ERRORS } from '../errors.js';

/** Injection token. */
export const COOKIE_STORAGE: InjectionToken<CookieStorage> = 'COOKIE_STORAGE';

/** Defines user storage. */
export abstract class CookieStorage {
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
     * Gets the user specific endpoints authentication/authorization.
     * @param userId The user identification.
     * @returns The user specific authentication/authorization or an empty array if it does not exist.
     */
    public async getEndpoints(userId: string): Promise<EndpointAuth[]> {
        const data = await this.getCookieData(userId, 'endpoints');
        return data ? (JSON.parse(data) as EndpointAuth[]) : [];
    }

    /**
     * Sets the user specific endpoints authentication/authorization.
     * @param userId The user identification.
     * @param items The user specific authentication/authorization.
     */
    public async updatesEndpoints(userId: string, items: EndpointAuth[]): Promise<void> {
        const endpoints = await this.getEndpoints(userId);
        for (const item of items) {
            const name = item.name;
            const index = endpoints.findIndex(endpoint => endpoint.name === name);
            if (index >= 0) {
                endpoints[index] = item;
            } else {
                endpoints.push(item);
            }
        }

        await this.setCookieData(userId, 'endpoints', JSON.stringify(endpoints));
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
