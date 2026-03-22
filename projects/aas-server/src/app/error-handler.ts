/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { NextFunction, Request, Response } from 'express';
import { ApplicationError } from 'aas-core';
import { ValidateError } from 'tsoa';

export const errorHandler = (err: unknown, _: Request, res: Response, next: NextFunction): void => {
    if (err instanceof ValidateError) {
        res.status(422).json({
            type: 'ValidateError',
            message: err.message,
            name: err.name,
        });
    } else if (err instanceof ApplicationError) {
        res.status(err.statusCode).json({
            type: 'ApplicationError',
            name: err.name,
            message: err.message,
            args: err.args,
        });
    } else if (err instanceof Error) {
        res.status(500).json({
            type: 'Error',
            message: err.message,
            name: err.name,
        });
    } else {
        next(err);
    }
};