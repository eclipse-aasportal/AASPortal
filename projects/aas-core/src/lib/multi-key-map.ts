/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

export class MultiKeyMap<TKey, TValue> {
    private _keyMap = new Map<TKey, TValue>();
    private _valueMap = new Map<TValue, TKey>();

    public get size(): number {
        return this._keyMap.size;
    }

    public values(): IterableIterator<TValue> {
        return this._valueMap.keys();
    }

    public keys(): IterableIterator<TKey> {
        return this._keyMap.keys();
    }

    public set(key: TKey, value: TValue) {
        if (this._valueMap.has(value)) {
            throw new Error(`The value ${value} already exists.`);
        }

        const oldValue = this._keyMap.get(key);
        if (oldValue) {
            this._valueMap.delete(oldValue);
        }

        this._keyMap.set(key, value);
        this._valueMap.set(value, key);
    }

    public getValue(key: TKey): TValue | undefined {
        return this._keyMap.get(key);
    }

    public getKey(value: TValue): TKey | undefined {
        return this._valueMap.get(value);
    }

    public hasValue(key: TKey): boolean {
        return this._keyMap.has(key);
    }

    public hasKey(value: TValue): boolean {
        return this._valueMap.has(value);
    }

    public deleteValue(key: TKey): boolean {
        const value = this._keyMap.get(key);
        if (value) {
            this._valueMap.delete(value);
        }

        return this._keyMap.delete(key);
    }

    public deleteKey(value: TValue): boolean {
        const key = this._valueMap.get(value);
        if (key) {
            this._keyMap.delete(key);
        }

        return this._valueMap.delete(value);
    }

    public clear(): void {
        this._keyMap.clear();
        this._valueMap.clear();
    }
}
