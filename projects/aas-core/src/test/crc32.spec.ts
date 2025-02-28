/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { describe, it, expect } from '@jest/globals';
import { Crc32 } from '../lib/crc32.js';

describe('Crc32', () => {
    let crc: Crc32;

    beforeEach(() => {
        crc = new Crc32();
    });

    it('should created', () => {
        expect(crc).toBeTruthy();
    });

    describe('computeString', () => {
        it('computes the crc32 from a string', () => {
            expect(crc.computeString('The quick brown fox jumps over the lazy dog.')).toEqual(1368401385);
        });
    });

    describe('computeBuffer', () => {
        it('computes the crc32 from a buffer', () => {
            const buffer = Buffer.from('The quick brown fox jumps over the lazy dog.');
            expect(crc.computeBuffer(toArrayBuffer(buffer))).toEqual(1368401385);
        });
    });

    describe('start/add/end', () => {
        it('computes the crc from a sequence of strings', () => {
            crc.start();
            crc.add('The ');
            crc.add('quick ');
            crc.add('brown ');
            crc.add('fox ');
            crc.add('jumps ');
            crc.add('over ');
            crc.add('the ');
            crc.add('lazy ');
            crc.add('dog.');
            const value = crc.end();
            expect(value).toEqual(1368401385);
        });
    });

    function toArrayBuffer(buffer: Buffer): ArrayBuffer {
        const arrayBuffer = new ArrayBuffer(buffer.length);
        const view = new Uint8Array(arrayBuffer);
        for (let i = 0; i < buffer.length; ++i) {
            view[i] = buffer[i];
        }

        return arrayBuffer;
    }
});