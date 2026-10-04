/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { container, singleton } from 'tsyringe';
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
import { USER_STORE, UserData } from './user-store.js';
import { checkIsDefined } from '../utilities.js';

const AAS_NODE_SESSION = 'AAS_NODE_SESSION';
const ACCESS_TOKEN_EXPIRES_IN = 5 * 60; // 5 minutes

@singleton()
export class IdentityProvider extends IdentityProviderClient {
    private readonly userStore = container.resolve(USER_STORE);
    private readonly algorithm: jwt.Algorithm;
    private readonly clientSecret: string;

    public constructor() {
        super();

        this.algorithm = 'HS256';
        this.clientSecret = checkIsDefined(this.variable.CLIENT_SECRET, 'CLIENT_SECRET');
    }

    public override async login(req: express.Request, res: express.Response): Promise<void> {
        const code_verifier = this.generateCodeVerifier();
        const code_challenge = this.generateCodeChallenge(code_verifier);
        const state = this.generateCodeVerifier(24);
        const redirect_uri = this.variable.REDIRECT_URI ?? `${req.protocol}://${req.host}/auth/callback`;
        req.session.state = state;
        req.session.code_verifier = code_verifier;

        const url = new URL('login', this.variable.HOST_URL ?? `${req.protocol}://${req.host}`);
        url.searchParams.set('client_id', this.clientId);
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

        const user: User = { id: data.id, name: data.name };
        req.session.user_id = user.id;
        req.session.name = user.name;
        req.session.role = await this.userRights.getRole(data.id);
        req.session.access_token = this.createAccessToken(user);
        req.session.refresh_token = this.createRefreshToken(user);

        res.json({
            client_id: this.clientId,
            id: req.session.user_id,
            name: req.session.name,
            role: req.session.role,
        } satisfies SessionUser);
    }

    public override async logout(req: express.Request, res: express.Response): Promise<express.Response> {
        delete req.user;
        await this.destroySession(req, res);
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
                message: ERRORS.UNAUTHENTICATED_ACCESS,
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

        const data = await this.userStore.get(user.id);
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
            role: await this.userRights.getRole(data.id),
            client_id: this.clientId,
        } satisfies SessionUser);
    }

    public override async deleteAccount(req: express.Request, res: express.Response): Promise<express.Response | void> {
        const user = req.user;
        if (!user) {
            return res.status(401).json({
                message: ERRORS.UNAUTHORIZED_ACCESS,
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
        return Promise.resolve(this.clientSecret);
    }

    protected override async refreshToken(refresh_token: string): Promise<RefreshTokenResponse> {
        const payload = jwt.verify(refresh_token, this.clientSecret, {
            issuer: this.variable.IDENTITY_PROVIDER,
            audience: this.variable.CLIENT_ID,
            algorithms: [this.algorithm],
        });
        if (
            typeof payload === 'string' ||
            typeof payload.email !== 'string' ||
            typeof payload.name !== 'string' ||
            payload.sub !== payload.email
        ) {
            throw new jwt.JsonWebTokenError('Invalid refresh token payload');
        }

        const user: User = {
            id: payload.email,
            name: payload.name,
        };

        const access_token = this.createAccessToken(user);
        return { refresh_token, access_token, user };
    }

    protected override async destroySession(req: express.Request, res: express.Response): Promise<void> {
        await super.destroySession(req, res);
        res.clearCookie(AAS_NODE_SESSION);
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

    private createAccessToken(user: User): string {
        return jwt.sign({ email: user.id, name: user.name }, this.clientSecret, {
            issuer: this.variable.IDENTITY_PROVIDER,
            audience: this.variable.CLIENT_ID,
            subject: user.id,
            expiresIn: ACCESS_TOKEN_EXPIRES_IN,
            algorithm: this.algorithm,
        });
    }

    private createRefreshToken(user: User): string {
        return jwt.sign({ email: user.id, name: user.name }, this.clientSecret, {
            issuer: this.variable.IDENTITY_PROVIDER,
            audience: this.variable.CLIENT_ID,
            subject: user.id,
            expiresIn: this.variable.SESSION_TTL,
            algorithm: this.algorithm,
        });
    }
}
