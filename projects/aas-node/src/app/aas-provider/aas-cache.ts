/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { aas } from 'aas-core';

/**
 * Provides an AAS cache with a 2nd chance strategy.
 */
export class AASCache {
    private first = new Map<string, aas.Environment>();
    private second = new Map<string, aas.Environment>();

    public constructor(private readonly size: number = 100) {}

    public has(endpointName: string, id: string): boolean {
        const key = endpointName + '#' + id;
        return this.first.has(key) || this.second.has(key);
    }

    public get(endpointName: string, id: string): aas.Environment | undefined {
        const key = endpointName + '#' + id;
        let env = this.first.get(key);
        if (!env) {
            env = this.second.get(key);
        }

        return env;
    }

    public set(endpointName: string, id: string, env: aas.Environment): void {
        const key = endpointName + '#' + id;
        if (this.first.has(key)) {
            this.first.set(key, env);
        } else if (this.second.has(key)) {
            this.second.set(key, env);
        } else {
            if (this.first.size >= this.size) {
                this.second = this.first;
                this.first = new Map<string, aas.Environment>();
            }

            this.first.set(key, env);
        }
    }

    public remove(endpointName: string, id: string): void {
        const key = endpointName + '#' + id;
        if (this.first.has(key)) {
            this.first.delete(key);
        } else if (this.second.has(key)) {
            this.second.delete(key);
        }
    }

    public clear(): void {
        this.first.clear();
        this.second.clear();
    }
}
