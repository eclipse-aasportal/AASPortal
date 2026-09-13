/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { container } from 'tsyringe';
import { describe, beforeEach, it, expect, vi, afterEach, Mocked } from 'vitest';
import { NextFunction, Request, Response } from 'express';
import EventEmitter from 'events';
import { createSpyObj } from '../../test/mocks.js';
import { PinoLogger } from './pino-logger.js';
import { LOG_LEVEL, Logger, requestLogger } from './logger.js';

const pinoLogger = vi.hoisted(() => ({
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
}));

const isoTimeMock = vi.hoisted(() => vi.fn());
const pinoMock = vi.hoisted(() => vi.fn(() => pinoLogger));

vi.mock('pino', () => ({
    default: Object.assign(pinoMock, {
        stdTimeFunctions: { isoTime: isoTimeMock },
    }),
}));

describe('PinoLogger', () => {
    let logger: PinoLogger;

    beforeEach(() => {
        pinoMock.mockClear();
        isoTimeMock.mockClear();
        pinoLogger.error.mockClear();
        pinoLogger.warn.mockClear();
        pinoLogger.info.mockClear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.resetModules();
        vi.clearAllMocks();
    });

    describe('info', () => {
        beforeEach(() => {
            container.clearInstances();
            container.registerInstance(LOG_LEVEL, 'Info');
            container.registerSingleton(PinoLogger);
            logger = container.resolve(PinoLogger);
        });

        it('writes each log level through pino', () => {
            logger.info('i-msg');
            logger.warning('w-msg');
            logger.error('e-msg');

            expect(pinoMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    level: 'info',
                    timestamp: isoTimeMock,
                    transport: {
                        target: 'pino/file',
                        options: { destination: 1 },
                    },
                    formatters: expect.objectContaining({
                        level: expect.any(Function),
                        bindings: expect.any(Function),
                    }),
                }),
            );
            expect(pinoLogger.info).toHaveBeenCalledWith('i-msg');
            expect(pinoLogger.warn).toHaveBeenCalledWith('w-msg');
            expect(pinoLogger.error).toHaveBeenCalledWith('e-msg');
        });
    });

    describe('warning', () => {
        beforeEach(() => {
            container.clearInstances();
            container.registerInstance(LOG_LEVEL, 'Warning');
            container.registerSingleton(PinoLogger);
            logger = container.resolve(PinoLogger);
        });

        it('initializes pino at the warning level and forwards messages', () => {
            logger.info('skip-info');
            logger.warning('ok-warning');
            logger.error('ok-error');

            expect(pinoMock).toHaveBeenCalledWith(expect.objectContaining({ level: 'warn' }));
            expect(pinoLogger.info).toHaveBeenCalledWith('skip-info');
            expect(pinoLogger.warn).toHaveBeenCalledWith('ok-warning');
            expect(pinoLogger.error).toHaveBeenCalledWith('ok-error');
        });
    });

    describe('error', () => {
        beforeEach(() => {
            container.clearInstances();
            container.registerInstance(LOG_LEVEL, 'Error');
            container.registerSingleton(PinoLogger);
            logger = container.resolve(PinoLogger);
        });

        it('initializes pino at the error level and forwards messages', () => {
            logger.info('skip-info');
            logger.warning('skip-warning');
            logger.error('ok-error');

            expect(pinoMock).toHaveBeenCalledWith(expect.objectContaining({ level: 'error' }));
            expect(pinoLogger.info).toHaveBeenCalledWith('skip-info');
            expect(pinoLogger.warn).toHaveBeenCalledWith('skip-warning');
            expect(pinoLogger.error).toHaveBeenCalledWith('ok-error');
        });
    });
});

describe('requestLogger', () => {
    let logger: Mocked<Logger>;

    beforeEach(() => {
        logger = createSpyObj<Logger>(['error', 'warning', 'info']);
    });

    it('should provide a handler', () => {
        expect(requestLogger(logger)).toBeTypeOf('function');
    });

    it('should log a GET message with status 200', () => {
        const handler = requestLogger(logger);
        const req = createSpyObj<Request>([], { method: 'GET', originalUrl: '/foo' });

        class TestResponse extends EventEmitter {
            public statusCode = 200;
            public getHeader: (name: string) => number | string | string[] | undefined = vi.fn().mockReturnValue('42');
        }

        const res = new TestResponse();
        const next: NextFunction = vi.fn();
        handler(req, res as unknown as Response, next);
        expect(next).toHaveBeenCalled();

        res.emit('finish');

        expect(logger.info).toHaveBeenCalledTimes(1);
        expect(logger.warning).not.toHaveBeenCalled();
        expect(logger.error).not.toHaveBeenCalled();
        expect(logger.info).toHaveBeenCalledWith(expect.stringMatching(/^GET \/foo 200 \d+\.\d{3} ms - 42$/));
    });

    it('should log a GET message with status 404', () => {
        const handler = requestLogger(logger);
        const req = createSpyObj<Request>([], { method: 'GET', originalUrl: '/foo' });

        class TestResponse extends EventEmitter {
            public statusCode = 404;
            public getHeader: (name: string) => number | string | string[] | undefined = vi.fn().mockReturnValue('42');
        }

        const res = new TestResponse();
        const next: NextFunction = vi.fn();
        handler(req, res as unknown as Response, next);
        expect(next).toHaveBeenCalled();

        res.emit('finish');

        expect(logger.warning).toHaveBeenCalledTimes(1);
        expect(logger.info).not.toHaveBeenCalled();
        expect(logger.error).not.toHaveBeenCalled();
        expect(logger.warning).toHaveBeenCalledWith(expect.stringMatching(/^GET \/foo 404 \d+\.\d{3} ms - 42$/));
    });

    it('should log a GET message with status 500', () => {
        const handler = requestLogger(logger);
        const req = createSpyObj<Request>([], { method: 'GET', originalUrl: '/foo' });

        class TestResponse extends EventEmitter {
            public statusCode = 500;
            public getHeader: (name: string) => number | string | string[] | undefined = vi.fn().mockReturnValue('42');
        }

        const res = new TestResponse();
        const next: NextFunction = vi.fn();
        handler(req, res as unknown as Response, next);
        expect(next).toHaveBeenCalled();

        res.emit('finish');

        expect(logger.error).toHaveBeenCalledTimes(1);
        expect(logger.info).not.toHaveBeenCalled();
        expect(logger.warning).not.toHaveBeenCalled();
        expect(logger.error).toHaveBeenCalledWith(expect.stringMatching(/^GET \/foo 500 \d+\.\d{3} ms - 42$/));
    });
});
