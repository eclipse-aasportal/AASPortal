/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { describe, it, expect } from '@jest/globals'
import { KeyedList } from '../lib/keyed-list.js';

interface KeyValue {
    key: string;
    value: number;
}

describe('KeyedList', function () {
    let instance: KeyedList<string, KeyValue>;

    beforeEach(function () {
        instance = new KeyedList<string, KeyValue>((value) => value.key, [
            { key: 'a', value: 1 }, { key: 'b', value: 2 }, { key: 'c', value: 3 }
        ]);
    });

    it('should create an instance', function () {
        expect(instance).toBeTruthy();
    });

    it('gets the length', function () {
        expect(instance.length).toEqual(3);
    });

    it('returns the values', function () {
        expect([...instance.values()]).toEqual([
            { key: 'a', value: 1 }, { key: 'b', value: 2 }, { key: 'c', value: 3 }
        ])
    });

    it('returns the keys', function () {
        expect([...instance.keys()].sort()).toEqual(['a', 'b', 'c']);
    });

    it('gets a value by key', function () {
        expect(instance.get('b')).toEqual({ key: 'b', value: 2 });
    });

    it('gets a value by index', function () {
        expect(instance.getValue(2)).toEqual({ key: 'c', value: 3 });
    });

    it('allows adding a new value', function () {
        instance.set({ key: 'd', value: 4 });
        expect(instance.has('d')).toBeTruthy();
    });

    it('allows replace an existing value', function () {
        instance.set({ key: 'c', value: 42 });
        expect(instance.get('c')).toEqual({ key: 'c', value: 42 });
        expect(instance.length).toEqual(3);
    });

    it('indicates whether a key exist in the list', function () {
        expect(instance.has('x')).toBeFalsy();
    });

    it('allows deleting a value', function () {
        expect(instance.delete('a')).toBeTruthy();
    });

    it('indicates that deleting a non existing value fails', function () {
        expect(instance.delete('y')).toBeFalsy();
    });

    it('clears the list', function () {
        instance.clear();
        expect(instance.length).toEqual(0);
    });
});