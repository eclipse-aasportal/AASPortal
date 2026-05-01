/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { describe, beforeEach, it, expect, Mocked, vitest } from 'vitest';
import { createSpyObj } from './mocks.js';
import { ConsoleLogger } from '../app/logging/console-logger.js';

describe('ConsoleLogger', () => {
    let console: Mocked<Console>;

    beforeEach(() => {
        console = createSpyObj<Console>(['error', 'warn', 'info']);
    });

    describe('log level Info', () => {
        let logger: ConsoleLogger;

        beforeEach(() => {
            logger = new ConsoleLogger('Info', console);
        });

        it('logs an info', () => {
            vitest.spyOn(console, 'info');
            logger.info('This is an info.');
            expect(console.info).toHaveBeenCalled();
        });

        it('logs a format info', () => {
            vitest.spyOn(console, 'info');
            logger.info('This is an {0}.', 'info');
            expect(console.info).toHaveBeenCalled();
        });

        it('does not log an empty info', () => {
            vitest.spyOn(console, 'info');
            logger.info('');
            expect(console.info).not.toHaveBeenCalled();
        });

        it('logs a warning', () => {
            vitest.spyOn(console, 'warn');
            logger.warning('This is a warning.');
            expect(console.warn).toHaveBeenCalled();
        });

        it('logs an error', () => {
            vitest.spyOn(console, 'error');
            logger.error('This is an error.');
            expect(console.error).toHaveBeenCalled();
        });
    });

    describe('log level Warning', () => {
        let logger: ConsoleLogger;

        beforeEach(() => {
            logger = new ConsoleLogger('Warning', console);
        });

        it('logs an info', () => {
            vitest.spyOn(console, 'info');
            logger.info('This is an info.');
            expect(console.info).not.toHaveBeenCalled();
        });

        it('logs a warning', () => {
            vitest.spyOn(console, 'warn');
            logger.warning('This is a warning.');
            expect(console.warn).toHaveBeenCalled();
        });

        it('logs a format warning', () => {
            vitest.spyOn(console, 'warn');
            logger.warning('This is a {0}.', 'warning');
            expect(console.warn).toHaveBeenCalled();
        });

        it('does not log an empty warning', () => {
            vitest.spyOn(console, 'warn');
            logger.info('');
            expect(console.warn).not.toHaveBeenCalled();
        });

        it('logs an error', () => {
            vitest.spyOn(console, 'error');
            logger.error('This is an error.');
            expect(console.error).toHaveBeenCalled();
        });
    });

    describe('log level Error', () => {
        let logger: ConsoleLogger;

        beforeEach(() => {
            logger = new ConsoleLogger('Error', console);
        });

        it('logs an info', () => {
            vitest.spyOn(console, 'info');
            logger.warning('This is an info.');
            expect(console.info).not.toHaveBeenCalled();
        });

        it('logs a warning', () => {
            vitest.spyOn(console, 'warn');
            logger.warning('This is a warning.');
            expect(console.warn).not.toHaveBeenCalled();
        });

        it('logs an error', () => {
            vitest.spyOn(console, 'error');
            logger.error('This is an error.');
            expect(console.error).toHaveBeenCalled();
        });

        it('logs a format error', () => {
            vitest.spyOn(console, 'error');
            logger.error('This is an {0}.', 'error');
            expect(console.error).toHaveBeenCalled();
        });

        it('does not log an empty error', () => {
            vitest.spyOn(console, 'error');
            logger.error('');
            expect(console.error).not.toHaveBeenCalled();
        });

        it('logs an Error', () => {
            vitest.spyOn(console, 'error');
            logger.error(new Error('This is an error.'));
            expect(console.error).toHaveBeenCalled();
        });
    });
});