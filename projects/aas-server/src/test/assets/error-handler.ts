/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ApplicationError } from "common";
import { NextFunction, Request, Response } from "express";
import { ValidateError } from "tsoa";
import { ERRORS } from "../../app/errors.js";

export const errorHandler = (err: unknown, req: Request, res: Response, next: NextFunction): Response | void => {
    if (err instanceof ValidateError) {
        return res.status(422).json({
            message: "Validation Failed",
            details: err?.fields,
        });
    }

    if (err instanceof ApplicationError) {
        if (err.name === ERRORS.UnauthorizedAccess) {
            return res.status(401).json({ 
                message: 'Unauthorized' 
            });
        }

        return res.status(500).json({
            message: "Internal Server Error",
        });
    }

    if (err instanceof Error) {
        return res.status(500).json({
            message: "Internal Server Error",
        });
    }

    next();
};