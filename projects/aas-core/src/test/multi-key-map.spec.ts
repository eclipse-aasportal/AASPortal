/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { describe, it, expect } from '@jest/globals';
import { MultiKeyMap } from '../lib/multi-key-map.js';

describe('MultiKeyMap', () => {
    let map: MultiKeyMap<number, string>;

    beforeEach(() => {
        map = new MultiKeyMap<number, string>();
        map.set(42, 'Hello World!');
        map.set(123, 'The quick brown fox jumps over the lazy dog.');
    });

    it('should create', () => {
        expect(map).toBeTruthy();
    });

    it('allows adding a new key-value-pair', () => {
        const size = map.size;
        map.set(1, 'A');
        expect(map.hasValue(1)).toBeTruthy();
        expect(map.hasKey('A')).toBeTruthy();
        expect(map.size - size).toEqual(1);
    });

    it('gets a value by key', () => {
        expect(map.getValue(42)).toEqual('Hello World!');
    });

    it('gets a key by value', () => {
        expect(map.getKey('Hello World!')).toEqual(42);
    });

    it('get the number of entries in the map', () => {
        expect(map.size).toEqual(2);
    });

    it('deletes a value by key', () => {
        const size = map.size;
        expect(map.deleteValue(123)).toBeTruthy();
        expect(size - map.size).toEqual(1);
        expect(map.hasValue(123)).toBeFalsy();
        expect(map.hasKey('The quick brown fox jumps over the lazy dog.')).toBeFalsy();
    });

    it('deletes a value by key', () => {
        const size = map.size;
        expect(map.deleteValue(123)).toBeTruthy();
        expect(size - map.size).toEqual(1);
        expect(map.hasValue(123)).toBeFalsy();
        expect(map.hasKey('The quick brown fox jumps over the lazy dog.')).toBeFalsy();
    });

    it('clears a map', () => {
        map.clear();
        expect(map.size).toEqual(0);
    });

    it('indicates whether a value exists for key', () => {
        expect(map.hasValue(42)).toBeTruthy();
        expect(map.hasValue(-1)).toBeFalsy();
    });

    it('indicates whether a key exists for value', () => {
        expect(map.hasKey('Hello World!')).toBeTruthy();
        expect(map.hasKey('unknown')).toBeFalsy();
    });

    it('overwrites an existing key-value-pair', () => {
        map.set(42, 'B');
        expect(map.getValue(42)).toEqual('B');
        expect(map.getKey('B')).toEqual(42);
        expect(map.getKey('Hello World!')).toBeUndefined();
    });

    it('throw an error if a value already exists', () => {
        expect(() => map.set(321, 'Hello World!')).toThrowError();
    });

    it('returns all keys', () => {
        expect([...map.keys()]).toEqual([42, 123]);
    });

    it('returns all values', () => {
        expect([...map.values()]).toEqual(['Hello World!', 'The quick brown fox jumps over the lazy dog.']);
    });
});