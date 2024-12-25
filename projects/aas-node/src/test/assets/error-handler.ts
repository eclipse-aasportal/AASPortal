/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ApplicationError } from 'aas-core';
import { Request, Response } from 'express';
import { ValidateError } from 'tsoa';
import { ERRORS } from '../../app/errors.js';

export const errorHandler = (err: Error, req: Request, res: Response): void => {
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
        }

        res.status(500).json({
            message: 'Internal Server Error',
        });
    } else {
        res.status(500).json({
            message: 'Internal Server Error',
        });
    }
};
