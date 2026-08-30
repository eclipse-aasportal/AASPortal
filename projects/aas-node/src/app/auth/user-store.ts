/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { InjectionToken } from 'tsyringe';

/** The user data. */
export interface UserData {
    /** The e-mail address. */
    id: string;
    /** The name or alias. */
    name: string;
    /** The password hash. */
    password: string;
    /** The creation date. */
    created: Date;
}

export const USER_STORE: InjectionToken<UserStore> = Symbol('USER_STORE');

export abstract class UserStore {
    /**
     * Reads the data of the user with the specified identification.
     * @param userId The user identification (e-mail).
     * @returns The data of the specified user or `undefined` if such a user does not exist.
     */
    public abstract get(userId: string): Promise<UserData | undefined>;

    /**
     * Writes the data of a new or already registered user with the specified identification.
     * @param userId The user identification.
     * @param data The user data.
     */
    public abstract set(userId: string, data: UserData): Promise<void>;

    /**
     * Deletes the user with the specified identification.
     * @param userId The user identification.
     * @returns `true` if the specified user was successfully deleted; otherwise, `false`.
     */
    public abstract delete(userId: string): Promise<boolean>;
}
