/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { describe, it, expect } from '@jest/globals';
import { KeyedList } from '../lib/keyed-list.js';

interface KeyValue {
    key: string;
    value: number;
}

describe('KeyedList', () => {
    let instance: KeyedList<string, KeyValue>;

    beforeEach(() => {
        instance = new KeyedList<string, KeyValue>(
            value => value.key,
            [
                { key: 'a', value: 1 },
                { key: 'b', value: 2 },
                { key: 'c', value: 3 },
            ],
        );
    });

    it('should create an instance', () => {
        expect(instance).toBeTruthy();
    });

    it('gets the length', () => {
        expect(instance.length).toEqual(3);
    });

    it('returns the values', () => {
        expect([...instance.values()]).toEqual([
            { key: 'a', value: 1 },
            { key: 'b', value: 2 },
            { key: 'c', value: 3 },
        ]);
    });

    it('returns the keys', () => {
        expect([...instance.keys()].sort()).toEqual(['a', 'b', 'c']);
    });

    it('gets a value by key', () => {
        expect(instance.get('b')).toEqual({ key: 'b', value: 2 });
    });

    it('gets a value by index', () => {
        expect(instance.getValue(2)).toEqual({ key: 'c', value: 3 });
    });

    it('allows adding a new value', () => {
        instance.set({ key: 'd', value: 4 });
        expect(instance.has('d')).toBeTruthy();
    });

    it('allows replace an existing value', () => {
        instance.set({ key: 'c', value: 42 });
        expect(instance.get('c')).toEqual({ key: 'c', value: 42 });
        expect(instance.length).toEqual(3);
    });

    it('indicates whether a key exist in the list', () => {
        expect(instance.has('x')).toBeFalsy();
    });

    it('allows deleting a value', () => {
        expect(instance.delete('a')).toBeTruthy();
    });

    it('indicates that deleting a non existing value fails', () => {
        expect(instance.delete('y')).toBeFalsy();
    });

    it('clears the list', () => {
        instance.clear();
        expect(instance.length).toEqual(0);
    });
});