/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
    isCredentials,
    User,
    ErrorData,
    isValidEMail,
    isValidPassword,
    getUserNameFromEMail,
    isUserProfile,
    SessionUser,
} from 'aas-core';

import { IdentityProviderClient, RefreshTokenResponse } from './identity-provider-client.js';
import { ERRORS } from '../errors.js';
import { createHash, randomBytes } from 'crypto';
import { USER_STORE, UserData } from './user-store.js';
import { container, singleton } from 'tsyringe';
import { USER_RIGHTS_STORE } from './user-rights-store.js';
import { nanoid } from 'nanoid';

const ACCESS_TOKEN_EXPIRES_IN = 5 * 60; // 5 minutes
const REFRESH_TOKEN_EXPIRES_IN = 7 * 24 * 60 * 60; // 7 days

@singleton()
export class IdentityProvider extends IdentityProviderClient {
    private readonly userRights = container.resolve(USER_RIGHTS_STORE);
    private readonly userStore = container.resolve(USER_STORE);
    private readonly algorithm: jwt.Algorithm;

    public constructor() {
        super();

        this.algorithm = 'HS256';
    }

    public override async login(req: express.Request, res: express.Response): Promise<void> {
        const code_verifier = this.generateCodeVerifier();
        const code_challenge = this.generateCodeChallenge(code_verifier);
        const state = this.generateCodeVerifier(24);
        const redirect_uri = this.variable.REDIRECT_URI ?? `${req.protocol}://${req.host}/auth/callback`;
        req.session.state = state;
        req.session.code_verifier = code_verifier;
        const url = new URL('login', this.variable.HOST_URL ?? `${req.protocol}://${req.host}`);
        url.searchParams.set('client_id', this.variable.CLIENT_ID);
        url.searchParams.set('code_challenge', code_challenge);
        url.searchParams.set('code_challenge_method', 'S256');
        url.searchParams.set('redirect_uri', redirect_uri);
        url.searchParams.set('state', state);
        res.redirect(url.href);
    }

    public override async callback(req: express.Request, res: express.Response): Promise<express.Response | void> {
        const state = req.session.state;
        const code_challenge_method = String(req.query.code_challenge_method);
        const code_challenge = String(req.query.code_challenge);
        const code_verifier = req.session.code_verifier;
        delete req.session.state;
        delete req.session.code_verifier;
        if (
            this.variable.CLIENT_ID !== req.query.client_id ||
            !state ||
            state !== req.query.state ||
            !this.isValidCodeChallenge(code_challenge_method, code_challenge, code_verifier)
        ) {
            return res
                .status(400)
                .json({ name: 'ApplicationError', message: ERRORS.BAD_REQUEST, status: 400 } satisfies ErrorData);
        }

        const credentials = req.body;
        if (!isCredentials(credentials)) {
            return res.status(400).json({
                message: ERRORS.INVALID_CREDENTIALS,
                name: 'ApplicationError',
                status: 400,
            } satisfies ErrorData);
        }

        const data = await this.userStore.get(credentials.id);
        if (!data || (await bcrypt.compare(credentials.password, data.password)) === false) {
            return res.status(401).json({
                message: ERRORS.INVALID_CREDENTIALS,
                name: 'ApplicationError',
                status: 401,
            } satisfies ErrorData);
        }

        const role = (await this.userRights.get(data.id)).role;
        const user: User = { id: data.id, name: data.name, role };
        const redirect_uri = this.variable.REDIRECT_URI ?? `${req.protocol}://${req.host}/auth/callback`;
        const op_session_id = nanoid();
        const session_state = this.generateSessionState(
            this.variable.CLIENT_ID,
            new URL(redirect_uri).origin,
            op_session_id,
        );

        const check_session_iframe = `${this.variable.HOST_URL ?? `${req.protocol}://${req.host}`}/auth/login_status_iframe.html`;
        req.session.user_id = user.id;
        req.session.access_token = this.createAccessToken(user);
        req.session.expires_at = Date.now() + ACCESS_TOKEN_EXPIRES_IN * 1000;
        req.session.refresh_token = this.createRefreshToken(user);
        req.session.op_session_Id = op_session_id;
        req.session.session_state = session_state;
        req.session.check_session_iframe = check_session_iframe;

        res.cookie('AAS_NODE_SESSION', op_session_id, {
            httpOnly: false,
            secure: true,
            sameSite: 'none',
            path: '/',
        });

        res.json({
            ...user,
            client_id: this.variable.CLIENT_ID,
            session_state,
            check_session_iframe,
        } satisfies SessionUser);
    }

