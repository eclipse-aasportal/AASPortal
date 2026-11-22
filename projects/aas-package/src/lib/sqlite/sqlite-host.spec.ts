/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import EventEmitter from 'node:events';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { startSqliteHost } from './sqlite-host.js';

type TestChild = EventEmitter & {
    kill: ReturnType<typeof vi.fn>;
};

const mocks = vi.hoisted(() => ({
    fork: vi.fn(),
}));

vi.mock('node:child_process', () => ({
    fork: mocks.fork,
}));

describe('startSqliteHost', () => {
    let child: TestChild;

    beforeEach(() => {
        vi.clearAllMocks();
        child = Object.assign(new EventEmitter(), {
            kill: vi.fn((signal: string) => {
                queueMicrotask(() => child.emit('exit', 0));
                return signal === 'SIGTERM';
            }),
        });
        mocks.fork.mockReturnValue(child);
    });

    it('forks the database server with database environment variables', async () => {
        const promise = startSqliteHost('/tmp/test.sqlite', '/tmp/test.sqlite.sock');

        expect(mocks.fork).toHaveBeenCalledTimes(1);
        const modulePath = mocks.fork.mock.calls[0][0] as string;
        expect(modulePath).toMatch(/sqlite-server\.js$/);
        expect(mocks.fork.mock.calls[0][1]).toMatchObject({
            env: expect.objectContaining({
                DB_PATH: '/tmp/test.sqlite',
                DB_ENDPOINT: '/tmp/test.sqlite.sock',
            }),
            stdio: ['ignore', 'inherit', 'inherit', 'ipc'],
        });

        child.emit('message', { type: 'ready', endpoint: '/tmp/test.sqlite.sock' });
        const host = await promise;

        expect(host.endpoint).toBe('/tmp/test.sqlite.sock');
        expect(host.child).toBe(child);
    });

    it('creates a temporary endpoint when no endpoint is provided', async () => {
        const promise = startSqliteHost('/tmp/test.sqlite');
        const options = mocks.fork.mock.calls[0][1] as { env: Record<string, string> };
        const endpoint = options.env.DB_ENDPOINT;

        if (process.platform === 'win32') {
            expect(endpoint).toMatch(/^\\\\\.\\pipe\\sqlite-[a-f0-9]{8}$/);
        } else {
            expect(endpoint).toMatch(/^.+\/sqlite-[a-f0-9]{8}\.sock$/);
        }

        child.emit('message', { type: 'ready', endpoint });
        const host = await promise;

        expect(host.endpoint).toBe(endpoint);
    });

    it('rejects when the child sends an unexpected message', async () => {
        const promise = startSqliteHost('/tmp/test.sqlite', '/tmp/test.sqlite.sock');

        child.emit('message', { type: 'unexpected' });

        await expect(promise).rejects.toThrow('unexpected message');
    });

    it('rejects when the child exits before becoming ready', async () => {
        const promise = startSqliteHost('/tmp/test.sqlite', '/tmp/test.sqlite.sock');

        child.emit('exit', 23);

        await expect(promise).rejects.toThrow('db-server : 23');
    });

    it('stops the child process and resolves after exit', async () => {
        const promise = startSqliteHost('/tmp/test.sqlite', '/tmp/test.sqlite.sock');
        child.emit('message', { type: 'ready', endpoint: '/tmp/test.sqlite.sock' });
        const host = await promise;

        await expect(host.stop()).resolves.toBeUndefined();

        expect(child.kill).toHaveBeenCalledWith('SIGTERM');
    });

    it('returns the child process on a successful start', async () => {
        const promise = startSqliteHost('/tmp/test.sqlite', '/tmp/test.sqlite.sock');
        child.emit('message', { type: 'ready', endpoint: '/tmp/test.sqlite.sock' });

        const host = await promise;

        expect(host.child).toBe(child);
    });
});
