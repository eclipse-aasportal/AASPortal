/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { describe, expect, it } from 'vitest';
import { Cache } from '../lib/cache.js';

class TestCache extends Cache<string, number> {
    public constructor(expiration: number = 1000) {
        super(10, expiration);
    }

    public get(key: string): number | undefined {
        return this.getItem(key);
    }

    public set(key: string, value: number): void {
        this.setItem(key, value);
    }
}

describe('Cache', () => {
    it('should store and retrieve items', () => {
        const cache = new TestCache(1000);
        cache.set('a', 1);
        cache.set('b', 2);
        cache.set('c', 3);

        expect(cache.get('a')).toBe(1);
        expect(cache.get('b')).toBe(2);
        expect(cache.get('c')).toBe(3);
    });

    it('should expire items', async () => {
        const cache = new TestCache(1);
        cache.set('a', 1);
        await new Promise(resolve => setTimeout(resolve, 2));
        expect(cache.get('a')).toBeUndefined();
    });

    it('should evict least recently used items', async () => {
        const cache = new TestCache(1000);
        for (let i = 0; i < 10; i++) {
            await new Promise(resolve => setTimeout(resolve, 1));
            cache.set(`key${i}`, i);
        }

        // Access some items to make them recently used
        cache.get('key0');
        cache.get('key1');

        // Add a new item, which should evict the least recently used item (key2)
        cache.set('key10', 10);

        expect(cache.get('key2')).toBeUndefined();
        expect(cache.get('key0')).toBe(0);
        expect(cache.get('key1')).toBe(1);
    });
});