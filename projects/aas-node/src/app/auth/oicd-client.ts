/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import express from 'express';
import { inject, singleton } from 'tsyringe';
import jwt from 'jsonwebtoken';
import jwksClient, { JwksClient } from 'jwks-rsa';
import * as z from 'zod';

import { ApplicationError, ErrorData, User } from 'aas-core';
import { Logger, LOGGER } from 'aas-package';

import { IdentityProviderClient, RefreshTokenResponse } from './identity-provider-client.js';
import { Variable } from '../variable.js';
import { ERRORS } from '../errors.js';
import { COOKIE_STORAGE, CookieStorage } from '../cookie-storage/cookie-storage.js';

export const AuthorizationServerSchema = z.object({
    issuer: z.url(),
    authorization_endpoint: z.url(),
    token_endpoint: z.url(),
    jwks_uri: z.url(),
    end_session_endpoint: z.url(),
    userinfo_endpoint: z.url().optional(),
    check_session_iframe: z.url().optional(),
});

export type AuthorizationServer = z.infer<typeof AuthorizationServerSchema>;

export interface AuthorizationDetails {
    readonly type: string;
    readonly locations?: string[];
    readonly actions?: string[];
    readonly datatypes?: string[];
    readonly privileges?: string[];
    readonly identifier?: string;
}

export interface TokenEndpointResponse {
    readonly access_token: string;
    readonly expires_in?: number;
    readonly id_token?: string;
    readonly refresh_token?: string;
    readonly scope?: string;
    readonly authorization_details?: AuthorizationDetails[];
    readonly token_type: 'bearer' | 'dpop' | Lowercase<string>;
}

@singleton()
export class OicdClient extends IdentityProviderClient {
    private configuration?: AuthorizationServer;
    private readonly server: string;
    private readonly clientId: string;
    private readonly clientSecret: string;
    private readonly secure = process.env.NODE_ENV === 'production';
    private jwksClient?: JwksClient;

    public constructor(
        @inject(LOGGER) logger: Logger,
        @inject(COOKIE_STORAGE) cookies: CookieStorage,
        @inject(Variable) private readonly variable: Variable,
    ) {
        super(logger, cookies);

        this.server = this.variable.IDENTITY_PROVIDER;
        this.clientId = this.variable.CLIENT_ID;
        this.clientSecret = this.variable.CLIENT_SECRET;
        this.logger.info(`Using OIDC Client '${this.server}'`);
    }

    public override async login(req: express.Request, res: express.Response): Promise<express.Response | void> {
        try {
            const authorization_endpoint = (await this.getConfiguration()).authorization_endpoint;
            const code_verifier = this.generateCodeVerifier();
            const code_challenge = this.generateCodeChallenge(code_verifier);
            const redirect_uri = this.variable.REDIRECT_URI ?? `${req.protocol}://${req.host}/api/callback`;
            const state = this.generateCodeVerifier(24);
            req.session.code_verifier = code_verifier;
            req.session.state = state;

            const authUrl = new URL(authorization_endpoint);
            authUrl.searchParams.set('client_id', this.clientId);
            authUrl.searchParams.set('redirect_uri', redirect_uri);
            authUrl.searchParams.set('response_type', 'code');
            authUrl.searchParams.set('scope', 'openid profile email');
            authUrl.searchParams.set('code_challenge', code_challenge);
            authUrl.searchParams.set('code_challenge_method', 'S256');
            authUrl.searchParams.set('state', state);
            res.redirect(authUrl.href);
        } catch (error) {
            return this.sendError(res, error);
        }
    }

