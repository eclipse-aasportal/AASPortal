/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import { MemoryLogger, MemoryLoggerLevel } from '../app/logging/memory-logger.js';
import { DebugConsole } from '../app/logging/logger.js';
import { createSpyObj } from './utils.js';

describe('MemoryLogger', function () {
    describe('log level Info', function () {
        let logger: MemoryLogger;

        beforeEach(function () {
            logger = new MemoryLogger(MemoryLoggerLevel.Info, createSpyObj<DebugConsole>(['debug']));
        });

        it('should create', function () {
            expect(logger).toBeTruthy();
        });

        it('logs all message types', function () {
            logger.start('test');
            logger.info('This is an info.');
            logger.warning('This is a warning.');
            logger.error('This is an error');
            logger.stop();
            expect(logger.getMessages().length).toEqual(3);
        });

        it('logs message objects', function () {
            logger.start('test');
            logger.log({ type: 'Info', text: 'This is an info.', timestamp: Date.now() });
            logger.log({ type: 'Warning', text: 'This is a warning.', timestamp: Date.now() });
            logger.log({ type: 'Error', text: 'This is an error.', timestamp: Date.now() });
            logger.stop();
            expect(logger.getMessages().length).toEqual(3);
        });

        it('logs only different errors', function () {
            logger.start('test');
            logger.error('This is a first error.');
            logger.error(new Error('This is a first error.'));
            logger.error('This is a seconde error.');
            logger.stop();
            expect(logger.getMessages().length).toEqual(2);
        });

        it('logs only different warnings', function () {
            logger.start('test');
            logger.warning('This is a first warning.');
            logger.warning('This is a first warning.');
            logger.warning('This is a seconde warning.');
            logger.stop();
            expect(logger.getMessages().length).toEqual(2);
        });

        it('logs only different info messages', function () {
            logger.start('test');
            logger.info('This is a first info.');
            logger.info('This is a seconde info.');
            logger.info('This is a seconde info.');
            logger.stop();
            expect(logger.getMessages().length).toEqual(2);
        });
    });

    describe('log level Error', function () {
        let logger: MemoryLogger;

        beforeEach(function () {
            logger = new MemoryLogger(MemoryLoggerLevel.Error, createSpyObj<DebugConsole>(['debug']));
        });

        it('logs ony errors', function () {
            logger.start('test');
            logger.info('This is an info.');
            logger.warning('This is a warning.');
            logger.error('This is an error');
            logger.stop();
            expect(logger.getMessages().length).toEqual(1);
        });
    });

    describe('log level Warning', function () {
        let logger: MemoryLogger;

        beforeEach(function () {
            logger = new MemoryLogger(MemoryLoggerLevel.Warning, createSpyObj<DebugConsole>(['debug']));
        });

        it('logs ony errors and warnings', function () {
            logger.start('test');
            logger.info('This is an info.');
            logger.warning('This is a warning.');
            logger.error('This is an error');
            logger.stop();
            expect(logger.getMessages().length).toEqual(2);
        });
    });

    describe('log debug', function () {
        let logger: MemoryLogger;
        let console: jest.Mocked<DebugConsole>;

        beforeEach(function () {
            console = createSpyObj<DebugConsole>(['debug']);
            logger = new MemoryLogger(MemoryLoggerLevel.All, console);
        });

        it('logs debug messages to a console', function () {
            logger.debug('This is a debug message.');
            expect(console.debug).toHaveBeenCalled();
        });

        it('logs errors to a console', function () {
            logger.debug(new Error('This is a debug message.'));
            expect(console.debug).toHaveBeenCalled();
        });
    });
});
