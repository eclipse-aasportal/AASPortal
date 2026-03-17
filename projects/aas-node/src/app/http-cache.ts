/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Cache } from 'aas-core';

/**
 * Provides an AAS cache with a 2nd chance strategy.
 */
export class HttpCache extends Cache<string, Response> {
    public constructor(size: number = 100) {
        super(size);
    }

    public get(url: string): Response | undefined {
        return this.getItem(url);
    }

    public set(url: string, response: Response): void {
        this.setItem(url, response);
    }

    public remove(url: string): boolean {
        return this.removeItem(url);
    }
}
