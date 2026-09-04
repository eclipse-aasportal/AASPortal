/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ApplicationError, ErrorData } from 'aas-core';
import { Request, Response } from 'express';
import { ValidateError } from 'tsoa';

export const errorHandler = (err: Error, req: Request, res: Response): void => {
    if (err instanceof ValidateError) {
        res.status(err.status).json({
            name: err.name,
            message: 'Validation Failed',
            stack: err.stack,
            status: err.status,
            args: err?.fields,
        } satisfies ErrorData);
    } else if (err instanceof ApplicationError) {
        res.status(err.statusCode).json(err.toJson());
    } else {
        res.status(500).json({
            message: err.message,
            name: err.name,
            stack: err.stack,
            status: 500
        } satisfies ErrorData);
    }
};
