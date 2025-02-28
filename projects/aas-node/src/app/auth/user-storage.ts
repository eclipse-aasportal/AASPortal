/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Cookie } from 'aas-core';
import { UserData } from './user-data.js';

/** Defines user storage. */
export abstract class UserStorage {
    /**
     * Determines, whether a user with the specified identification exists.
     * @param userId The user identification.
     */
    public abstract existAsync(userId: string): Promise<boolean>;

    /**
     * Reads the data of the user with the specified identification.
     * @param userId The user identification (e-mail).
     * @returns The data of the specified user or `undefined` if such a user does not exist.
     */
    public abstract readAsync(userId: string): Promise<UserData | undefined>;

    /**
     * Writes the data of a new or already registered user with the specified identification.
     * @param userId The user identification.
     * @param data The user data.
     */
    public abstract writeAsync(userId: string, data: UserData): Promise<void>;

    /**
     * Deletes the user with the specified identification.
     * @param userId The user identification.
     * @returns `true` if the specified user was successfully deleted; otherwise, `false`.
     */
    public abstract deleteAsync(userId: string): Promise<boolean>;

    /**
     * Determines whether a cookie with the specified name exists.
     * @param userId The user identification.
     * @param name The cookie name.
     */
    public abstract checkCookieAsync(userId: string, name: string): Promise<boolean>;

    /**
     * Gets the value of a cookie.
     * @param userId The user identification.
     * @param name The cookie name.
     */
    public abstract getCookieAsync(userId: string, name: string): Promise<Cookie | undefined>;

    /**
     * Gets all cookies for the user with the specified ID.
     * @param userId The user identification.
     */
    public abstract getCookiesAsync(userId: string): Promise<Cookie[]>;

    /**
     * Sets a new cookie value.
     * @param userId The user identification.
     * @param name The cookie name.
     * @param data
     */
    public abstract setCookieAsync(userId: string, name: string, data: string): Promise<void>;

    /**
     * Deletes a cookie.
     * @param userId The user identification.
     * @param name The cookie name.
     */
    public abstract deleteCookieAsync(userId: string, name: string): Promise<void>;
}
