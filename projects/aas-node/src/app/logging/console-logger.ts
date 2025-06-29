/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { stringFormat } from 'aas-core';
import { Logger } from './logger.js';

export class ConsoleLogger extends Logger {
    public constructor(logLevel: string) {
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
        }

        console.error(message);
    }

    public override warning(message: string, ...args: unknown[]): void {
        if (this.logLevel === 'Error') {
            return;
        }

        if (!message) {
            return;
        }

        console.warn(args.length > 0 ? stringFormat(message, ...args) : message);
    }

    public override info(message: string, ...args: unknown[]): void {
        if (this.logLevel !== 'Info') {
            return;
        }

        if (!message) {
            return;
        }

        console.info(args.length > 0 ? stringFormat(message, ...args) : message);
    }
}
