/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

export type SqlParam = string | number | bigint | boolean | null | Uint8Array;

export type RequestPayload =
    | { type: 'ping' }
    | { type: 'exec'; sql: string }
    | { type: 'run'; sql: string; params?: SqlParam[] }
    | { type: 'all'; sql: string; params?: SqlParam[] }
    | { type: 'get'; sql: string; params?: SqlParam[] }
    | { type: 'begin' | 'commit' | 'rollback' };

export type Request = RequestPayload & { id: number };

export type Response =
    { id: number; ok: true; result: unknown } | { id: number; ok: false; error: { message: string; code?: string } };

const replacer = (_k: string, v: unknown): unknown => (typeof v === 'bigint' ? { $bigint: v.toString() } : v);

const reviver = (_k: string, v: unknown): unknown =>
    v && typeof v === 'object' && '$bigint' in (v as object) ? BigInt((v as { $bigint: string }).$bigint) : v;

export const encode = (v: Request | Response): string => JSON.stringify(v, replacer);

export const decode = <T>(line: string): T => JSON.parse(line, reviver) as T;
