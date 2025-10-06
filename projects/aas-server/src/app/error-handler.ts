/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { NextFunction, Request, Response } from 'express';
import { ValidateError } from 'tsoa';
import { ApplicationError } from './application-error.js';

export const errorHandler = (err: unknown, _: Request, res: Response, next: NextFunction) => {
    if (err instanceof ValidateError) {
        res.status(422).json({
            message: 'Validation Failed',
            details: err?.fields,
        });
    } else if (err instanceof ApplicationError) {
        res.status(err.statusCode).json({
            name: err.name,
            message: err.message,
        });
    } else if (err instanceof Error) {
        res.status(500).json({
            message: err.message,
        });
    } else {
        next(err);
    }
};
