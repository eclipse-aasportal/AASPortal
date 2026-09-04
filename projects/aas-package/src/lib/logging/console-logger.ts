/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { container, singleton } from 'tsyringe';
import { Worker } from 'worker_threads';
import { LOG_LEVEL, Logger, LogLevel } from './logger.js';

interface LoggerMessage {
    level: LogLevel;
    message: string;
}

/** Provides a logger that writes messages to `stdout` and `stderr`. */
@singleton()
export class ConsoleLogger extends Logger {
    private worker?: Worker;

    public constructor() {
        super(container.isRegistered(LOG_LEVEL) ? container.resolve(LOG_LEVEL) : 'Info');
    }

    public override error(error: Error | string): Promise<void> {
        if (!this.shouldLog('Error')) {
            return Promise.resolve();
        }

        const message = typeof error === 'string' ? error : error.stack || error.message || String(error);
        return this.postMessage({ level: 'Error', message });
    }

    public override warning(message: string): Promise<void> {
        if (!this.shouldLog('Warning')) {
            return Promise.resolve();
        }

        return this.postMessage({ level: 'Warning', message });
    }

    public override info(message: string): Promise<void> {
        if (!this.shouldLog('Info')) {
            return Promise.resolve();
        }

        return this.postMessage({ level: 'Info', message });
    }

    private shouldLog(level: LogLevel): boolean {
        const order: Record<LogLevel, number> = { Error: 0, Warning: 1, Info: 2 };
        return order[level] <= order[this.logLevel];
    }

    private async postMessage(message: LoggerMessage): Promise<void> {
        if (this.worker) {
            this.worker.postMessage(message);
        } else {
            switch (message.level) {
                case 'Error':
                    console.error(this.getDateTime() + ' [Error]: ' + message.message);
                    break;
                case 'Warning':
                    console.warn(this.getDateTime() + ' [Warning]: ' + message.message);
                    break;
                case 'Info':
                default:
                    console.info(this.getDateTime() + ' [Info]: ' + message.message);
                    break;
            }
        }
    }

    private getDateTime(): string {
        const value = new Date().toISOString().replace('T', ' ');
        return value.substring(0, value.lastIndexOf('.'));
    }
}
