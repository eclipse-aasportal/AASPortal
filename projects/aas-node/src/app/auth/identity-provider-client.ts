/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { InjectionToken } from 'tsyringe';
import crypto from 'crypto';
import express from 'express';
import jwt from 'jsonwebtoken';
import { Session } from 'express-session';
import { User, UserRole, noop } from 'aas-core';
import { Logger } from 'aas-package';

/** Injection token. */
export const IDENTITY_PROVIDER: InjectionToken<IdentityProviderClient> = 'IDENTITY_PROVIDER';

export interface RefreshTokenResponse {
    readonly access_token: string;
    readonly refresh_token: string;
    readonly user: User;
}

/** Defines user storage. */
export abstract class IdentityProviderClient {
    protected constructor(protected readonly logger: Logger) {}

    /**
     * Retrieves the user information associated with the given request.
     * This method is called to obtain the current user's information based on the request context,
     * such as cookies or session data. It should return a User object if the user is authenticated,
     * or null if the user is not authenticated.
     * @param req The request.
     * @param res The response.
     */
    public async me(req: express.Request, res: express.Response): Promise<express.Response | void> {
        return res.json(req.user ?? null);
    }

    /**
     * The login method for the identity provider. This method is called when a user tries to log in.
     * @param req The request.
     * @param res The response.
     */
    public abstract login(req: express.Request, res: express.Response): Promise<express.Response | void>;

    /**
     * Callback method for the identity provider. This method is called when the identity provider needs to handle a
     * callback request, e.g., for OAuth2 authentication.
     * @param req The request.
     * @param res The response.
     */
    public abstract callback(req: express.Request, res: express.Response): Promise<express.Response | void>;

    /**
     * The logout method for the identity provider. This method is called when a user tries to log out.
     * @param req The request.
     * @param res The response.
     */
    public abstract logout(req: express.Request, res: express.Response): Promise<express.Response>;

    /**
     * Creates a new user account. This method is called when a user tries to create a new account.
     * @param req The request.
     * @param res The response.
     */
    public abstract createAccount(req: express.Request, res: express.Response): Promise<express.Response>;

    /**
     * Provides an Express middleware that handles authentication for incoming requests.
     * This middleware should be used in the Express app to protect routes that require authentication.
     *
     * @returns An Express middleware that handles authentication for incoming requests.
     * This middleware should be used in the Express app to protect routes that require authentication.
     */
    public middleware(): express.RequestHandler {
        return async (req, res, next) => {
            delete req.user;
            res.setHeader('Access-Control-Allow-Credentials', 'true');
            const { access_token, refresh_token } = req.cookies ?? {};
            if (access_token) {
                try {
                    const payload = await this.verifyAccessToken(access_token);
                    req.user = {
                        id: String(payload.email),
                        name: String(payload.name),
                        role: 'editor' as UserRole,
                    };
                } catch (error) {
                    if (error.name !== 'TokenExpiredError' || !refresh_token) {
                        res.clearCookie('access_token');
                        res.clearCookie('refresh_token');
                        return res.redirect('/api/login');
                    }

                    try {
                        const tokenData = await this.refreshToken(refresh_token);
                        this.setAuthCookies(res, tokenData.access_token, tokenData.refresh_token);
                        req.user = tokenData.user;
                    } catch (error) {
                        noop(error);
                        res.clearCookie('access_token');
                        res.clearCookie('refresh_token');
                        return res.redirect('/api/login');
                    }
                }
            } else if (refresh_token) {
                try {
                    const tokenData = await this.refreshToken(refresh_token);
                    this.setAuthCookies(res, tokenData.access_token, tokenData.refresh_token);
                    req.user = tokenData.user;
                } catch (error) {
                    noop(error);
                    res.clearCookie('access_token');
                    res.clearCookie('refresh_token');
                    return res.redirect('/api/login');
                }
            }

            next();
        };
    }

    /**
     * Gets the public key for verifying the token. This method is called when the server needs to
     * verify an access or refresh token.
     * @returns The public key as a string.
     */
    protected abstract getPublicKey(token: string): Promise<string>;

    /**
     * Refreshes the access token using the provided refresh token. This method is called when the access token has expired and a refresh token is available.
     * @param refresh_token The refresh token.
     * @returns An object containing the new access token, the refresh token, and the user information.
     */
    protected abstract refreshToken(refresh_token: string): Promise<RefreshTokenResponse>;

    /**
     * Generate a random string for PKCE code_verifier
     */
    protected generateCodeVerifier(length = 32): string {
        return crypto.randomBytes(length).toString('base64url');
    }

    /**
     * Generate a code_challenge from the code_verifier
     */
    protected generateCodeChallenge(verifier: string): string {
        return crypto.createHash('sha256').update(verifier).digest('base64url');
    }

    /**
     * Saves the current session state for the given request.
     * This method ensures that any changes made to the session during the request
     * lifecycle are persisted in the session store. If the operation fails, it returns
     * a rejected promise containing the error. Typically used when modifications are made
     * to the session data and must be saved before sending a response.
     *
     * @param req The current Express request containing the session to be saved.
     * @returns A promise that resolves when the session is successfully saved, or rejects if an error occurs.
     */
    protected saveSession(req: express.Request): Promise<void> {
        return new Promise<void>((resolve, reject) => req.session.save(err => (err ? reject(err) : resolve())));
    }

    /**
     * Destroys the provided session, terminating the session and invalidating the corresponding session data
     * in the session store. If an error occurs during destruction, it is logged using the class logger, but
     * the promise will always resolve regardless of errors. This method is typically used during logout or
     * other flows where a clean session termination is required.
     *
     * @param session The session object to be destroyed.
     * @returns A promise that resolves once the session has been destroyed, regardless of success or failure.
     */
    protected destroySession(session: Session): Promise<void> {
        return new Promise(resolve => {
            session.destroy(err => {
                if (err) {
                    this.logger.error(err);
                }

                resolve();
            });
        });
    }

    protected setAuthCookies(res: express.Response, access: string, refresh: string): void {
        const secure = process.env.NODE_ENV === 'production';
        res.cookie('access_token', access, {
            httpOnly: true,
            secure,
            sameSite: 'strict',
        });

        res.cookie('refresh_token', refresh, {
            httpOnly: true,
            secure,
            sameSite: 'strict',
        });
    }

    protected getVerifyOptions(): jwt.VerifyOptions | undefined {
        return undefined;
    }

    private async verifyAccessToken(token: string): Promise<jwt.JwtPayload> {
        const key = await this.getPublicKey(token);
        return new Promise((resolve, reject) => {
            jwt.verify(token, key, this.getVerifyOptions(), (err, payload) => {
                if (err) {
                    return reject(err);
                }

                resolve(payload as jwt.JwtPayload);
            });
        });
    }
}
