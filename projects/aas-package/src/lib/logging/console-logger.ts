/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { container, singleton } from 'tsyringe';
import { LOG_LEVEL, Logger, LogLevel } from './logger.js';

/** Provides a logger that writes messages to `stdout` and `stderr`. */
@singleton()
export class ConsoleLogger implements Logger {
    private readonly logLevel = container.isRegistered(LOG_LEVEL) ? container.resolve(LOG_LEVEL) : 'Info';

    public error(error: Error | string): void {
        if (!this.shouldLog('Error')) {
            return;
        }

        const message = typeof error === 'string' ? error : error.stack || error.message || String(error);
        console.error(this.getDateTime() + ' [Error]: ' + message);
    }

    public warning(message: string): void {
        if (!this.shouldLog('Warning')) {
            return;
        }

        console.warn(this.getDateTime() + ' [Warning]: ' + message);
    }

    public info(message: string): void {
        if (!this.shouldLog('Info')) {
            return;
        }

        console.info(this.getDateTime() + ' [Info]: ' + message);
    }

    private shouldLog(level: LogLevel): boolean {
        const order: Record<LogLevel, number> = { Error: 0, Warning: 1, Info: 2 };
        return order[level] <= order[this.logLevel];
    }

    private getDateTime(): string {
        const value = new Date().toISOString().replace('T', ' ');
        return value.substring(0, value.lastIndexOf('.'));
    }
}
