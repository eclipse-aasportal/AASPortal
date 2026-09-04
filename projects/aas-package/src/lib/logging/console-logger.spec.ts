/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { describe, beforeEach, it, expect, vi, afterEach, Mocked } from 'vitest';
import { NextFunction, Request, Response } from 'express';
import EventEmitter from 'events';
import { createSpyObj } from '../../test/mocks.js';
import { ConsoleLogger } from './console-logger.js';
import { LOG_LEVEL, Logger, requestLogger } from './logger.js';
import { container } from 'tsyringe';

describe('ConsoleLogger', () => {
    let logger: ConsoleLogger;

    beforeEach(async () => {
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
        vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        vi.spyOn(console, 'info').mockImplementation(() => undefined);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.resetModules();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.resetModules();
    });

    describe('info', () => {
        beforeEach(() => {
            container.clearInstances();
            container.registerInstance(LOG_LEVEL, 'Info');
            container.registerSingleton(ConsoleLogger);
            logger = container.resolve(ConsoleLogger);
        });

        it('falls back to console.* when worker cannot be started', async () => {
            const infoSpy = vi.spyOn(console, 'info');
            const warnSpy = vi.spyOn(console, 'warn');
            const errorSpy = vi.spyOn(console, 'error');

            infoSpy.mockClear();
            warnSpy.mockClear();
            errorSpy.mockClear();

            await logger.info('i-msg');
            expect(infoSpy).toHaveBeenCalledTimes(1);

            await logger.warning('w-msg');
            expect(warnSpy).toHaveBeenCalledTimes(1);

            await logger.error('e-msg');
            expect(errorSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe('warning', () => {
        beforeEach(() => {
            container.clearInstances();
            container.registerInstance(LOG_LEVEL, 'Warning');
            container.registerSingleton(ConsoleLogger);
            logger = container.resolve(ConsoleLogger);
        });

        it('respects log level gating in fallback mode', async () => {
            const infoSpy = vi.spyOn(console, 'info');
            const warnSpy = vi.spyOn(console, 'warn');
            const errorSpy = vi.spyOn(console, 'error');

            infoSpy.mockClear();
            warnSpy.mockClear();
            errorSpy.mockClear();

            await logger.info('skip-info');
            expect(infoSpy).not.toHaveBeenCalled();

            await logger.warning('ok-warning');
            expect(warnSpy).toHaveBeenCalledTimes(1);

            await logger.error('ok-error');
            expect(errorSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe('error', () => {
        beforeEach(() => {
            container.clearInstances();
            container.registerInstance(LOG_LEVEL, 'Error');
            container.registerSingleton(ConsoleLogger);
            logger = container.resolve(ConsoleLogger);
        });

        it('respects log level gating in fallback mode', async () => {
            const infoSpy = vi.spyOn(console, 'info');
            const warnSpy = vi.spyOn(console, 'warn');
            const errorSpy = vi.spyOn(console, 'error');

            infoSpy.mockClear();
            warnSpy.mockClear();
            errorSpy.mockClear();

            await logger.info('skip-info');
            expect(infoSpy).not.toHaveBeenCalled();

            await logger.warning('ok-warning');
            expect(warnSpy).not.toHaveBeenCalled();

            await logger.error('ok-error');
            expect(errorSpy).toHaveBeenCalledTimes(1);
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
