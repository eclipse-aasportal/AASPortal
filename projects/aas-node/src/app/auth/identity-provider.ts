/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import fs from 'fs';
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Logger } from 'aas-package';
import {
    isCredentials,
    User,
    ErrorData,
    isValidEMail,
    isValidPassword,
    getUserNameFromEMail,
    isUserProfile,
    UserRole,
} from 'aas-core';

import { IdentityProviderClient, RefreshTokenResponse } from './identity-provider-client.js';
import { ERRORS } from '../errors.js';
import { Variable } from '../variable.js';

/** The user data. */
export interface UserData {
    /** The e-mail address. */
    id: string;
    /** The name or alias. */
    name: string;
    /** The role. */
    role: UserRole;
    /** The password hash. */
    password: string;
    /** The creation date. */
    created: Date;
    /** The date and time of the last login. */
    lastLoggedIn: Date;
}

export abstract class IdentityProvider extends IdentityProviderClient {
    private readonly algorithm: jwt.Algorithm;
    private readonly publicKey: string;
    private readonly privateKey: string;

    protected constructor(
        logger: Logger,
        protected readonly variable: Variable,
    ) {
        super(logger);

        if (process.env.JWT_PUBLIC_KEY) {
            this.publicKey = fs.readFileSync(process.env.JWT_PUBLIC_KEY, 'utf8');
            this.algorithm = 'RS256';
            this.privateKey = fs.readFileSync(process.env.JWT_SECRET!, 'utf8');
        } else {
            this.publicKey = this.privateKey = process.env.JWT_SECRET || 'The quick brown fox jumps over the lazy dog.';
            this.algorithm = 'HS256';
        }
    }

    public override async login(req: express.Request, res: express.Response): Promise<void> {
        const code_verifier = this.generateCodeVerifier();
        const code_challenge = this.generateCodeChallenge(code_verifier);
        const state = this.generateCodeVerifier(24);
        req.session.state = state;
        req.session.code_verifier = code_verifier;
        const url = new URL('login', `${req.secure ? 'https://' : 'http://'}${req.host}`);
        url.searchParams.set('client_id', this.variable.CLIENT_ID);
        url.searchParams.set('code_challenge', code_challenge);
        url.searchParams.set('code_challenge_method', 'S256');
        url.searchParams.set('redirect_uri', '/api/callback');
        url.searchParams.set('state', state);
        await this.saveSession(req);
        res.redirect(url.href);
    }

    public override async callback(req: express.Request, res: express.Response): Promise<express.Response> {
        const state = req.session.state;
        delete req.session.state;
        if (this.variable.CLIENT_ID !== req.query.client_id || !state || state !== req.query.state) {
            return res
                .status(400)
                .json({ name: 'ApplicationError', message: ERRORS.BAD_REQUEST, status: 400 } satisfies ErrorData);
        }

        const code_challenge_method = String(req.query.code_challenge_method);
        const code_challenge = String(req.query.code_challenge);
        const code_verifier = req.session.code_verifier;
        if (!this.isValidCodeChallenge(code_challenge_method, code_challenge, code_verifier)) {
            return res
                .status(400)
                .json({ name: 'ApplicationError', message: ERRORS.BAD_REQUEST, status: 400 } satisfies ErrorData);
        }

        const credentials = req.body;
        if (!isCredentials(credentials)) {
            return res.status(400).json({
                message: ERRORS.BAD_REQUEST,
                name: 'ApplicationError',
                status: 400,
            } satisfies ErrorData);
        }

        const data = await this.read(credentials.id);
        if (!data || (await bcrypt.compare(credentials.password, data.password)) === false) {
            return res.status(401).json({
                message: ERRORS.INVALID_CREDENTIALS,
                name: 'ApplicationError',
                status: 401,
            } satisfies ErrorData);
        }

        const user: User = { id: data.id, name: data.name, role: data.role };
        this.setAuthCookies(res, this.createAccessToken(user), this.createRefreshToken(user));
        return res.json(user);
    }

    public override async logout(req: express.Request, res: express.Response): Promise<express.Response> {
        delete req.user;
        res.clearCookie('access_token');
        res.clearCookie('refresh_token');
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

        if (await this.read(profile.id)) {
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
            role: 'editor',
            password: await bcrypt.hash(profile.password, 10),
            created: new Date(),
            lastLoggedIn: new Date(0),
        };

        await this.write(profile.id, data);
        return res.sendStatus(201);
    }

    /**
     * Reads the data of the user with the specified identification.
     * @param userId The user identification (e-mail).
     * @returns The data of the specified user or `undefined` if such a user does not exist.
     */
    protected abstract read(userId: string): Promise<UserData | undefined>;

    /**
     * Writes the data of a new or already registered user with the specified identification.
     * @param userId The user identification.
     * @param data The user data.
     */
    protected abstract write(userId: string, data: UserData): Promise<void>;

    /**
     * Deletes the user with the specified identification.
     * @param userId The user identification.
     * @returns `true` if the specified user was successfully deleted; otherwise, `false`.
     */
    protected abstract delete(userId: string): Promise<boolean>;

    protected override getPublicKey(): Promise<string> {
        return Promise.resolve(this.publicKey);
    }

    protected override async refreshToken(refresh_token: string): Promise<RefreshTokenResponse> {
        const payload = jwt.decode(refresh_token, { json: true })!;
        const user: User = {
            id: payload.email,
            name: payload.name,
            role: 'editor',
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

    private createAccessToken(user: User): string {
        return jwt.sign({ email: user.id, name: user.name }, this.privateKey, {
            issuer: this.variable.IDENTITY_PROVIDER,
            audience: this.variable.CLIENT_ID,
            subject: user.id,
            expiresIn: 5 * 60,
            algorithm: this.algorithm,
        });
    }

    private createRefreshToken(user: User): string {
        return jwt.sign({ email: user.id, name: user.name }, this.privateKey, {
            issuer: this.variable.IDENTITY_PROVIDER,
            audience: this.variable.CLIENT_ID,
            subject: user.id,
            expiresIn: 7 * 24 * 60 * 60,
            algorithm: this.algorithm,
        });
    }
}
