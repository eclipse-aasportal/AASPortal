/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import type express from 'express';
import jwt from 'jsonwebtoken';
import jwksClient, { type JwksClient } from 'jwks-rsa';
import { container, inject, singleton } from 'tsyringe';
import { noop } from 'aas-core';

import { Variable } from '../variable.js';

export type ErrorReason = 'INVALID_SECURITY_TYPE' | 'NO_TOKEN' | 'MISSING_SCOPES' | 'INVALID_TOKEN' | 'INTERNAL_ERROR';

type VerifyResolve = { type: 'error'; err: jwt.VerifyErrors } | { type: 'success'; result: jwt.JwtPayload | string };

/**
 * Error which represents and authentication failure
 */
export class OauthError extends Error {
    public constructor(public reason: ErrorReason) {
        super(`Auth failed for reason: ${reason}`);
    }
}

/**
 * User type populated onto `express` when authentication is successful
 */
export type TsoaExpressUser =
    | {
          securityName: string;
          jwt: jwt.JwtPayload | string;
      }
    | object;

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
    private client?: JwksClient;
    private securityName = 'bearerAuth';
    private readonly requiredSecurityName = this.securityName ?? 'oauth2';
    private verifyOptions: jwt.VerifyOptions = {};

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
        await this.assertClient();

        if (securityName !== this.requiredSecurityName) {
            throw new OauthError('INVALID_SECURITY_TYPE');
        }

        const accessToken = await this.getAccessToken(request);
        if (!accessToken) {
            throw new OauthError('NO_TOKEN');
        }

        const verifyResult = await this.verifyToken(accessToken);
        const jwt = await this.handleErrorAndRefresh(verifyResult, request);
        await this.checkScopes(jwt, scopes);

        if (!jwt) {
            throw new OauthError('INTERNAL_ERROR');
        }

        return {
            securityName,
            jwt,
        };
    }

    private async assertClient(): Promise<JwksClient> {
        if (!this.client) {
            this.client = jwksClient({
                jwksUri: await this.jwksUri(),
                requestHeaders: {}, // Optional
                timeout: 30000, // Defaults to 30s
            });
        }
        return this.client;
    }

    private getKey: jwt.GetPublicKeyOrSecret = (header, callback) => {
        this.client?.getSigningKey(header.kid, (err, key) => {
            if (err || !key) {
                callback(err || new Error('Error getting jwks key'));
                return;
            }

            callback(null, key.getPublicKey());
        });
    };

    private async verifyToken(accessToken: string): Promise<VerifyResolve> {
        return new Promise<VerifyResolve>((resolve, reject) => {
            jwt.verify(accessToken, this.getKey, this.verifyOptions, function (err, decoded) {
                if (err) {
                    resolve({
                        type: 'error',
                        err,
                    });

                    return;
                }

                if (!decoded) {
                    reject(new OauthError('INTERNAL_ERROR'));
                    return;
                }

                resolve({ type: 'success', result: decoded });
            });
        });
    }

    private async handleErrorAndRefresh(
        verifyResult: VerifyResolve,
        request: express.Request,
    ): Promise<string | jwt.JwtPayload> {
        if (verifyResult.type === 'success') {
            return verifyResult.result;
        }

        const err = verifyResult.err;
        if (!(err instanceof jwt.TokenExpiredError)) {
            throw new OauthError('INVALID_TOKEN');
        }

        const refresh = this.tryRefreshTokens;
        if (!refresh) {
            throw new OauthError('INVALID_TOKEN');
        }

        const accessToken = await refresh(request);
        if (!accessToken) {
            throw new OauthError('INVALID_TOKEN');
        }

        const refreshVerify = await this.verifyToken(accessToken);
        if (refreshVerify.type === 'error') {
            throw new OauthError('INVALID_TOKEN');
        }

        return refreshVerify.result;
    }

    private async checkScopes(
        token: string | jwt.JwtPayload | undefined,
        requiredScopes: string[] | undefined,
    ): Promise<void> {
        if (!requiredScopes || requiredScopes.length === 0) {
            return;
        }

        if (!token) {
            throw new OauthError('MISSING_SCOPES');
        }

        const tokenScopes = new Set(await this.getScopesFromToken(token));

        for (const requiredScope of requiredScopes) {
            if (!tokenScopes.has(requiredScope)) {
                throw new OauthError('MISSING_SCOPES');
            }
        }
    }

    private jwksUri(): Promise<string> {
        return Promise.resolve(`${this.variable.KEYCLOAK_ISSUER}/protocol/openid-connect/certs`);
    }

    private getAccessToken(req: express.Request): Promise<string | undefined> {
        return Promise.resolve(req.headers['authorization']?.substring('bearer '.length));
    }

    private getScopesFromToken(decoded: string | jwt.JwtPayload): Promise<string[]> {
        const scopes = ((decoded as jwt.JwtPayload).scopes as string) || '';
        return Promise.resolve(scopes.split(' '));
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private tryRefreshTokens(token: string | jwt.JwtPayload): Promise<string | undefined> {
        return Promise.resolve(undefined);
    }
}

export async function expressAuthentication(
    req: express.Request,
    name: string,
    scopes?: string[],
): Promise<TsoaExpressUser> {
    noop(req, name, scopes);
    return Promise.resolve({});
}
