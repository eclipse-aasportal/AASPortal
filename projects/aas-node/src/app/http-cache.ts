/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Cache } from 'aas-core';
import { singleton } from 'tsyringe';

/**
 * Provides an AAS cache with a 2nd chance strategy.
 */
@singleton()
export class HttpCache extends Cache<string, unknown> {
    public constructor() {
        super(100);
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
