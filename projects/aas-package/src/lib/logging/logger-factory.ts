/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { container, singleton } from 'tsyringe';
import { ConsoleLogger } from './console-logger.js';
import { Logger } from './logger.js';

@singleton()
export class LoggerFactory {
    private static instance?: Logger;

    public getInstance(): Logger {
        if (!LoggerFactory.instance) {
            LoggerFactory.instance = container.resolve(ConsoleLogger);
        }

        return LoggerFactory.instance;
    }
}
