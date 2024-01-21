/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Cookie } from 'common';

export abstract class CookieStorage {
    /**
     * @param id The user identification.
     * @param name The cookie name.
     */
    public abstract checkAsync(id: string, name: string): Promise<boolean>;

    /**
     * @param id The user identification.
     * @param name The cookie name.
     */
    public abstract getAsync(id: string, name: string): Promise<Cookie | undefined>;

    /**
     * @param id The user identification.
     */
    public abstract getAllAsync(id: string): Promise<Cookie[]>;

    /**
     * @param id The user identification.
     * @param name The cookie name.
     * @param data
     */
    public abstract setAsync(id: string, name: string, data: string): Promise<void>;

    /**
     * @param id The user identification.
     * @param name The cookie name.
     */
    public abstract deleteAsync(id: string, name: string): Promise<void>;
}