    public override async callback(req: express.Request, res: express.Response): Promise<express.Response | void> {
        try {
            const token_endpoint = (await this.getConfiguration()).token_endpoint;
            const redirect_uri = this.variable.REDIRECT_URI ?? `${req.protocol}://${req.host}/api/callback`;
            const code = req.query.code as string | undefined;
            const session_state = req.query.session_state as string | undefined;
            const code_verifier = req.session.code_verifier;
            const state = req.session.state;
            delete req.session.code_verifier;
            delete req.session.state;
            delete req.session.session_state;
            if (!code || !state || req.query.state !== state) {
                return res.status(400).json({
                    name: 'ApplicationError',
                    message: `code: ${code ? 'ok' : 'N/D'}, state: ${state ? 'ok' : 'N/D'}, state match: ${req.query.state === state}`,
                    status: 400,
                } satisfies ErrorData);
            }

            if (session_state) {
                req.session.session_state = session_state;
            }

            const params = new URLSearchParams();
            params.set('grant_type', 'authorization_code');
            params.set('client_id', this.clientId);
            params.set('client_secret', this.clientSecret);
            params.set('code', code);
            params.set('redirect_uri', redirect_uri);
            if (code_verifier) {
                params.set('code_verifier', code_verifier);
            }

            const response = await fetch(token_endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: params,
            });

            if (!response.ok) {
                const message = await response.text().catch(() => 'Token endpoint error');
                return res.status(response.status).json({
                    name: 'ApplicationError',
                    message,
                    status: response.status,
                } satisfies ErrorData);
            }

            if (session_state) {
                req.session.session_state = session_state;
            }

            const tokenData = (await response.json()) as TokenEndpointResponse;
            req.session.access_token = tokenData.access_token;
            req.session.refresh_token = tokenData.refresh_token;
            res.redirect(new URL('start', this.variable.HOST_URL ?? `${req.protocol}://${req.host}`).href);
        } catch (error) {
            return this.sendError(res, error);
        }
    }

    public override async logout(req: express.Request, res: express.Response): Promise<express.Response> {
        try {
            const end_session_endpoint = (await this.getConfiguration()).end_session_endpoint;
            const refresh_token = req.cookies?.refresh_token;
            if (!refresh_token) {
                return res.status(400).json({
                    message: ERRORS.BAD_REQUEST,
                    name: 'ApplicationError',
                    status: 400,
                } satisfies ErrorData);
            }

            const params = new URLSearchParams();
            params.set('client_id', this.clientId);
            params.set('client_secret', this.clientSecret);
            params.set('refresh_token', refresh_token);
            const response = await fetch(end_session_endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: params,
            });

            if (!response.ok) {
                return res.status(400).json({
                    name: 'ApplicationError',
                    message: ERRORS.BAD_REQUEST,
                    status: response.status,
                } satisfies ErrorData);
            }

            await this.destroySession(req.session);
            return res.sendStatus(200);
        } catch (error) {
            return this.sendError(res, error);
        }
    }

    public override async createAccount(req: express.Request, res: express.Response): Promise<express.Response> {
        return res.sendStatus(500);
    }

    protected override async getPublicKey(token: string): Promise<string> {
        if (!this.jwksClient) {
            const jwks_uri = (await this.getConfiguration()).jwks_uri;
            this.jwksClient = jwksClient({ jwksUri: jwks_uri, rateLimit: true, cache: true });
        }

        const decoded = jwt.decode(token, { complete: true });
        const kid = decoded?.header?.kid;
        if (!kid) {
            throw new ApplicationError(ERRORS.INTERNAL_SERVER_ERROR, {}, 500);
        }

        const client = this.jwksClient;
        return new Promise<string>((resolve, reject) => {
            client.getSigningKey(kid, (err, key) => {
                if (err) {
                    return reject(err);
                }

                if (!key) {
                    return reject(new ApplicationError(ERRORS.INTERNAL_SERVER_ERROR, {}, 500));
                }

                resolve(key.getPublicKey());
            });
        });
    }

    protected override async refreshToken(refresh_token: string): Promise<RefreshTokenResponse> {
        const token_endpoint = (await this.getConfiguration()).token_endpoint;
        const params = new URLSearchParams();
        params.set('grant_type', 'refresh_token');
        params.set('client_id', this.clientId);
        params.set('client_secret', this.clientSecret);
        params.set('refresh_token', refresh_token);
        const response = await fetch(token_endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params,
        });

        if (!response.ok) {
            throw new ApplicationError(await response.text(), {}, response.status);
        }

        const tokenData = (await response.json()) as TokenEndpointResponse;
        const payload = jwt.decode(tokenData.access_token, { json: true });
        if (!payload) {
            throw new ApplicationError(ERRORS.INTERNAL_SERVER_ERROR, {}, 500);
        }

        const user: User = {
            id: String(payload.email),
            name: String(payload.name),
            role: 'editor',
        };

        return { refresh_token: tokenData.refresh_token!, access_token: tokenData.access_token, user };
    }

    private async getConfiguration(): Promise<AuthorizationServer> {
        if (this.configuration) {
            return this.configuration;
        }

        const response = await fetch(`${this.server}/.well-known/openid-configuration`);
        if (!response.ok) {
            const message = await response.text().catch(() => 'OpenId configuration error.');
            throw new ApplicationError(message, {}, response.status);
        }

        const result = await AuthorizationServerSchema.safeParseAsync(await response.json());
        if (!result.success) {
            throw new ApplicationError(result.error.issues.map(issue => issue.message).join('; '), {}, 500);
        }

        return result.data;
    }

    private sendError(res: express.Response, error: string | Error): express.Response {
        if (!error) {
            return res.status(500).json({
                name: 'ApplicationError',
                message: ERRORS.INTERNAL_SERVER_ERROR,
                status: 500,
            } satisfies ErrorData);
        }

        if (error instanceof ApplicationError) {
            return res.status(error.statusCode).json(error.toJson());
        }

        if (error instanceof Error) {
            return res.status(500).json({
                name: 'ApplicationError',
                message: error.stack ?? error.message,
                status: 500,
            } satisfies ErrorData);
        }

        if (typeof error === 'string') {
            return res.status(500).json({
                name: 'ApplicationError',
                message: error,
                status: 500,
            } satisfies ErrorData);
        }

        return res.status(500).json({
            name: 'ApplicationError',
            message: ERRORS.INTERNAL_SERVER_ERROR,
            status: 500,
        } satisfies ErrorData);
    }
}
