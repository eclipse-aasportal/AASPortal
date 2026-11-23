/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import EventEmitter from 'node:events';
import type { Interface } from 'node:readline';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { decode, encode, RequestPayload, type Request, type Response } from './sqlite-protocols.js';

type Statement = {
    run: ReturnType<typeof vi.fn>;
    all: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
};

type TestSocket = EventEmitter & {
    setEncoding: ReturnType<typeof vi.fn>;
    write: ReturnType<typeof vi.fn>;
};

const mocks = vi.hoisted(() => ({
    dbExec: vi.fn(),
    dbPrepare: vi.fn(),
    listen: vi.fn(),
    existsSync: vi.fn(),
    unlinkSync: vi.fn(),
    serverCallback: undefined as ((socket: TestSocket) => void) | undefined,
}));

vi.mock('node:sqlite', () => ({
    DatabaseSync: class {
        public exec = mocks.dbExec;
        public prepare = mocks.dbPrepare;
    },
}));

vi.mock('node:fs', () => ({
    existsSync: mocks.existsSync,
    unlinkSync: mocks.unlinkSync,
}));

vi.mock('node:net', () => ({
    default: {
        createServer: vi.fn((callback: (socket: TestSocket) => void) => {
            mocks.serverCallback = callback;
            return { listen: mocks.listen };
        }),
    },
}));

vi.mock('node:readline', () => ({
    default: {
        createInterface: vi.fn(() => new EventEmitter()),
    },
}));

vi.mock('aas-core', () => ({
    noop: vi.fn(),
}));

describe('SQLite server', () => {
    let socket: TestSocket;
    let lineListener: EventEmitter;
    let statement: Statement;

    beforeAll(async () => {
        process.env.DB_PATH = ':memory:';
        process.env.DB_ENDPOINT = '/tmp/aas-package-sqlite-server.spec.sock';
        await import('./sqlite-server.js');
    });

    beforeEach(async () => {
        mocks.existsSync.mockReturnValue(false);

        statement = {
            run: vi.fn().mockReturnValue({ changes: 1n, lastInsertRowid: 42n }),
            all: vi.fn().mockReturnValue([{ id: 1, active: 1 }]),
            get: vi.fn().mockReturnValue({ id: 1, active: 1 }),
        };
        mocks.dbPrepare.mockReturnValue(statement);

        socket = Object.assign(new EventEmitter(), {
            setEncoding: vi.fn(),
            write: vi.fn(),
        });
        lineListener = new EventEmitter();

        vi.mocked((await import('node:readline')).default.createInterface).mockImplementationOnce(
            () => lineListener as unknown as Interface,
        );

        mocks.serverCallback?.(socket);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    function send(payload: RequestPayload & { id?: number }): Response {
        const request: Request = { ...payload, id: payload.id ?? 1 } as Request;
        lineListener.emit('line', encode(request));
        const line = vi.mocked(socket.write).mock.calls.at(-1)?.[0];
        expect(line).toBeTypeOf('string');
        return decode<Response>(String(line).trim());
    }

    it('initializes SQLite pragmas and reports ready', () => {
        expect(mocks.dbExec).toHaveBeenCalledWith('PRAGMA journal_mode = WAL');
        expect(mocks.dbExec).toHaveBeenCalledWith('PRAGMA busy_timeout = 5000');
        expect(mocks.dbExec).toHaveBeenCalledWith('PRAGMA foreign_keys = ON');
        expect(mocks.listen).toHaveBeenCalled();
    });

    it('answers ping requests', () => {
        expect(send({ type: 'ping' })).toEqual({ id: 1, ok: true, result: 'pong' });
    });

    it('executes SQL, clears the statement cache, and returns null', () => {
        expect(send({ type: 'exec', sql: 'CREATE TABLE item (id INTEGER)' })).toEqual({
            id: 1,
            ok: true,
            result: null,
        });
        expect(mocks.dbExec).toHaveBeenCalledWith('CREATE TABLE item (id INTEGER)');
    });

    it('runs parameterized SQL and normalizes bigint and boolean values', () => {
        const response = send({
            type: 'run',
            sql: 'INSERT INTO item(id, active) VALUES (?, ?)',
            params: [42n, true, false],
        });

        expect(response).toEqual({
            id: 1,
            ok: true,
            result: { changes: 1, lastInsertRowid: '42' },
        });
        expect(statement.run).toHaveBeenCalledWith(42n, 1, 0);
    });

    it('returns all and get query results', () => {
        expect(send({ type: 'all', sql: 'SELECT * FROM item', params: [1] })).toEqual({
            id: 1,
            ok: true,
            result: [{ id: 1, active: 1 }],
        });
        expect(statement.all).toHaveBeenCalledWith(1);

        expect(send({ type: 'get', sql: 'SELECT * FROM item WHERE id = ?', params: [1] })).toEqual({
            id: 1,
            ok: true,
            result: { id: 1, active: 1 },
        });
        expect(statement.get).toHaveBeenCalledWith(1);
    });

    it('returns null when get finds no row', () => {
        statement.get.mockReturnValue(undefined);

        expect(send({ type: 'get', sql: 'SELECT * FROM missing-item WHERE id = ?', params: [99] })).toEqual({
            id: 1,
            ok: true,
            result: null,
        });
    });

    it('supports nested savepoints and commits', () => {
        expect(send({ type: 'begin' }).ok).toBe(true);
        expect(mocks.dbExec).toHaveBeenCalledWith('BEGIN IMMEDIATE');

        expect(send({ type: 'begin' }).ok).toBe(true);
        expect(mocks.dbExec).toHaveBeenCalledWith('SAVEPOINT sp_1');

        expect(send({ type: 'commit' }).ok).toBe(true);
        expect(mocks.dbExec).toHaveBeenCalledWith('RELEASE sp_1');

        expect(send({ type: 'commit' }).ok).toBe(true);
        expect(mocks.dbExec).toHaveBeenCalledWith('COMMIT');
    });

    it('supports nested rollbacks', () => {
        send({ type: 'begin' });
        send({ type: 'begin' });

        expect(send({ type: 'rollback' })).toEqual({ id: 1, ok: true, result: null });
        expect(mocks.dbExec).toHaveBeenCalledWith('ROLLBACK TO sp_1');
        expect(mocks.dbExec).toHaveBeenCalledWith('RELEASE sp_1');
    });

    it('rejects commit and rollback outside a transaction', () => {
        expect(send({ type: 'commit' })).toEqual({
            id: 1,
            ok: false,
            error: { message: 'No active transaction context' },
        });
        expect(send({ type: 'rollback' })).toEqual({
            id: 1,
            ok: false,
            error: { message: 'No active transaction context' },
        });
    });

    it('reports invalid JSON and SQL errors', () => {
        lineListener.emit('line', '{');
        expect(decode<Response>(String(vi.mocked(socket.write).mock.calls.at(-1)?.[0]).trim())).toEqual({
            id: -1,
            ok: false,
            error: { message: 'invalid JSON' },
        });

        statement.all.mockImplementation(() => {
            throw Object.assign(new Error('bad SQL'), { code: 'SQLITE_ERROR' });
        });

        expect(send({ type: 'all', sql: 'not sql' })).toEqual({
            id: 1,
            ok: false,
            error: { message: 'bad SQL', code: 'SQLITE_ERROR' },
        });
    });

    it('rolls back an open transaction when the socket closes', () => {
        send({ type: 'begin' });
        socket.emit('close');

        expect(mocks.dbExec).toHaveBeenCalledWith('ROLLBACK');
    });
});
