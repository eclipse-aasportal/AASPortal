/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import EventEmitter from 'node:events';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { startLogHost } from './log-host.js';

const mocks = vi.hoisted(() => ({ fork: vi.fn() }));
vi.mock('node:child_process', () => ({ fork: mocks.fork }));

describe('startLogHost', () => {
    let child: EventEmitter & { kill: ReturnType<typeof vi.fn> };

    beforeEach(() => {
        vi.clearAllMocks();
        child = Object.assign(new EventEmitter(), { kill: vi.fn() });
        mocks.fork.mockReturnValue(child);
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('forks the log server and waits for readiness', async () => {
        vi.stubEnv('LOG_LEVEL', 'Warning');
        const startup = startLogHost('/tmp/test-log.sock');
        let ready = false;
        void startup.then(() => {
            ready = true;
        });

        expect(mocks.fork).toHaveBeenCalledOnce();
        expect(path.basename(mocks.fork.mock.calls[0][0] as string)).toBe('log-server.js');
        expect(mocks.fork.mock.calls[0][1]).toMatchObject({
            env: expect.objectContaining({ LOG_ENDPOINT: '/tmp/test-log.sock', LOG_LEVEL: 'Warning' }),
            stdio: ['ignore', 'inherit', 'inherit', 'ipc'],
        });
        await Promise.resolve();
        expect(ready).toBe(false);

        child.emit('message', { type: 'ready' });
        const host = await startup;
        expect(host.endpoint).toBe('/tmp/test-log.sock');
        expect(host.child).toBe(child);
    });

    it('rejects an unexpected startup message', async () => {
        const startup = startLogHost('/tmp/test-log.sock');
        child.emit('message', { type: 'unexpected' });
        await expect(startup).rejects.toThrow('unexpected message');
    });

    it.each([23, null])('rejects if the child exits before readiness with code %s', async code => {
        const startup = startLogHost('/tmp/test-log.sock');
        child.emit('exit', code);
        await expect(startup).rejects.toThrow(`log-server : ${code}`);
    });

    it('sends SIGTERM and waits for the child to exit when stopped', async () => {
        const startup = startLogHost('/tmp/test-log.sock');
        child.emit('message', { type: 'ready' });
        const host = await startup;
        let stopped = false;
        const stopping = host.stop().then(() => {
            stopped = true;
        });

        expect(child.kill).toHaveBeenCalledExactlyOnceWith('SIGTERM');
        await Promise.resolve();
        expect(stopped).toBe(false);
        child.emit('exit', 0);
        await expect(stopping).resolves.toBeUndefined();
        expect(stopped).toBe(true);
    });
});
