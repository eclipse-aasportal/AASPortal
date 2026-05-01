/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Cache } from 'aas-core';

/**
 * Provides an AAS cache with a 2nd chance strategy.
 */
export class HttpCache extends Cache<string, unknown> {
    public constructor(size: number = 100) {
        super(size);
    }

    public get(url: string): unknown | undefined {
        return this.getItem(url);
    }

    public set(url: string, value: unknown): void {
        if (value === undefined) {
            throw new Error('Cannot cache undefined value.');
        }

        this.setItem(url, value);
    }

    public remove(url: string): boolean {
        return this.removeItem(url);
    }
}
