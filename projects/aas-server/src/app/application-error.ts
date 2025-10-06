/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

export class ApplicationError extends Error {
    /**
     * @param message The error message.
     * @param name The name of the error.
     * @param statusCode (Optional) The corresponding status code.
     */
    public constructor(
        message: string,
        name: string,
        public readonly statusCode = 500,
    ) {
        super(message);

        this.name = name;
    }
}
