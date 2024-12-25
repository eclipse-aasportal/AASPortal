/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import winston from 'winston';
import { FileLogger } from '../app/logging/file-logger.js';
import { createSpyObj } from 'fhg-jest';
import { describe, beforeEach, it, expect, jest } from '@jest/globals';

describe('FileLogger', () => {
    describe('log level Info', () => {
        let logger: FileLogger;
        let winstonLogger: jest.Mocked<winston.Logger>;

        beforeEach(() => {
            winstonLogger = createSpyObj<winston.Logger>([
                'error',
                'warn',
                'info',
                'isErrorEnabled',
                'isInfoEnabled',
                'isWarnEnabled',
            ]);

            winstonLogger.isErrorEnabled.mockReturnValue(true);
            winstonLogger.isWarnEnabled.mockReturnValue(true);
            winstonLogger.isInfoEnabled.mockReturnValue(true);
            logger = new FileLogger(winstonLogger);
        });

        it('logs all message types', () => {
            logger.start('test');
            logger.info('This is an info.');
            logger.warning('This is a warning.');
            logger.error('This is an error');
            logger.stop();
            expect(logger.getMessages().length).toEqual(3);
        });

        it('logs message objects', () => {
            logger.start('test');
            logger.log({ type: 'Info', text: 'This is an info.', timestamp: Date.now() });
            logger.log({ type: 'Warning', text: 'This is a warning.', timestamp: Date.now() });
            logger.log({ type: 'Error', text: 'This is an error.', timestamp: Date.now() });
            logger.stop();
            expect(logger.getMessages().length).toEqual(3);
        });

        it('logs only different errors', () => {
            logger.start('test');
            logger.error('This is a first error.');
            logger.error(new Error('This is a first error.'));
            logger.error('This is a seconde error.');
            logger.stop();
            expect(logger.getMessages().length).toEqual(2);
        });

        it('logs only different warnings', () => {
            logger.start('test');
            logger.warning('This is a first warning.');
            logger.warning('This is a first warning.');
            logger.warning('This is a seconde warning.');
            logger.stop();
            expect(logger.getMessages().length).toEqual(2);
        });

        it('logs only different info messages', () => {
            logger.start('test');
            logger.info('This is a first info.');
            logger.info('This is a seconde info.');
            logger.info('This is a seconde info.');
            logger.stop();
            expect(logger.getMessages().length).toEqual(2);
        });
    });

    describe('log level Error', () => {
        let logger: FileLogger;
        let winstonLogger: jest.Mocked<winston.Logger>;

        beforeEach(() => {
            winstonLogger = createSpyObj<winston.Logger>([
                'error',
                'warn',
                'info',
                'isErrorEnabled',
                'isInfoEnabled',
                'isWarnEnabled',
            ]);
            winstonLogger.isErrorEnabled.mockReturnValue(true);
            winstonLogger.isWarnEnabled.mockReturnValue(false);
            winstonLogger.isInfoEnabled.mockReturnValue(false);
            logger = new FileLogger(winstonLogger);
        });

        it('logs ony errors', () => {
            logger.start('test');
            logger.info('This is an info.');
            logger.warning('This is a warning.');
            logger.error('This is an error');
            logger.stop();
            expect(logger.getMessages().length).toEqual(1);
        });
    });

    describe('log level Warning', () => {
        let logger: FileLogger;
        let winstonLogger: jest.Mocked<winston.Logger>;

        beforeEach(() => {
            winstonLogger = createSpyObj<winston.Logger>([
                'error',
                'warn',
                'info',
                'isErrorEnabled',
                'isInfoEnabled',
                'isWarnEnabled',
            ]);
            winstonLogger.isErrorEnabled.mockReturnValue(true);
            winstonLogger.isWarnEnabled.mockReturnValue(true);
            winstonLogger.isInfoEnabled.mockReturnValue(false);
            logger = new FileLogger(winstonLogger);
        });

        it('logs warnings and errors', () => {
            logger.start('test');
            logger.info('This is an info.');
            logger.warning('This is a warning.');
            logger.error('This is an error');
            logger.stop();
            expect(logger.getMessages().length).toEqual(2);
        });
    });

    describe('log debug', () => {
        let logger: FileLogger;
        let winstonLogger: jest.Mocked<winston.Logger>;

        beforeEach(() => {
            winstonLogger = createSpyObj<winston.Logger>([
                'error',
                'warn',
                'info',
                'debug',
                'isErrorEnabled',
                'isInfoEnabled',
                'isWarnEnabled',
                'isDebugEnabled',
            ]);
            winstonLogger.isErrorEnabled.mockReturnValue(true);
            winstonLogger.isWarnEnabled.mockReturnValue(true);
            winstonLogger.isInfoEnabled.mockReturnValue(true);
            winstonLogger.isDebugEnabled.mockReturnValue(true);
            logger = new FileLogger(winstonLogger);
        });

        it('logs debug messages to a console', () => {
            logger.debug('This is a debug message.');
            expect(winstonLogger.debug).toHaveBeenCalled();
        });

        it('logs errors to a console', () => {
            logger.debug(new Error('This is a debug message.'));
            expect(winstonLogger.debug).toHaveBeenCalled();
        });
    });
});