    public override async checkSession(req: express.Request, res: express.Response): Promise<express.Response | void> {
        const user = req.user;
        if (!user) {
            return res.status(401).json({
                message: ERRORS.UNAUTHORIZED,
                name: 'ApplicationError',
                status: 401,
            } satisfies ErrorData);
        }

        res.cookie('AAS_NODE_SESSION', req.session.op_session_Id, {
            expires: new Date(Date.now() + this.variable.SESSION_TTL * 1000),
        });

        const html = `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <title>Check Session State</title>
</head>
<body>
    <script>
        const clientId = "${this.variable.CLIENT_ID}";
        const sessionState = "${req.session.session_state}";
        const opCookieName = "AAS_NODE_SESSION";

        window.addEventListener("message", async (e) => {
            const clientOrigin = e.origin;
            const expectedMessage = clientId + " " + sessionState;

            if (e.data === expectedMessage) {
                let status = "changed";
                const opSessionId = getCookie(opCookieName);

                if (opSessionId) {
                    const salt = sessionState.split('.')[1] || '';
                    const hashInput = clientId + ' ' + clientOrigin + ' ' + opSessionId + ' ' + salt;
                    const encoder = new TextEncoder();
                    const data = encoder.encode(hashInput);
                    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
                    
                    const hashArray = Array.from(new Uint8Array(hashBuffer));
                    const hashBase64 = btoa(String.fromCharCode.apply(null, hashArray));
                    const calculatedState = hashBase64.replace(/=/g, '').replace(/\\+/g, '-').replace(/\\//g, '_') + '.' + salt;
                    if (calculatedState === sessionState) {
                        status = "unchanged";
                    }
                }
                
                e.source.postMessage(expectedMessage + " status:" + status, clientOrigin);
            }
        }, false);

        function getCookie(name) {
            const value = "; " + document.cookie;
            const parts = value.split("; " + name + "=");
            if (parts.length === 2) return parts.pop().split(";").shift();
        }
    </script>
</body>
</html>
    `;

        res.setHeader('Content-Type', 'text/html');
        //res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
        return res.sendStatus(200).send(html);
    }

    public override async logout(req: express.Request, res: express.Response): Promise<express.Response> {
        delete req.user;
        await this.destroySession(req.session);
        return res.sendStatus(200);
    }

    public override async createAccount(req: express.Request, res: express.Response): Promise<express.Response> {
        const profile = req.body;
        if (!isUserProfile(profile)) {
            return res.status(400).json({
                message: ERRORS.BAD_REQUEST,
                name: 'ApplicationError',
                status: 400,
            } satisfies ErrorData);
        }

        if (!isValidEMail(profile.id)) {
            return res.status(400).json({
                message: ERRORS.INVALID_EMAIL,
                name: 'ApplicationError',
                status: 400,
            } satisfies ErrorData);
        }

        if (await this.userStore.get(profile.id)) {
            return res.status(409).json({
                message: ERRORS.USER_ALREADY_EXISTS,
                name: 'ApplicationError',
                status: 409,
            } satisfies ErrorData);
        }

        if (!profile.password || !isValidPassword(profile.password)) {
            return res.status(400).json({
                message: ERRORS.INVALID_PASSWORD,
                name: 'ApplicationError',
                status: 400,
            } satisfies ErrorData);
        }

        const name = profile.name ?? getUserNameFromEMail(profile.id);
        const data: UserData = {
            id: profile.id,
            name: name,
            password: await bcrypt.hash(profile.password, 10),
            created: new Date(),
        };

        await this.userStore.set(profile.id, data);
        return res.sendStatus(201);
    }

