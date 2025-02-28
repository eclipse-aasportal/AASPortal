/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

export class ApplicationError extends Error {
    /**
     * @constructor
     * @param message The error message.
     * @param name The name of the error.
     * @param args Additional arguments for the error message.
     */
    public constructor(message: string, name: string, ...args: unknown[]) {
        super(message);

        this.name = name ?? 'Application error';
        this.args = args ?? [];
    }

    /** Gets the additional arguments. */
    public readonly args: unknown[];
}
