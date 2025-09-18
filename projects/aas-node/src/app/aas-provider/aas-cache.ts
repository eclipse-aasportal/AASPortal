/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { aas, Cache } from 'aas-core';

/**
 * Provides an AAS cache with a 2nd chance strategy.
 */
export class AASCache extends Cache<string, aas.Environment> {
    public constructor(size: number = 100) {
        super(size);
    }

    public has(endpoint: string, id: string): boolean {
        return this.hasItem(endpoint + '#' + id);
    }

    public get(endpoint: string, id: string): aas.Environment | undefined {
        return this.getItem(endpoint + '#' + id);
    }

    public set(endpoint: string, id: string, env: aas.Environment): void {
        this.setItem(endpoint + '#' + id, env);
    }

    public remove(endpoint: string, id: string): boolean {
        return this.removeItem(endpoint + '#' + id);
    }
}
