/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Cookie } from 'aas-core';
import { InjectionToken } from 'tsyringe';

/** Injection token. */
export const COOKIE_STORAGE: InjectionToken<CookieStorage> = 'COOKIE_STORAGE';

/** Defines user storage. */
export interface CookieStorage {
    /**
     * Gets the value of a cookie.
     * @param userId The user identification.
     * @param name The cookie name.
     */
    getCookie(userId: string, name: string): Promise<Cookie | undefined>;

    /**
     * Sets a new cookie value.
     * @param userId The user identification.
     * @param name The cookie name.
     * @param data
     */
    setCookie(userId: string, name: string, data: string): Promise<void>;

    /**
     * Deletes a cookie.
     * @param userId The user identification.
     * @param name The cookie name.
     */
    deleteCookie(userId: string, name: string): Promise<void>;
}
