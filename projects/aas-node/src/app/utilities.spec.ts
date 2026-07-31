/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import { createReadStream } from 'fs';
import { fileURLToPath } from 'url';
import { thumbnailToObjectUrl, toUint8Array, urlToString } from './utilities';

describe('utilities', () => {
    describe('urlToString', () => {
        it('should sanitize URL by removing username and password', () => {
            const url = 'https://user:pass@example.com/path?query=1';
            const result = urlToString(url);
            expect(result).toBe('https://example.com/path?query=1');
        });
    });

    describe('toUint8Array', () => {
        it('should convert an object to a Uint8Array', () => {
            const obj = { a: 1, b: 'test' };
            const arr = toUint8Array(obj);
            expect(arr).toBeInstanceOf(Uint8Array);
            expect(Buffer.from(arr).toString()).toBe(JSON.stringify(obj));
        });
    });

    describe('thumbnailToObjectUrl', () => {
        it('should return undefined if readable is undefined', async () => {
            const { thumbnailToObjectUrl } = await import('./utilities');
            const result = await thumbnailToObjectUrl(undefined);
            expect(result).toBeUndefined();
        });

        it('should return a string if readable is provided', async () => {
            const readable = createReadStream(fileURLToPath(new URL('../test/assets/thumbnail.jpg', import.meta.url)));
            const result = await thumbnailToObjectUrl(readable);
            expect(result?.startsWith('data:image/png;base64,')).toBe(true);
        });
    });
});
