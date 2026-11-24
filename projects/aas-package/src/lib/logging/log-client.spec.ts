/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import EventEmitter from 'node:events';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { LogClient } from './log-client.js';
import { LogLevel, LogMessage } from './logger.js';

const mocks = vi.hoisted(() => ({
    connect: vi.fn(),
    startLogHost: vi.fn(),
}));

vi.mock('net', () => ({
    default: { connect: mocks.connect },
}));

vi.mock('./log-host.js', () => ({
    startLogHost: mocks.startLogHost,
}));

describe('LogClient', () => {
    let socket: EventEmitter & {
        setEncoding: ReturnType<typeof vi.fn>;
        write: Mock<(line: string) => boolean>;
        end: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubEnv('LOG_LEVEL', undefined);
        vi.spyOn(Date, 'now').mockReturnValue(123456);
        socket = Object.assign(new EventEmitter(), {
            setEncoding: vi.fn(),
            write: vi.fn<(line: string) => boolean>(),
            end: vi.fn(),
        });

        mocks.connect.mockReturnValue(socket);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllEnvs();
    });

    function messages(): LogMessage[] {
        return socket.write.mock.calls.map(([line]) => {
            expect(line.endsWith('\n')).toBe(true);
            return JSON.parse(line) as LogMessage;
        });
    }

    it('buffers messages until connected, then sends newline-delimited messages in order', async () => {
        const client = new LogClient('/tmp/log.sock');
        const error = new Error('failed');
        client.info('first\nline');
        client.warning('second');
        client.error(error);
        expect(socket.write).not.toHaveBeenCalled();

        socket.emit('connect');
        await vi.waitFor(() => expect(socket.write).toHaveBeenCalledTimes(3));
        expect(mocks.connect).toHaveBeenCalledWith('/tmp/log.sock');
        expect(mocks.startLogHost).not.toHaveBeenCalled();
        expect(socket.setEncoding).toHaveBeenCalledWith('utf8');
        expect(messages()).toEqual([
            { type: 'Info', text: 'first\nline', timestamp: 123456, pid: process.pid },
            { type: 'Warning', text: 'second', timestamp: 123456, pid: process.pid },
            { type: 'Error', text: error.stack, timestamp: 123456, pid: process.pid },
        ]);

        client.error('after connection');
        expect(messages()[3]).toEqual({
            type: 'Error',
            text: 'after connection',
            timestamp: 123456,
            pid: process.pid,
        });
        client.dispose();
        expect(socket.end).toHaveBeenCalledOnce();
    });

    it.each<{ level: LogLevel; expected: LogLevel[] }>([
        { level: 'Info', expected: ['Info', 'Warning', 'Error'] },
        { level: 'Warning', expected: ['Warning', 'Error'] },
        { level: 'Error', expected: ['Error'] },
    ])('filters messages at $level level and ignores empty messages', async ({ level, expected }) => {
        vi.stubEnv('LOG_LEVEL', level);
        const client = new LogClient('/tmp/log.sock');
        socket.emit('connect');
        await vi.waitFor(() => expect(socket.setEncoding).toHaveBeenCalled());

        client.info('');
        client.warning('');
        client.error('');
        client.info('info');
        client.warning('warning');
        const error = new Error('without stack');
        error.stack = '';
        client.error(error);

        expect(messages().map(message => message.type)).toEqual(expected);
        expect(messages().at(-1)?.text).toBe('without stack');
        client.dispose();
    });

    it('waits for the host to start before connecting and stops it on disposal', async () => {
        const stop = vi.fn().mockResolvedValue(undefined);
        const host = Promise.withResolvers<{ stop: typeof stop }>();
        mocks.startLogHost.mockReturnValue(host.promise);
        const client = new LogClient('/tmp/log.sock', true);
        client.warning('waiting');

        expect(mocks.startLogHost).toHaveBeenCalledWith('/tmp/log.sock');
        expect(mocks.connect).not.toHaveBeenCalled();
        host.resolve({ stop });
        await vi.waitFor(() => expect(mocks.connect).toHaveBeenCalledWith('/tmp/log.sock'));
        socket.emit('connect');
        await vi.waitFor(() => expect(socket.write).toHaveBeenCalledOnce());
        expect(messages()[0]).toMatchObject({ type: 'Warning', text: 'waiting' });

        client.dispose();
        expect(socket.end).toHaveBeenCalledOnce();
        expect(stop).toHaveBeenCalledOnce();
    });
});
