/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { convertToString, stringFormat } from 'aas-core';
import { Logger, LogLevel } from './logger.js';

/** Provides a logger that writes messages to `stdout` and `stderr`. */
export class ConsoleLogger extends Logger {
    public constructor(
        logLevel: LogLevel,
        private readonly _console: Console = console,
    ) {
        super(logLevel);
    }

    public override error(error: Error | string, ...args: unknown[]): void {
        if (!error) {
            return;
        }

        let message = '';
        if (typeof error === 'string') {
            message = args.length > 0 ? stringFormat(error, ...args) : error;
        } else if (error instanceof Error) {
            message = error.message;
        } else {
            message = convertToString(error);
        }

        this._console.error(`${this.getDateTime()} [Error]: ${message}`);
    }

    public override warning(message: string, ...args: unknown[]): void {
        if (this.logLevel === 'Error') {
            return;
        }

        if (!message) {
            return;
        }

        this._console.warn(
            `${this.getDateTime()} [Warning]: ${args.length > 0 ? stringFormat(message, ...args) : message}`,
        );
    }

    public override info(message: string, ...args: unknown[]): void {
        if (this.logLevel !== 'Info') {
            return;
        }

        if (!message) {
            return;
        }

        this._console.info(
            `${this.getDateTime()} [Info]: ${args.length > 0 ? stringFormat(message, ...args) : message}`,
        );
    }

    private getDateTime(): string {
        const value = new Date().toISOString().replace('T', ' ');
        return value.substring(0, value.lastIndexOf('.'));
    }
}