    public override async updateAccount(req: express.Request, res: express.Response): Promise<express.Response> {
        const user = req.user;
        if (!user) {
            return res.status(401).json({
                message: ERRORS.UNAUTHORIZED,
                name: 'ApplicationError',
                status: 401,
            } satisfies ErrorData);
        }

        const profile = req.body;
        if (!isUserProfile(profile)) {
            return res.status(400).json({
                message: ERRORS.BAD_REQUEST,
                name: 'ApplicationError',
                status: 400,
            } satisfies ErrorData);
        }

        const data = await this.userStore.get(profile.id);
        if (!data) {
            return res.status(404).json({
                message: ERRORS.USER_DOES_NOT_EXIST,
                name: 'ApplicationError',
                status: 404,
            } satisfies ErrorData);
        }

        if (profile.name) {
            data.name = profile.name;
        }

        if (profile.password && profile.newPassword) {
            if ((await bcrypt.compare(profile.password, data.password)) === false) {
                return res.status(401).json({
                    message: ERRORS.INVALID_CREDENTIALS,
                    name: 'ApplicationError',
                    status: 401,
                } satisfies ErrorData);
            }

            if (!isValidPassword(profile.newPassword)) {
                return res.status(400).json({
                    message: ERRORS.INVALID_PASSWORD,
                    name: 'ApplicationError',
                    status: 400,
                } satisfies ErrorData);
            }

            data.password = await bcrypt.hash(profile.newPassword, 10);
        }

        await this.userStore.set(profile.id, data);
        return res.status(201).json({
            id: data.id,
            name: data.name,
            role: (await this.userRights.get(data.id)).role,
            client_id: this.variable.CLIENT_ID,
            session_state: req.session.session_state,
            check_session_iframe: req.session.check_session_iframe,
        } satisfies SessionUser);
    }

    public override async deleteAccount(req: express.Request, res: express.Response): Promise<express.Response | void> {
        const user = req.user;
        if (!user) {
            return res.status(401).json({
                message: ERRORS.UNAUTHORIZED,
                name: 'ApplicationError',
                status: 401,
            } satisfies ErrorData);
        }

        const deleted = await this.userStore.delete(user.id);
        if (!deleted) {
            return res.status(404).json({
                message: ERRORS.USER_DOES_NOT_EXIST,
                name: 'ApplicationError',
                status: 404,
            } satisfies ErrorData);
        }

        return this.logout(req, res);
    }

    protected override getPublicKey(): Promise<string> {
        return Promise.resolve(this.variable.CLIENT_SECRET);
    }

    protected override async refreshToken(refresh_token: string): Promise<RefreshTokenResponse> {
        const payload = jwt.decode(refresh_token, { json: true })!;
        const user: User = {
            id: payload.email,
            name: payload.name,
            role: 'user',
        };

        const access_token = this.createAccessToken(user);
        return { refresh_token, access_token, user };
    }

    private isValidCodeChallenge(
        code_challenge_method: string,
        code_challenge: string,
        code_verifier: string | undefined,
    ): boolean {
        if (code_challenge_method !== 'S256') {
            return false;
        }

        if (!code_challenge || !code_verifier) {
            return false;
        }

        return code_challenge === this.generateCodeChallenge(code_verifier);
    }

    private generateSessionState(clientId: string, clientOrigin: string, opSessionId: string): string {
        const salt = randomBytes(16).toString('hex');
        const hashInput = `${clientId} ${clientOrigin} ${opSessionId} ${salt}`;
        const hash = createHash('sha256').update(hashInput).digest('base64url');
        return `${hash}.${salt}`;
    }

    private createAccessToken(user: User): string {
        return jwt.sign({ email: user.id, name: user.name }, this.variable.CLIENT_SECRET, {
            issuer: this.variable.IDENTITY_PROVIDER,
            audience: this.variable.CLIENT_ID,
            subject: user.id,
            expiresIn: ACCESS_TOKEN_EXPIRES_IN,
            algorithm: this.algorithm,
        });
    }

    private createRefreshToken(user: User): string {
        return jwt.sign({ email: user.id, name: user.name }, this.variable.CLIENT_SECRET, {
            issuer: this.variable.IDENTITY_PROVIDER,
            audience: this.variable.CLIENT_ID,
            subject: user.id,
            expiresIn: REFRESH_TOKEN_EXPIRES_IN,
            algorithm: this.algorithm,
        });
    }
}
