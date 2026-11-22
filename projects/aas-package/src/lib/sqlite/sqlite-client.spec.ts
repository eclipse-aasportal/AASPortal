/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import EventEmitter from 'node:events';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SqliteClient } from './sqlite-client.js';
import { decode, encode, type Request, type Response } from './sqlite-protocols.js';

type TestSocket = EventEmitter & {
    setEncoding: ReturnType<typeof vi.fn>;
    write: ReturnType<typeof vi.fn>;
    end: ReturnType<typeof vi.fn>;
    destroy: ReturnType<typeof vi.fn>;
};

const mocks = vi.hoisted(() => ({
    connect: vi.fn(),
    lineListener: undefined as ((line: string) => void) | undefined,
    socket: undefined as TestSocket | undefined,
    responseFor: undefined as ((request: Request) => Response) | undefined,
}));

vi.mock('node:net', () => ({
    default: {
        connect: (...args: unknown[]): unknown => mocks.connect(...args),
    },
}));

vi.mock('node:readline', () => ({
    default: {
        createInterface: vi.fn(() => ({
            on: vi.fn((event: string, listener: (line: string) => void) => {
                if (event === 'line') {
                    mocks.lineListener = listener;
                }
            }),
        })),
    },
}));

describe('SqliteClient', () => {
    function createSocket(): TestSocket {
        const socket = Object.assign(new EventEmitter(), {
            setEncoding: vi.fn(),
            write: vi.fn(),
            end: vi.fn(),
            destroy: vi.fn(),
        });

        socket.write.mockImplementation((line: string) => {
            const request = decode<Request>(line.trim());
            const response = mocks.responseFor?.(request) ?? {
                id: request.id,
                ok: true,
                result: null,
            };

            queueMicrotask(() => mocks.lineListener?.(encode(response)));
            return true;
        });

        return socket;
    }

    beforeEach(() => {
        vi.clearAllMocks();
        mocks.lineListener = undefined;

        mocks.responseFor = (request: Request): Response => {
            switch (request.type) {
                case 'ping':
                    return { id: request.id, ok: true, result: 'pong' };
                case 'run':
                    return { id: request.id, ok: true, result: { changes: 1, lastInsertRowid: '42' } };
                case 'all':
                    return { id: request.id, ok: true, result: [{ id: 1 }] };
                case 'get':
                    return { id: request.id, ok: true, result: { id: 1 } };
                default:
                    return { id: request.id, ok: true, result: null };
            }
        };

        mocks.connect.mockImplementation(() => {
            const socket = createSocket();
            mocks.socket = socket;
            queueMicrotask(() => socket.emit('connect'));
            return socket;
        });
    });

    async function connect(): Promise<{ client: SqliteClient; socket: TestSocket }> {
        const client = await SqliteClient.connect('/tmp/test.sqlite.sock');
        expect(mocks.socket).toBeDefined();
        return { client, socket: mocks.socket as TestSocket };
    }

    it('connects and configures the socket', async () => {
        const { client, socket } = await connect();

        expect(client).toBeInstanceOf(SqliteClient);
        expect(socket.setEncoding).toHaveBeenCalledWith('utf8');
    });

    it('sends ping and exec requests', async () => {
        const { client } = await connect();

        await expect(client.ping()).resolves.toBe('pong');
        await expect(client.exec('CREATE TABLE item (id INTEGER)')).resolves.toBeNull();
    });

    it('sends run parameters and preserves bigint values', async () => {
        const { client, socket } = await connect();
        mocks.responseFor = (request: Request): Response => ({
            id: request.id,
            ok: true,
            result: { changes: 1, lastInsertRowid: '9007199254740993' },
        });

        await expect(client.run('INSERT INTO item VALUES (?)', [9007199254740993n])).resolves.toEqual({
            changes: 1,
            lastInsertRowid: '9007199254740993',
        });

        const line = socket.write.mock.calls[0][0] as string;
        expect(decode<Request>(line.trim())).toMatchObject({
            type: 'run',
            sql: 'INSERT INTO item VALUES (?)',
            params: [9007199254740993n],
        });
    });

    it('returns all and get query results', async () => {
        const { client } = await connect();

        await expect(client.all<{ id: number }>('SELECT * FROM item')).resolves.toEqual([{ id: 1 }]);
        await expect(client.get<{ id: number }>('SELECT * FROM item WHERE id = ?', [1])).resolves.toEqual({ id: 1 });
    });

    it('returns null from get when no row exists', async () => {
        const { client } = await connect();
        mocks.responseFor = (request: Request): Response => ({ id: request.id, ok: true, result: null });

        await expect(client.get('SELECT * FROM item WHERE id = ?', [99])).resolves.toBeNull();
    });

    it('rejects server errors and preserves their SQLite code', async () => {
        const { client } = await connect();
        mocks.responseFor = (request: Request): Response => ({
            id: request.id,
            ok: false,
            error: { message: 'constraint failed', code: 'SQLITE_CONSTRAINT' },
        });

        await expect(client.run('INSERT INTO item VALUES (?)', [1])).rejects.toMatchObject({
            message: 'constraint failed',
            code: 'SQLITE_CONSTRAINT',
        });
    });

    it('queues requests until the preceding request completes', async () => {
        const { client, socket } = await connect();

        const ping = client.ping();
        const exec = client.exec('CREATE TABLE item (id INTEGER)');

        await expect(ping).resolves.toBe('pong');
        await expect(exec).resolves.toBeNull();
        expect(socket.write).toHaveBeenCalledTimes(2);
    });

    it('runs a transaction and commits after the callback succeeds', async () => {
        const { client, socket } = await connect();

        await expect(
            client.transaction(async c => {
                await c.run('INSERT INTO item VALUES (?)', [1]);
                return 'created';
            }),
        ).resolves.toBe('created');

        const requests = socket.write.mock.calls.map(call => decode<Request>((call[0] as string).trim()));
        expect(requests.map(request => request.type)).toEqual(['begin', 'run', 'commit']);
    });

    it('rolls back a transaction and rethrows callback errors', async () => {
        const { client, socket } = await connect();
        const error = new Error('callback failed');

        await expect(
            client.transaction(async () => {
                throw error;
            }),
        ).rejects.toBe(error);

        const requests = socket.write.mock.calls.map(call => decode<Request>((call[0] as string).trim()));
        expect(requests.map(request => request.type)).toEqual(['begin', 'rollback']);
    });

    it('rejects pending requests when the socket closes', async () => {
        const { client, socket } = await connect();
        socket.write.mockImplementation(() => true);
        const ping = client.ping();
        await vi.waitFor(() => expect(socket.write).toHaveBeenCalledTimes(1));
        socket.emit('close');

        await expect(ping).rejects.toThrow('DB connection closed');
    });

    it('ends the socket when close is called', async () => {
        const { client, socket } = await connect();

        client.close();

        expect(socket.end).toHaveBeenCalledTimes(1);
    });

    it('rejects a connection attempt without retries', async () => {
        mocks.connect.mockImplementation(() => {
            const socket = createSocket();
            queueMicrotask(() => socket.emit('error', new Error('connection refused')));
            return socket;
        });

        await expect(SqliteClient.connect('/tmp/missing.sock', 0)).rejects.toThrow('connection refused');
    });
});
