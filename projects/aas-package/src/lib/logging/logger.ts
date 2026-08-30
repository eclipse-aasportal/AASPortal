/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { InjectionToken } from 'tsyringe';
import type { Request, Response, NextFunction, RequestHandler } from 'express';

/** Injection token. */
export const LOGGER: InjectionToken<Logger> = Symbol('LOGGER');

export const LOG_LEVEL: InjectionToken<LogLevel> = Symbol('LOG_LEVEL');

/** The logging levels. */
export type LogLevel = 'Error' | 'Warning' | 'Info';

/**
 * Defines a logger interface.
 */
export abstract class Logger {
    protected constructor(public readonly logLevel: LogLevel) {}

    /**
     * Logs an error.
     * @param error The error to log.
     */
    public abstract error(error: Error | string): Promise<void>;

    /**
     * Logs a warning.
     * @param message The message.
     */
    public abstract warning(message: string): Promise<void>;

    /**
     * Logs an information.
     * @param message The message.
     */
    public abstract info(message: string): Promise<void>;
}

/**
 * Express middleware that logs incoming requests and completed responses using the provided logger.
 * - Similar to morgan('dev') output: "METHOD URL STATUS TIME ms - LENGTH"
 * - Error (>=500) => logger.error, Warning (>=400) => logger.warning, Info otherwise.
 */
export function requestLogger(logger: Logger): RequestHandler {
    return function (req: Request, res: Response, next: NextFunction): void {
        const start = process.hrtime.bigint();
        const method = req.method;
        const url = req.originalUrl ?? req.url;

        res.once('finish', () => {
            const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
            const status = res.statusCode;
            const lengthHeader = res.getHeader('content-length');
            const length =
                typeof lengthHeader === 'string'
                    ? lengthHeader
                    : Array.isArray(lengthHeader)
                      ? lengthHeader.join(',')
                      : (lengthHeader?.toString() ?? '-');

            const line = `${method} ${url} ${status} ${durationMs.toFixed(3)} ms - ${length}`;

            if (status >= 500) {
                logger.error(line);
            } else if (status >= 400) {
                logger.warning(line);
            } else {
                logger.info(line);
            }
        });

        next();
    };
}
