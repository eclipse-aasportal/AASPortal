/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

export class KeyedList<TKey, TValue> {
    private readonly map = new Map<TKey, TValue>();
    private readonly list: TValue[] = [];

    public constructor(
        private readonly getKey: (value: TValue) => TKey,
        values?: TValue[],
    ) {
        if (values) {
            values.forEach(value => this.set(value));
        }
    }

    public get length(): number {
        return this.list.length;
    }

    public *values(): Generator<TValue> {
        for (const value of this.list) {
            yield value;
        }
    }

    public keys(): IterableIterator<TKey> {
        return this.map.keys();
    }

    public getValue(index: number): TValue {
        return this.list[index];
    }

    public has(key: TKey): boolean {
        return this.map.has(key);
    }

    public get(key: TKey): TValue | undefined {
        return this.map.get(key);
    }

    public set(value: TValue): void {
        const key = this.getKey(value);
        if (this.map.has(key)) {
            this.list[this.list.findIndex(item => this.getKey(item) === key)] = value;
        } else {
            this.list.push(value);
        }

        this.map.set(key, value);
    }

    public delete(key: TKey): boolean {
        const index = this.list.findIndex(item => this.getKey(item) === key);
        if (index >= 0) {
            this.list.splice(index, 1);
            this.map.delete(key);
            return true;
        }

        return false;
    }

    public clear(): void {
        this.list.splice(0, this.list.length);
        this.map.clear();
    }
}
