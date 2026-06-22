/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Request, Response } from 'express';
import { NextFunction } from 'express';
import { ValidateError } from 'tsoa';
import { ApplicationError } from 'aas-core';

export const errorHandler = (err: unknown, _: Request, res: Response, next: NextFunction): void => {
    if (err instanceof ValidateError) {
        res.status(err.status).json({
            name: ValidateError.name,
            message: err.message,
            fields: err.fields,
        });
    } else if (err instanceof ApplicationError) {
        res.status(err.statusCode).json(err.toJson());
    } else if (err instanceof Error) {
        res.status(500).json({
            name: err.name,
            message: err.stack ?? err.message,
        });
    } else {
        next(err);
    }
};
