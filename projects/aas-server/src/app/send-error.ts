/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Response, Request } from 'express';
import { ErrorData, ApplicationError } from 'aas-core';
import { ERRORS } from './errors.js';
import { Logger } from './logging/logger.js';

export function sendError(
    logger: Logger,
    res: Response,
    req: Request,
    error: unknown,
    errorId?: string,
    ...args: unknown[]
) {
    let errorData: ErrorData;
    const method = `${req.method}: ${req.path}`;
    if (error instanceof ApplicationError) {
        errorData = createError(method, 'ApplicationError', error.name, error.message, error.args);
    } else if (error instanceof Error) {
        if (errorId) {
            errorData = createError(method, 'Error', errorId, error.message, args ?? []);
        } else {
            errorData = createError(method, 'Error', ERRORS.Uncaught, error.message, [error.message]);
        }
    } else {
        const message = typeof error === 'string' ? error : typeof error;
        if (errorId) {
            errorData = createError(method, typeof error, errorId, message, args ?? []);
        } else {
            errorData = createError(method, typeof error, ERRORS.Uncaught, message, [message]);
        }
    }

    res.status(500).json(errorData);
    logger.error(`${method} failed: ${errorData.message}`);

    function createError(method: string, type: string, name: string, message: string, args: unknown[]): ErrorData {
        return {
            method: method,
            type: type,
            name: name,
            message: message,
            args: args ?? [],
        };
    }
}
