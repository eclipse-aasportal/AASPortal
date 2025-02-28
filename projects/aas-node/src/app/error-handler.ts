/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Request, Response } from 'express';
import { NextFunction } from 'express';
import { ValidateError } from 'tsoa';
import { ApplicationError, noop } from 'aas-core';
import { ERRORS } from './errors.js';

export const errorHandler = (err: unknown, req: Request, res: Response, next: NextFunction) => {
    noop(req);
    if (err instanceof ValidateError) {
        res.status(422).json({
            message: 'Validation Failed',
            details: err?.fields,
        });
    } else if (err instanceof ApplicationError) {
        if (err.name === ERRORS.UnauthorizedAccess) {
            res.status(401).json({
                message: 'Unauthorized',
            });
        } else {
            res.status(500).json({
                message: err.message,
            });
        }
    } else if (err instanceof Error) {
        res.status(500).json({
            message: err.message,
        });
    } else {
        next(err);
    }
};
