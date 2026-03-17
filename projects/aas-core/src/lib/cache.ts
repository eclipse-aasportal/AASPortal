/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

/**
 * Provides a cache with a remove oldest item strategy.
 */
export abstract class Cache<TKey, TValue> {
    private map = new Map<TKey, [TValue, number]>();

    public constructor(
        private readonly size: number = 100,
        private readonly expiration: number = 60 * 1000,
    ) {}

    public clear(): void {
        this.map.clear();
    }

    protected getItem(key: TKey): TValue | undefined {
        const value = this.map.get(key);
        if (!value) {
            return undefined;
        }

        if (Date.now() - value[1] > this.expiration) {
            this.map.delete(key);
            return undefined;
        }

        value[1] = Date.now();
        return value[0];
    }

    protected setItem(key: TKey, value: TValue): void {
        if (this.map.has(key)) {
            this.map.set(key, [value, Date.now()]);
        } else {
            while (this.map.size >= this.size) {
                let oldestKey: TKey | undefined;
                let min = Number.MAX_SAFE_INTEGER;
                for (const [k, [, t]] of this.map.entries()) {
                    if (min > t) {
                        oldestKey = k;
                        min = t;
                    }
                }

                this.map.delete(oldestKey!);
            }

            this.map.set(key, [value, Date.now()]);
        }
    }

    protected removeItem(key: TKey): boolean {
        return this.map.delete(key);
    }
}

/**
 * Provides a generic cache with a remove oldest item strategy.
 */
export class GenericCache<TKey, TValue> extends Cache<TKey, TValue> {
    public get(key: TKey): TValue | undefined {
        return this.getItem(key);
    }

    public set(key: TKey, value: TValue): void {
        this.setItem(key, value);
    }

    public delete(key: TKey): boolean {
        return this.removeItem(key);
    }
}
