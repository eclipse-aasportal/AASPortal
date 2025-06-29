/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

/** Injection token. */
export const LOGGER = 'LOGGER';

/**
 * Defines a logger interface.
 */
export abstract class Logger {
    protected constructor(public readonly logLevel: string) {}

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
