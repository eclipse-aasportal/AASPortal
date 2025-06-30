/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { describe, beforeEach, it, jest, expect } from '@jest/globals';
import { createSpyObj } from 'fhg-jest';
import { ConsoleLogger } from '../app/logging/console-logger.js';

describe('ConsoleLogger', () => {
    let console: jest.Mocked<Console>;

    beforeEach(() => {
        console = createSpyObj<Console>(['error', 'warn', 'info']);
    });

    describe('log level Info', () => {
        let logger: ConsoleLogger;

        beforeEach(() => {
            logger = new ConsoleLogger('Info', console);
        });

        it('logs an info', () => {
            jest.spyOn(console, 'info');
            logger.info('This is an info.');
            expect(console.info).toHaveBeenCalled();
        });

        it('logs a format info', () => {
            jest.spyOn(console, 'info');
            logger.info('This is an {0}.', 'info');
            expect(console.info).toHaveBeenCalled();
        });

        it('does not log an empty info', () => {
            jest.spyOn(console, 'info');
            logger.info('');
            expect(console.info).not.toHaveBeenCalled();
        });

        it('logs a warning', () => {
            jest.spyOn(console, 'warn');
            logger.warning('This is a warning.');
            expect(console.warn).toHaveBeenCalled();
        });

        it('logs an error', () => {
            jest.spyOn(console, 'error');
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
            jest.spyOn(console, 'info');
            logger.info('This is an info.');
            expect(console.info).not.toHaveBeenCalled();
        });

        it('logs a warning', () => {
            jest.spyOn(console, 'warn');
            logger.warning('This is a warning.');
            expect(console.warn).toHaveBeenCalled();
        });

        it('logs a format warning', () => {
            jest.spyOn(console, 'warn');
            logger.warning('This is a {0}.', 'warning');
            expect(console.warn).toHaveBeenCalled();
        });

        it('does not log an empty warning', () => {
            jest.spyOn(console, 'warn');
            logger.info('');
            expect(console.warn).not.toHaveBeenCalled();
        });

        it('logs an error', () => {
            jest.spyOn(console, 'error');
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
            jest.spyOn(console, 'info');
            logger.warning('This is an info.');
            expect(console.info).not.toHaveBeenCalled();
        });

        it('logs a warning', () => {
            jest.spyOn(console, 'warn');
            logger.warning('This is a warning.');
            expect(console.warn).not.toHaveBeenCalled();
        });

        it('logs an error', () => {
            jest.spyOn(console, 'error');
            logger.error('This is an error.');
            expect(console.error).toHaveBeenCalled();
        });

        it('logs a format error', () => {
            jest.spyOn(console, 'error');
            logger.error('This is an {0}.', 'error');
            expect(console.error).toHaveBeenCalled();
        });

        it('does not log an empty error', () => {
            jest.spyOn(console, 'error');
            logger.error('');
            expect(console.error).not.toHaveBeenCalled();
        });

        it('logs an Error', () => {
            jest.spyOn(console, 'error');
            logger.error(new Error('This is an error.'));
            expect(console.error).toHaveBeenCalled();
        });
    });
});
