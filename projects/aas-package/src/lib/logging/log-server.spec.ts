/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { PassThrough } from 'node:stream';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    listen: vi.fn<(endpoint: string, callback: () => void) => void>(),
    existsSync: vi.fn(),
    unlinkSync: vi.fn(),
    serverCallback: undefined as ((socket: PassThrough) => void) | undefined,
}));

vi.mock('net', () => ({
    default: {
        createServer: (callback: (socket: PassThrough) => void): { listen: typeof mocks.listen } => {
            mocks.serverCallback = callback;
            return { listen: mocks.listen };
        },
    },
}));

vi.mock('fs', () => ({ existsSync: mocks.existsSync, unlinkSync: mocks.unlinkSync }));
vi.mock('aas-core', () => ({ noop: vi.fn() }));

describe('log server', () => {
    const endpoint = '/tmp/test-log.sock';
    const timestamp = Date.UTC(2024, 0, 2, 3, 4, 5, 678);
    let socket: PassThrough | undefined;

    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
        vi.stubEnv('LOG_ENDPOINT', endpoint);
        mocks.serverCallback = undefined;
        mocks.existsSync.mockReturnValue(false);
        vi.spyOn(console, 'info').mockImplementation(() => undefined);
        vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
        vi.spyOn(Date, 'now').mockReturnValue(timestamp);
    });

    afterEach(() => {
        socket?.destroy();
        socket = undefined;
        vi.restoreAllMocks();
        vi.unstubAllEnvs();
    });

    async function connect(): Promise<PassThrough> {
        await import('./log-server.js');
        if (!mocks.serverCallback) {
            throw new Error('Log server did not register a connection handler.');
        }

        socket = new PassThrough();
        mocks.serverCallback(socket);
        return socket;
    }

    it('requires an endpoint', async () => {
        vi.stubEnv('LOG_ENDPOINT', undefined);
        await expect(import('./log-server.js')).rejects.toThrow('LOG_ENDPOINT should be set');
        expect(mocks.listen).not.toHaveBeenCalled();
    });

    it('removes a stale Unix socket and sends readiness after listening', async () => {
        mocks.existsSync.mockReturnValue(true);
        await import('./log-server.js');

        if (process.platform === 'win32') {
            expect(mocks.unlinkSync).not.toHaveBeenCalled();
        } else {
            expect(mocks.unlinkSync).toHaveBeenCalledWith(endpoint);
        }
        expect(mocks.listen).toHaveBeenCalledOnce();
        expect(mocks.listen.mock.calls[0][0]).toBe(endpoint);

        const send = vi.fn();
        const originalSend = Object.getOwnPropertyDescriptor(process, 'send');
        Object.defineProperty(process, 'send', { configurable: true, writable: true, value: send });
        try {
            mocks.listen.mock.calls[0][1]();
            expect(send).toHaveBeenCalledWith({ type: 'ready', endpoint });
        } finally {
            if (originalSend) {
                Object.defineProperty(process, 'send', originalSend);
            } else {
                Reflect.deleteProperty(process, 'send');
            }
        }
    });

    it('formats complete and fragmented messages at their console severity', async () => {
        const stream = await connect();
        const message = (type: string, text: string): string => JSON.stringify({ type, text, timestamp, pid: 42 });
        const info = message('Info', 'first\nsecond');
        stream.write(info.slice(0, 10));
        expect(console.info).not.toHaveBeenCalled();
        stream.write(info.slice(10) + '\n' + message('Warning', 'warning') + '\n' + message('Error', 'error') + '\n');

        expect(console.info).toHaveBeenCalledWith('2024-01-02 03:04:05 [Info] (pid:42): first\nsecond');
        expect(console.warn).toHaveBeenCalledWith('2024-01-02 03:04:05 [Warning] (pid:42): warning');
        expect(console.error).toHaveBeenCalledWith('2024-01-02 03:04:05 [Error] (pid:42): error');
    });

    it('ignores blank and invalid messages and reports malformed JSON', async () => {
        const stream = await connect();
        stream.write(' \nnull\n' + JSON.stringify({ type: 'Info', text: 'missing fields' }) + '\n');
        expect(console.info).not.toHaveBeenCalled();
        expect(console.warn).not.toHaveBeenCalled();
        expect(console.error).not.toHaveBeenCalled();

        stream.write('{invalid json}\n');
        const output = [...vi.mocked(console.info).mock.calls, ...vi.mocked(console.error).mock.calls];
        expect(output.flat().join('\n')).toContain('invalid JSON');
    });
});
