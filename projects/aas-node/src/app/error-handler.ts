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
import { ApplicationError } from 'aas-core';
import { AxiosError } from 'axios';

export const errorHandler = (err: unknown, _: Request, res: Response, next: NextFunction) => {
    if (err instanceof ValidateError) {
        res.status(422).json({
            type: ValidateError.name,
            message: err.message,
            name: err.name,
        });
    } else if (err instanceof ApplicationError) {
        res.status(err.statusCode).json({
            type: ApplicationError.name,
            message: err.message,
            name: err.name,
            args: err.args,
        });
    } else if (err instanceof AxiosError) {
        const statusCode = err.status ?? 500;
        const data = err.response?.data;
        res.status(statusCode).json(data ?? { type: err.constructor?.name, message: err.message, name: err.name });
    } else if (err instanceof Error) {
        res.status(500).json({
            type: err.constructor?.name,
            message: err.message,
            name: err.name,
        });
    } else {
        next(err);
    }
};
