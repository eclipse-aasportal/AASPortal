/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import type express from 'express';
import { container, inject, singleton } from 'tsyringe';
import { ApplicationError, noop } from 'aas-core';

import { Variable } from '../variable.js';
import { API_KEY_HANDLER, ApiKeyHandler } from '../auth/api-key-handler.js';
import { ERROR } from '../error.js';

/**
 * User type populated onto `express` when authentication is successful
 */
export type TsoaExpressUser = {
    label: string;
};

/**
 * Tsoa authentication function
 */
export type TsoaExpressAuthenticator = (
    request: express.Request,
    securityName: string,
    scopes?: string[],
) => Promise<TsoaExpressUser>;

@singleton()
export class Authentication {
    private static instance?: Authentication;

    public constructor(
        @inject(Variable) private readonly variable: Variable,
        @inject(API_KEY_HANDLER) private readonly apiKeyHandler: ApiKeyHandler,
    ) {}

    /**
     * Authenticates the current request,
     * @param req The current request.
     * @param name The name of the authentication (bearerAuth or api_key).
     * @param scopes Currently not used.
     * @returns The decoded JSON web token.
     */
    public static async expressAuthentication(
        req: express.Request,
        name: string,
        scopes?: string[],
    ): Promise<TsoaExpressUser> {
        if (!Authentication.instance) {
            Authentication.instance = container.resolve(Authentication);
        }

        return await Authentication.instance.expressAuthentication(req, name, scopes);
    }

    public async expressAuthentication(
        request: express.Request,
        securityName: string,
        scopes?: string[],
    ): Promise<TsoaExpressUser> {
        noop(scopes);
        if (!this.variable.API_KEY_HANDLER) {
            return { label: '' };
        }

        if (securityName !== 'api_key') {
            throw new ApplicationError(ERROR.INTERNAL_SERVER_ERROR, {}, 500);
        }

        const apiKey = request.header('x-api-key') || request.query['api_key'];
        if (!apiKey || typeof apiKey !== 'string') {
            throw new ApplicationError(ERROR.BAD_REQUEST, {}, 401);
        }

        const data = await this.apiKeyHandler.get(apiKey);
        if (!data) {
            throw new ApplicationError(ERROR.UNAUTHORIZED_ACCESS, {}, 401);
        }

        return { label: data.label };
    }
}

export async function expressAuthentication(
    req: express.Request,
    name: string,
    scopes?: string[],
): Promise<TsoaExpressUser> {
    return Authentication.expressAuthentication(req, name, scopes);
}
