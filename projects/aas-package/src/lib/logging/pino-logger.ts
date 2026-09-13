/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { container, singleton } from 'tsyringe';
import pino from 'pino';
import { LOG_LEVEL, Logger } from './logger.js';

/** Provides a logger that writes messages to `stdout` and `stderr`. */
@singleton()
export class PinoLogger implements Logger {
    private readonly logLevel = container.isRegistered(LOG_LEVEL) ? container.resolve(LOG_LEVEL) : 'Info';
    private readonly logger: pino.Logger;

    public constructor() {
        let level: pino.Level;
        switch (this.logLevel) {
            case 'Error':
                level = 'error';
                break;
            case 'Warning':
                level = 'warn';
                break;
            default:
                level = 'info';
                break;
        }

        this.logger = pino({
            level,
            timestamp: pino.stdTimeFunctions.isoTime,
            transport: {
                target: 'pino/file',
                options: { destination: 1 },
            },
            formatters: {
                level: (label: string) => ({ level: label }),
                bindings: (bindings: Record<string, unknown>) => ({ pid: bindings.pid }),
            },
        });
    }

    public error(error: Error | string): void {
        this.logger.error(error);
    }

    public warning(message: string): void {
        this.logger.warn(message);
    }

    public info(message: string): void {
        this.logger.info(message);
    }
}
