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

import { ApplicationError, ErrorData, User } from 'aas-core';
import { Logger, LOGGER } from 'aas-package';

import { IdentityProviderClient, RefreshTokenResponse } from './identity-provider-client.js';
import { Variable } from '../variable.js';
import { ERRORS } from '../errors.js';

export interface AuthorizationServer {
    readonly issuer: string;
    readonly authorization_endpoint?: string;
    readonly token_endpoint?: string;
    readonly jwks_uri?: string;
    readonly registration_endpoint?: string;
    readonly scopes_supported?: string[];
    readonly response_types_supported?: string[];
    readonly response_modes_supported?: string[];
    readonly grant_types_supported?: string[];
    readonly token_endpoint_auth_methods_supported?: string[];
    readonly token_endpoint_auth_signing_alg_values_supported?: string[];
    readonly service_documentation?: string;
    readonly ui_locales_supported?: string[];
    readonly op_policy_uri?: string;
    readonly op_tos_uri?: string;
    readonly revocation_endpoint?: string;
    readonly revocation_endpoint_auth_methods_supported?: string[];
    readonly revocation_endpoint_auth_signing_alg_values_supported?: string[];
    readonly introspection_endpoint?: string;
    readonly introspection_endpoint_auth_methods_supported?: string[];
    readonly introspection_endpoint_auth_signing_alg_values_supported?: string[];
    readonly code_challenge_methods_supported?: string[];
    readonly signed_metadata?: string;
    readonly device_authorization_endpoint?: string;
    readonly tls_client_certificate_bound_access_tokens?: boolean;
    readonly userinfo_endpoint?: string;
    readonly acr_values_supported?: string[];
    readonly subject_types_supported?: string[];
    readonly id_token_signing_alg_values_supported?: string[];
    readonly id_token_encryption_alg_values_supported?: string[];
    readonly id_token_encryption_enc_values_supported?: string[];
    readonly userinfo_signing_alg_values_supported?: string[];
    readonly userinfo_encryption_alg_values_supported?: string[];
    readonly userinfo_encryption_enc_values_supported?: string[];
    readonly request_object_signing_alg_values_supported?: string[];
    readonly request_object_encryption_alg_values_supported?: string[];
    readonly request_object_encryption_enc_values_supported?: string[];
    readonly display_values_supported?: string[];
    readonly claim_types_supported?: string[];
    readonly claims_supported?: string[];
    readonly claims_locales_supported?: string[];
    readonly claims_parameter_supported?: boolean;
    readonly request_parameter_supported?: boolean;
    readonly request_uri_parameter_supported?: boolean;
    readonly require_request_uri_registration?: boolean;
    readonly require_signed_request_object?: boolean;
    readonly pushed_authorization_request_endpoint?: string;
    readonly require_pushed_authorization_requests?: boolean;
    readonly introspection_signing_alg_values_supported?: string[];
    readonly introspection_encryption_alg_values_supported?: string[];
    readonly introspection_encryption_enc_values_supported?: string[];
    readonly authorization_response_iss_parameter_supported?: boolean;
    readonly authorization_signing_alg_values_supported?: string[];
    readonly authorization_encryption_alg_values_supported?: string[];
    readonly authorization_encryption_enc_values_supported?: string[];
    readonly backchannel_authentication_endpoint?: string;
    readonly backchannel_authentication_request_signing_alg_values_supported?: string[];
    readonly backchannel_token_delivery_modes_supported?: string[];
    readonly backchannel_user_code_parameter_supported?: boolean;
    readonly check_session_iframe?: string;
    readonly dpop_signing_alg_values_supported?: string[];
    readonly end_session_endpoint?: string;
    readonly frontchannel_logout_session_supported?: boolean;
    readonly frontchannel_logout_supported?: boolean;
    readonly backchannel_logout_session_supported?: boolean;
    readonly backchannel_logout_supported?: boolean;
    readonly protected_resources?: string[];
}

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
        @inject(Variable) private readonly variable: Variable,
    ) {
        super(logger);

        this.server = this.variable.IDENTITY_PROVIDER;
        this.clientId = this.variable.CLIENT_ID;
        this.clientSecret = this.variable.CLIENT_SECRET;
    }

    public override async login(req: express.Request, res: express.Response): Promise<express.Response | void> {
        try {
            const authorization_endpoint = (await this.getConfiguration()).authorization_endpoint;
            if (!authorization_endpoint) {
                return res.status(500).json({
                    name: 'ApplicationError',
                    message: ERRORS.INTERNAL_SERVER_ERROR,
                    status: 500,
                } satisfies ErrorData);
            }

            const code_verifier = this.generateCodeVerifier();
            const code_challenge = this.generateCodeChallenge(code_verifier);
            const redirect_uri = `${req.protocol}://${req.host}/api/callback`;
            const state = this.generateCodeVerifier(24);
            req.session.code_verifier = code_verifier;
            req.session.state = state;

            const authUrl = new URL(authorization_endpoint!);
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
            if (!token_endpoint) {
                return res.status(500).json({
                    name: 'ApplicationError',
                    message: ERRORS.INTERNAL_SERVER_ERROR,
                    status: 500,
                } satisfies ErrorData);
            }

            const redirect_uri = `${req.protocol}://${req.host}/api/callback`;
            const code = req.query.code as string | undefined;
            const code_verifier = req.session.code_verifier;
            const state = req.session.state;
            delete req.session.code_verifier;
            delete req.session.state;
            if (!code || !code_verifier || !state || req.query.state !== state) {
                return res.status(400).json({
                    name: 'ApplicationError',
                    message: ERRORS.BAD_REQUEST,
                    status: 400,
                } satisfies ErrorData);
            }

            const params = new URLSearchParams();
            params.set('grant_type', 'authorization_code');
            params.set('client_id', this.clientId);
            params.set('client_secret', this.clientSecret);
            params.set('code', code);
            params.set('redirect_uri', redirect_uri);
            params.set('code_verifier', code_verifier);
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

            const tokenData = (await response.json()) as TokenEndpointResponse;
            res.cookie('access_token', tokenData.access_token, {
                httpOnly: true,
                secure: this.secure,
                sameSite: 'strict',
            });

            if (tokenData.refresh_token) {
                res.cookie('refresh_token', tokenData.refresh_token, {
                    httpOnly: true,
                    secure: this.secure,
                    sameSite: 'strict',
                });
            }

            res.redirect(`${req.protocol}://${req.host}/start`);
        } catch (error) {
            return this.sendError(res, error);
        }
    }

    public override async logout(req: express.Request, res: express.Response): Promise<express.Response> {
        try {
            const end_session_endpoint = (await this.getConfiguration()).end_session_endpoint;
            if (!end_session_endpoint) {
                return res.status(500).json({
                    name: 'ApplicationError',
                    message: ERRORS.INTERNAL_SERVER_ERROR,
                    status: 500,
                } satisfies ErrorData);
            }

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

            res.clearCookie('access_token');
            res.clearCookie('refresh_token');
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
            if (!jwks_uri) {
                throw new ApplicationError(ERRORS.INTERNAL_SERVER_ERROR, {}, 500);
            }

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
        const configuration = await this.getConfiguration();
        const params = new URLSearchParams();
        params.set('grant_type', 'refresh_token');
        params.set('client_id', this.clientId);
        params.set('client_secret', this.clientSecret);
        params.set('refresh_token', refresh_token);
        const response = await fetch(configuration.token_endpoint!, {
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

        this.configuration = (await response.json()) as AuthorizationServer;
        return this.configuration;
    }

    private sendError(res: express.Response, error: unknown): express.Response {
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
                message: error.message,
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
