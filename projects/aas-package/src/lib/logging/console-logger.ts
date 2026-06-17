/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { convertToString } from 'aas-core';
import { Logger, LogLevel } from './logger.js';

/** Provides a logger that writes messages to `stdout` and `stderr`. */
export class ConsoleLogger extends Logger {
    public constructor(
        logLevel: LogLevel,
        private readonly _console: Console = console,
    ) {
        super(logLevel);
    }

    public override error(error: Error | string): void {
        if (!error) {
            return;
        }

        let message = '';
        if (typeof error === 'string') {
            message = error;
        } else if (error instanceof Error) {
            message = error.message;
        } else {
            message = convertToString(error);
        }

        new Promise<void>(resolve => {
            this._console.error(`${this.getDateTime()} [Error]: ${message}`);
            resolve();
        });
    }

    public override warning(message: string): void {
        if (this.logLevel === 'Error') {
            return;
        }

        if (!message) {
            return;
        }

        new Promise<void>(resolve => {
            this._console.warn(`${this.getDateTime()} [Warning]: ${message}`);
            resolve();
        });
    }

    public override info(message: string): void {
        if (this.logLevel !== 'Info') {
            return;
        }

        if (!message) {
            return;
        }

        new Promise<void>(resolve => {
            this._console.info(`${this.getDateTime()} [Info]: ${message}`);
            resolve();
        });
    }

    private getDateTime(): string {
        const value = new Date().toISOString().replace('T', ' ');
        return value.substring(0, value.lastIndexOf('.'));
    }
}
