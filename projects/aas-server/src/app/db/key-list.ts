/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { DatabaseKey, KeyListItem } from './database-types.js';

/**
 * Maintains a compact, ordered collection of DatabaseKey values using
 * single-key entries or inclusive ranges. The internal representation is an
 * array of KeyListItem where each item is either a single DatabaseKey (number)
 * or a two-element tuple [start, end] representing an inclusive range of keys.
 *
 * The class implements Iterable<DatabaseKey> and yields every key in ascending
 * order, expanding ranges into their constituent keys when iterated.
 *
 * Invariants and behavior:
 * - Items are stored in ascending order with no overlaps.
 * - Adjacent keys or ranges are merged whenever possible (e.g. ... 3, 4 ... => [3,4]).
 * - Single-key ranges are stored as plain numbers rather than one-element tuples
 *   (i.e. [x, x] is normalized to x).
 */
export class KeyList implements Iterable<DatabaseKey> {
    public constructor(private readonly items: KeyListItem[]) {}

    public *[Symbol.iterator](): IterableIterator<DatabaseKey> {
        for (const item of this.items) {
            if (typeof item === 'number') {
                yield item;
            } else {
                for (let i = item[0], n = item[1]; i <= n; i++) {
                    yield i;
                }
            }
        }
    }

    /**
     * Indicates whether the key list contains no items.
     *
     * @returns True if the list has no items; otherwise false.
     */
    public get isEmpty(): boolean {
        return this.items.length === 0;
    }

    /**
     * Removes and returns a database key from the end of the internal items collection.
     * - If the last item is a number, that number is removed from the collection and returned.
     * - If the last item is a two-element tuple [start, current]:
     *   - The current value is returned.
     *   - The current value is decremented in-place.
     *   - If, after decrementing, start and current are equal, the tuple is replaced by the start value (converted to a number) at the end of the collection.
     *
     * @returns The extracted database key.
     * @throws Error if the internal items collection is empty.
     */
    public pop(): DatabaseKey {
        if (this.items.length === 0) {
            throw new Error('KeyList is empty.');
        }

        const item = this.items[this.items.length - 1];
        if (typeof item === 'number') {
            this.items.pop();
            return item;
        }

        const key = item[1];
        --item[1];
        if (item[0] === item[1]) {
            this.items[this.items.length - 1] = item[0];
        }

        return key;
    }

    /**
     * Insert a DatabaseKey into this list while preserving the list's ordering.
     * - If no existing item is found (findIndex returns -1), the key is appended.
     * - If the first existing item is greater than the key (index === 0), the key is prepended.
     * - Otherwise the key is inserted immediately before the first greater item.
     *
     * @param key - The DatabaseKey to insert. It must be comparable with the items
     *              in the list using the > operator.
     * @returns void
     */
    public add(key: DatabaseKey): void {
        const index = this.items.findIndex(item => {
            if (typeof item === 'number') {
                return item > key;
            }

            return item[0] > key;
        });

        if (index < 0) {
            this.append(key);
        } else if (index === 0) {
            this.prepend(key);
        } else {
            this.insert(index, key);
        }
    }

    /**
     * Returns the DatabaseKey at the given zero-based index from this iterable collection, or `undefined` if the index is out of range.
     *
     * @param index - Zero-based index of the element to retrieve.
     * @returns The DatabaseKey located at the specified index, or `undefined` when the index is out of bounds.
     */
    public at(index: number): DatabaseKey | undefined {
        let i = 0;
        for (const value of this) {
            if (i === index) {
                return value;
            }

            ++i;
        }

        return undefined;
    }

    /**
     * Remove a single key from the internal key list.
     *
     * Behavior:
     * - If an item is a single number equal to `key`, that entry is removed.
     * - If an item is an inclusive range that contains `key`:
     *   - If `key` equals the start of the range, the start is incremented (start = key + 1).
     *   - If `key` equals the end of the range, the end is decremented (end = key - 1).
     *   - If `key` is strictly inside the range, the range is split into two ranges:
     *     left = [start, key - 1] and right = [key + 1, end]; the current entry is replaced
     *     with the left part and the right part is inserted immediately after.
     * - Any range that collapses to a single value is stored as a number instead of a tuple.
     *
     * Side effects:
     * - Mutates this.items in place using splice and direct index assignment.
     *
     * Complexity: O(n) in the number of items.
     *
     * @param key - The key to remove from the list.
     * @returns true if the key was found and removed; false if the key was not present.
     */
    public remove(key: DatabaseKey): boolean {
        for (let i = 0, n = this.items.length; i < n; i++) {
            const item = this.items[i];
            if (typeof item === 'number') {
                if (item === key) {
                    this.items.splice(i, 1);
                    return true;
                }
            } else if (item[0] <= key && item[1] >= key) {
                if (item[0] === key) {
                    item[0] = key + 1;
                    this.items[i] = item[0] === item[1] ? item[0] : item;
                    return true;
                }

                if (item[1] === key) {
                    item[1] = key - 1;
                    this.items[i] = item[0] === item[1] ? item[0] : item;
                    return true;
                }

                const left: KeyListItem = [item[0], key - 1];
                this.items[i] = left[0] === left[1] ? left[0] : left;
                const right: KeyListItem = [key + 1, item[1]];
                this.items.splice(i + 1, 0, right[0] === right[1] ? right[0] : right);
                return true;
            }
        }

        return false;
    }

    private insert(index: number, key: DatabaseKey): void {
        const leftItem = this.items[index - 1];
        const leftKey = this.getLastKey(leftItem);
        const rightItem = this.items[index];
        const rightKey = this.getFirstKey(rightItem);
        if (leftKey + 1 === key) {
            if (key + 1 === rightKey) {
                this.items[index - 1] = [this.getFirstKey(leftItem), this.getLastKey(rightItem)];
                this.items.splice(index, 1);
            } else {
                this.items[index - 1] = [this.getFirstKey(leftItem), key];
            }
        } else if (key + 1 === rightKey) {
            this.items[index] = [key, this.getLastKey(rightKey)];
        } else {
            this.items.splice(index, 0, key);
        }
    }

    private prepend(key: DatabaseKey): void {
        const firstItem = this.items[0];
        if (typeof firstItem === 'number') {
            if (key + 1 === firstItem) {
                this.items[0] = [key, firstItem];
                return;
            }
        } else {
            if (key + 1 === firstItem[0]) {
                firstItem[0] = key;
                return;
            }
        }

        this.items.splice(0, 0, key);
    }

    private append(key: DatabaseKey): void {
        if (this.items.length === 0) {
            this.items.push(key);
            return;
        }

        const lastItem = this.items[this.items.length - 1];
        if (typeof lastItem === 'number') {
            if (lastItem + 1 === key) {
                this.items[this.items.length - 1] = [lastItem, key];
                return;
            }
        } else if (lastItem[1] + 1 === key) {
            ++lastItem[1];
            return;
        }

        this.items.push(key);
    }

    private getFirstKey(item: KeyListItem): DatabaseKey {
        return typeof item === 'number' ? item : item[0];
    }

    private getLastKey(item: KeyListItem): DatabaseKey {
        return typeof item === 'number' ? item : item[1];
    }
}
