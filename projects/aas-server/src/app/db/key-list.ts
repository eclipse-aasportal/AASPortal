/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { DatabaseKey, KeyListItem } from './database-types.js';

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

    public get isEmpty(): boolean {
        return this.items.length === 0;
    }

    public push(): DatabaseKey {
        if (this.items.length === 0) {
            throw new Error('Invalid operation');
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
