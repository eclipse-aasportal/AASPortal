/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ConsoleLogger } from './console-logger.js';
import { Logger, LogLevel } from './logger.js';

export class LoggerFactory {
    private static instance?: Logger;

    public static getInstance(logLevel: LogLevel, isMainLogger = false): Logger {
        if (!LoggerFactory.instance) {
            LoggerFactory.instance = new ConsoleLogger(logLevel, isMainLogger);
        }

        return LoggerFactory.instance;
    }
}
