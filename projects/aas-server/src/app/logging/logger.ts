/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { InjectionToken } from 'tsyringe';

/** Injection token. */
export const LOGGER: InjectionToken<Logger> = 'LOGGER';

/** The logging levels. */
export type LogLevel = 'Error' | 'Warning' | 'Info';

/**
 * Defines a logger interface.
 */
export abstract class Logger {
    protected constructor(public readonly logLevel: LogLevel) {}

    /**
     * Logs an error.
     * @param error
     * @param args Additional arguments.
     */
    public abstract error(error: Error | string, ...args: unknown[]): void;

    /**
     * Logs a warning.
     * @param message The message format.
     * @param args The format items.
     */
    public abstract warning(message: string, ...args: unknown[]): void;

    /**
     * Logs an information.
     * @param message The message format.
     * @param args The format items.
     */
    public abstract info(message: string, ...args: unknown[]): void;
}
