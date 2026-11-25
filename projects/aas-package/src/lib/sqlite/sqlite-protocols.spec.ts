/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { describe, expect, it } from 'vitest';
import { decode, encode, type Request, type Response } from './sqlite-protocols.js';

describe('SQLite protocols', () => {
    it('encodes and decodes a ping request', () => {
        const request: Request = { id: 7, type: 'ping' };

        expect(decode<Request>(encode(request))).toEqual(request);
    });

    it('encodes and decodes parameterized requests', () => {
        const request: Request = {
            id: 8,
            type: 'run',
            sql: 'INSERT INTO item (id, name, active) VALUES (?, ?, ?)',
            params: [42, 'sample', true, null],
        };

        expect(decode<Request>(encode(request))).toEqual(request);
    });

    it('preserves bigint values in nested request and response data', () => {
        const request: Request = {
            id: 9,
            type: 'run',
            sql: 'INSERT INTO item (id) VALUES (?)',
            params: [9007199254740993n],
        };
        const response: Response = {
            id: 9,
            ok: true,
            result: { changes: 1, lastInsertRowid: 9007199254740993n },
        };

        expect(decode<Request>(encode(request))).toEqual(request);
        const decoded = decode<Response>(encode(response));
        expect(decoded).toEqual(response);
    });

    it('preserves successful and failed response structures', () => {
        const success: Response = { id: 10, ok: true, result: [{ id: 1 }] };
        const failure: Response = {
            id: 11,
            ok: false,
            error: { message: 'constraint failed', code: 'SQLITE_CONSTRAINT' },
        };

        expect(decode<Response>(encode(success))).toEqual(success);
        expect(decode<Response>(encode(failure))).toEqual(failure);
    });

    it('throws for malformed JSON', () => {
        expect(() => decode<Request>('{"id":')).toThrow();
        expect(() => decode<Response>('not-json')).toThrow();
    });
});
