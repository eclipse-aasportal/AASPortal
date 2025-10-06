/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, it, expect } from '@jest/globals';
import { KeyList } from '../app/data/key-list.js';
import { KeyListItem } from '../app/data/database-types.js';

describe('KeyList', () => {
    let recycler: KeyList;

    describe('add', () => {
        it('[2, 55] + 42 => [2, 42, 55] ', () => {
            const recycled: KeyListItem[] = [2, 55];
            recycler = new KeyList(recycled);
            recycler.add(42);
            expect(recycled).toEqual([2, 42, 55]);
        });

        it('[] + 42 => [42]', () => {
            const recycled: KeyListItem[] = [];
            recycler = new KeyList(recycled);
            recycler.add(42);
            expect(recycled).toEqual([42]);
        });

        it('[[2...55]] + 1 => [[1...55]]', () => {
            const recycled: KeyListItem[] = [[2, 55]];
            recycler = new KeyList(recycled);
            recycler.add(1);
            expect(recycled).toEqual([[1, 55]]);
        });

        it('[[2...55]] + 56 => [[1...56]]', () => {
            const recycled: KeyListItem[] = [[2, 55]];
            recycler = new KeyList(recycled);
            recycler.add(56);
            expect(recycled).toEqual([[2, 56]]);
        });

        it('[[2...55], [57...60]] + 56 => [[2...60]]', () => {
            const recycled: KeyListItem[] = [
                [2, 55],
                [57, 60],
            ];

            recycler = new KeyList(recycled);
            recycler.add(56);
            expect(recycled).toEqual([[2, 60]]);
        });

        it('[[2...55], 57] + 56 => [[2...57]]', () => {
            const recycled: KeyListItem[] = [[2, 55], 57];

            recycler = new KeyList(recycled);
            recycler.add(56);
            expect(recycled).toEqual([[2, 57]]);
        });

        it('[55, [57...60]] + 56 => [[55...60]]', () => {
            const recycled: KeyListItem[] = [55, [57, 60]];

            recycler = new KeyList(recycled);
            recycler.add(56);
            expect(recycled).toEqual([[55, 60]]);
        });
    });

    describe('push', () => {
        it('throws an Error if empty', () => {
            recycler = new KeyList([]);
            expect(() => recycler.push()).toThrow();
        });

        it('[42] => []', () => {
            const recycled: KeyListItem[] = [42];
            recycler = new KeyList(recycled);
            expect(recycler.push()).toEqual(42);
            expect(recycled).toEqual([]);
        });

        it('[2, 42, 55] => [2, 42]', () => {
            const recycled: KeyListItem[] = [2, 42, 55];
            recycler = new KeyList(recycled);
            expect(recycler.push()).toEqual(55);
            expect(recycled).toEqual([2, 42]);
        });

        it('[[5...55]] => [[5...54]]', () => {
            const recycled: KeyListItem[] = [[5, 55]];
            recycler = new KeyList(recycled);
            expect(recycler.push()).toEqual(55);
            expect(recycled).toEqual([[5, 54]]);
        });

        it('[[54...55]] => [54]', () => {
            const recycled: KeyListItem[] = [[54, 55]];
            recycler = new KeyList(recycled);
            expect(recycler.push()).toEqual(55);
            expect(recycled).toEqual([54]);
        });
    });

    describe('iterable', () => {
        let keys: KeyList;
        let items: KeyListItem[];

        beforeEach(() => {
            items = [1, 2, [5, 7], 10];
            keys = new KeyList(items);
        });

        it('iterates over all values', () => {
            const values = [...keys];
            expect(values).toEqual([1, 2, 5, 6, 7, 10]);
        });
    });

    describe('remove', () => {
        let keys: KeyList;
        let items: KeyListItem[];

        beforeEach(() => {
            items = [1, 2, [5, 7], 10];
            keys = new KeyList(items);
        });

        it('removes "1" from the list', () => {
            expect(keys.remove(1)).toBeTruthy();
            expect(items).toEqual([2, [5, 7], 10]);
        });

        it('removes "5" from the list', () => {
            expect(keys.remove(5)).toBeTruthy();
            expect(items).toEqual([1, 2, [6, 7], 10]);
        });

        it('removes "6" from the list', () => {
            expect(keys.remove(6)).toBeTruthy();
            expect(items).toEqual([1, 2, 5, 7, 10]);
        });

        it('removes "7" from the list', () => {
            expect(keys.remove(7)).toBeTruthy();
            expect(items).toEqual([1, 2, [5, 6], 10]);
        });

        it('removes "10" from the list', () => {
            expect(keys.remove(10)).toBeTruthy();
            expect(items).toEqual([1, 2, [5, 7]]);
        });

        it('returns false for "42"', () => {
            expect(keys.remove(42)).toBeFalsy();
        });
    });

    describe('at', () => {
        let keys: KeyList;
        let items: KeyListItem[];

        beforeEach(() => {
            items = [1, 2, [5, 7], 10];
            keys = new KeyList(items);
        });

        it('returns 1 for index 0', () => {
            expect(keys.at(0)).toBe(1);
        });

        it('returns 6 for index 3', () => {
            expect(keys.at(3)).toBe(6);
        });

        it('returns undefiend for index 42', () => {
            expect(keys.at(42)).toBeUndefined();
        });
    });
});
