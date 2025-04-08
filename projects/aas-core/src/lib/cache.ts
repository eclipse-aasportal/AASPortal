/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

/**
 * Provides a cache with a 2nd chance strategy.
 */
export abstract class Cache<TKey, TValue> {
    private first = new Map<TKey, TValue>();
    private second = new Map<TKey, TValue>();

    public constructor(private readonly size: number = 100) {}

    public clear(): void {
        this.first.clear();
        this.second.clear();
    }

    protected hasItem(key: TKey): boolean {
        return this.first.has(key) || this.second.has(key);
    }

    protected getItem(key: TKey): TValue | undefined {
        let value = this.first.get(key);
        if (!value) {
            value = this.second.get(key);
        }

        return value;
    }

    protected setItem(key: TKey, value: TValue): void {
        if (this.first.has(key)) {
            this.first.set(key, value);
        } else if (this.second.has(key)) {
            this.second.set(key, value);
        } else {
            if (this.first.size >= this.size) {
                this.second = this.first;
                this.first = new Map<TKey, TValue>();
            }

            this.first.set(key, value);
        }
    }

    protected removeItem(key: TKey): boolean {
        if (this.first.has(key)) {
            return this.first.delete(key);
        } else if (this.second.has(key)) {
            return this.second.delete(key);
        }

        return false;
    }
}
