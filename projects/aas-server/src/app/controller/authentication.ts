/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import type express from 'express';
import { container, inject, singleton } from 'tsyringe';
import { ApplicationError, noop } from 'aas-core';

import { Variable } from '../variable.js';

/**
 * User type populated onto `express` when authentication is successful
 */
export type TsoaExpressUser = {
    owner: string;
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

    public constructor(@inject(Variable) private readonly variable: Variable) {}

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
        if (!this.variable.ENABLE_AUTH) {
            return { owner: 'undefined' };
        }

        if (securityName === 'api_key') {
            const apiKey = request.header('x-api-key') || request.query['api_key'];
            if (!apiKey) {
                throw new ApplicationError('Unauthorized', {}, 401);
            }
        } else {
            throw new ApplicationError('Unauthorized', {}, 401);
        }

        return { owner: 'ToDo' };
    }
}

export async function expressAuthentication(
    req: express.Request,
    name: string,
    scopes?: string[],
): Promise<TsoaExpressUser> {
    return Authentication.expressAuthentication(req, name, scopes);
}
