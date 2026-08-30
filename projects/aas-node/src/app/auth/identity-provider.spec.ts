/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { describe, afterEach, beforeEach, it, expect, vitest, vi, Mocked } from 'vitest';
import express from 'express';
import { Session, SessionData } from 'express-session';
import bcrypt from 'bcryptjs';
import { UserProfile } from 'aas-core';

import { createSpyObj } from '../../test/mocks.js';
import { IdentityProvider } from './identity-provider.js';
import { Variable } from '../variable.js';
import { COOKIE_STORE, CookieStore } from '../cookie-storage/cookie-store.js';
import { USER_STORE, UserData, UserStore } from './user-store.js';
import { USER_RIGHTS_STORE, UserRightsStore } from './user-rights-store.js';
import { container } from 'tsyringe';
import { Logger, LOGGER } from 'aas-package';

describe('FileSystemIdentityProvider', () => {
    let identityProvider: IdentityProvider;
    let variable: Mocked<Variable>;
    let cookies: Mocked<CookieStore>;
    let userStore: Mocked<UserStore>;
    let userRightsStore: Mocked<UserRightsStore>;

    const createUserData = async (id = 'john.doe@email.com', password = 'password123'): Promise<UserData> => ({
        id,
        name: 'John Doe',
        password: await bcrypt.hash(password, 10),
        created: new Date(),
    });

    const createSessionMock = (data: Partial<SessionData> = {}): Mocked<Session & SessionData> => {
        const session = createSpyObj<Session & SessionData>(['destroy', 'save'], data as SessionData);
        session.save.mockImplementation(callback => {
            if (callback) {
                callback(undefined);
            }

            return session;
        });

        session.destroy.mockImplementation(callback => {
            callback(undefined);
            return session;
        });

        return session;
    };

    beforeEach(() => {
        variable = createSpyObj<Variable>([], {
            IDENTITY_PROVIDER: 'file:///users',
            CLIENT_ID: 'test-client-id',
            CLIENT_SECRET: 'test-client-secret',
            REDIRECT_URI: 'http://localhost/callback',
            HOST_URL: 'http://localhost',
        });

        cookies = createSpyObj<CookieStore>(['getCookie', 'setCookie', 'getEndpoints', 'updatesEndpoints']);

        container.clearInstances();
        container.registerInstance(Variable, variable);
        container.registerInstance(LOGGER, createSpyObj<Logger>(['info', 'warning', 'error']));
        container.registerInstance(COOKIE_STORE, cookies);
        container.registerInstance(USER_STORE, createSpyObj<UserStore>(['get', 'set', 'delete']));
        container.registerInstance(
            USER_RIGHTS_STORE,
            createSpyObj<UserRightsStore>(['get', 'add', 'update', 'delete']),
        );

        container.registerSingleton(IdentityProvider);
        identityProvider = container.resolve(IdentityProvider);
        userStore = container.resolve(USER_STORE) as Mocked<UserStore>;
        userRightsStore = container.resolve(USER_RIGHTS_STORE) as Mocked<UserRightsStore>;
    });

    afterEach(() => {
        vitest.restoreAllMocks();
    });

    it('should create', () => {
        expect(identityProvider).toBeInstanceOf(IdentityProvider);
    });

    describe('middleware', () => {
        it('should return a middleware function', () => {
            const middleware = identityProvider.middleware();
            expect(typeof middleware).toBe('function');
        });
    });

    describe('login', () => {
        it('should login a registered user', async () => {
            const session = createSessionMock();
            identityProvider['saveSession'] = vi.fn(() => Promise.resolve());
            const req = createSpyObj<express.Request>([], { session });
            const res = createSpyObj<express.Response>(['cookie', 'json', 'redirect', 'status', 'sendStatus']);
            await identityProvider.login(req, res);
            expect(res.redirect).toHaveBeenCalled();
        });
    });

    describe('callback', () => {
        it('should handle callback', async () => {
            const session = createSessionMock({
                state: 'test-state',
                code_verifier: 'test-code-verifier',
            });

            session.save = vi.fn().mockImplementation(callback => {
                callback?.();
            });

            const req = createSpyObj<express.Request>([], {
                query: {
                    state: 'test-state',
                    client_id: 'test-client-id',
                    code_challenge: 'test-code-challenge',
                    code_challenge_method: 'S256',
                },
                body: {
                    id: 'john.doe@email.com',
                    password: 'password123',
                },
                session,
            });

            userStore.get.mockResolvedValue(await createUserData());
            userRightsStore.get.mockResolvedValue({ id: 'john.doe@email.com', role: 'user' });
            const res = createSpyObj<express.Response>(['cookie', 'json', 'redirect', 'status', 'sendStatus']);
            identityProvider['isValidCodeChallenge'] = vi.fn().mockReturnValue(true);
            await identityProvider.callback(req, res);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: 'john.doe@email.com',
                    name: 'John Doe',
                    role: 'user',
                    client_id: 'test-client-id',
                }),
            );
        });

        it('should return 400 if state is invalid', async () => {
            const session = createSessionMock({
                state: 'test-state',
            });

            const req = createSpyObj<express.Request>([], {
                query: {
                    state: 'invalid-state',
                    client_id: 'test-client-id',
                    code_challenge: 'test-code-challenge',
                    code_challenge_method: 'S256',
                },
                body: {
                    id: 'john.doe@email.com',
                    password: 'password123',
                },
                session,
            });

            const res = createSpyObj<express.Response>(['cookie', 'json', 'status']);
            res.status.mockReturnThis();
            await identityProvider.callback(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should return 401 if credentials are invalid', async () => {
            const session = createSessionMock({
                state: 'test-state',
                code_verifier: 'test-code-verifier',
            });

            const req = createSpyObj<express.Request>([], {
                query: {
                    state: 'test-state',
                    client_id: 'test-client-id',
                    code_challenge: 'test-code-challenge',
                    code_challenge_method: 'S256',
                },
                body: {
                    id: 'john.doe@email.com',
                    password: 'wrong-password',
                },
                session,
            });

            const res = createSpyObj<express.Response>(['cookie', 'json', 'status']);
            identityProvider['isValidCodeChallenge'] = vi.fn().mockReturnValue(true);
            res.status.mockReturnThis();
            await identityProvider.callback(req, res);
            expect(res.status).toHaveBeenCalledWith(401);
        });

        it('should return 400 if code challenge is invalid', async () => {
            const session = createSessionMock({
                state: 'test-state',
                code_verifier: 'test-code-verifier',
            });

            const req = createSpyObj<express.Request>([], {
                query: {
                    state: 'test-state',
                    client_id: 'test-client-id',
                    code_challenge: 'invalid-code-challenge',
                    code_challenge_method: 'S256',
                },
                body: {
                    id: 'john.doe@email.com',
                    password: 'password123',
                },
                session,
            });

            const res = createSpyObj<express.Response>(['cookie', 'json', 'status']);
            identityProvider['isValidCodeChallenge'] = vi.fn().mockReturnValue(false);
            res.status.mockReturnThis();
            await identityProvider.callback(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('logout', () => {
        it('should logout a user', async () => {
            const session = createSessionMock();
            session.access_token = 'test-access-token';
            session.refresh_token = 'test-refresh-token';
            const req = createSpyObj<express.Request>([], { session });
            const res = createSpyObj<express.Response>(['clearCookie', 'sendStatus']);
            identityProvider['destroySession'] = vi.fn(() => Promise.resolve());
            await identityProvider.logout(req, res);
            expect(identityProvider['destroySession']).toHaveBeenCalled();
        });
    });

    describe('middleware', () => {
        it('set request user', async () => {
            const session = createSessionMock();
            session.access_token = 'test-access-token';
            session.refresh_token = 'test-refresh-token';
            const req = createSpyObj<express.Request>([], {
                session,
                user: { id: 'john.doe@email.com', name: 'John Doe', role: 'user', client_id: 'test-client-id' },
            });

            const res = createSpyObj<express.Response>(['clearCookie', 'setHeader']);
            identityProvider['verifyAccessToken'] = vi
                .fn()
                .mockResolvedValue({ email: 'john.doe@email.com', name: 'John Doe' });

            cookies.getEndpoints.mockResolvedValue([]);

            const next = vi.fn();
            const middleware = identityProvider.middleware();
            await middleware(req, res, next);
            expect(next).toHaveBeenCalled();
            expect(identityProvider['verifyAccessToken']).toHaveBeenCalledWith('test-access-token');
            expect(req.user).toEqual({
                id: 'john.doe@email.com',
                name: 'John Doe',
                role: 'user',
                client_id: 'test-client-id',
            });
        });

        it('refresh expired access token', async () => {
            const session = createSessionMock();
            session.access_token = 'expired-access-token';
            session.refresh_token = 'test-refresh-token';
            const req = createSpyObj<express.Request>([], {
                session,
                user: { id: 'john.doe@email.com', name: 'John Doe', role: 'user', client_id: 'test-client-id' },
            });

            const res = createSpyObj<express.Response>(['clearCookie', 'cookie', 'redirect', 'setHeader']);
            identityProvider['verifyAccessToken'] = vi.fn().mockRejectedValue({ name: 'TokenExpiredError' });
            identityProvider['refreshToken'] = vi.fn().mockResolvedValue({
                access_token: 'new-access-token',
                refresh_token: 'test-refresh-token',
                user: { id: 'john.doe@email.com', name: 'John Doe', role: 'user', client_id: 'test-client-id' },
            });

            const next = vi.fn();
            const middleware = identityProvider.middleware();
            await middleware(req, res, next);
            expect(identityProvider['verifyAccessToken']).toHaveBeenCalledWith('expired-access-token');
            expect(identityProvider['refreshToken']).toHaveBeenCalledWith('test-refresh-token');
            expect(req.user).toEqual({
                id: 'john.doe@email.com',
                name: 'John Doe',
                role: 'user',
                client_id: 'test-client-id',
            });

            expect(next).toHaveBeenCalled();
        });

        it('create access token from valid refresh token', async () => {
            const session = createSessionMock();
            session.access_token = 'test-access-token';
            session.refresh_token = 'test-refresh-token';
            const req = createSpyObj<express.Request>([], {
                session,
                user: { id: 'john.doe@email.com', name: 'John Doe', role: 'user', client_id: 'test-client-id' },
            });

            const res = createSpyObj<express.Response>(['clearCookie', 'cookie', 'setHeader']);
            identityProvider['verifyAccessToken'] = vi.fn().mockRejectedValue({ name: 'TokenExpiredError' });
            identityProvider['refreshToken'] = vi.fn().mockResolvedValue({
                access_token: 'new-access-token',
                refresh_token: 'test-refresh-token',
                user: { id: 'john.doe@email.com', name: 'John Doe', role: 'user', client_id: 'test-client-id' },
            });

            const next = vi.fn();
            const middleware = identityProvider.middleware();
            await middleware(req, res, next);
            expect(identityProvider['refreshToken']).toHaveBeenCalledWith('test-refresh-token');
            expect(req.user).toEqual({
                id: 'john.doe@email.com',
                name: 'John Doe',
                role: 'user',
                client_id: 'test-client-id',
            });

            expect(next).toHaveBeenCalled();
        });

        it('clear session if token is invalid', async () => {
            const session = createSessionMock();
            session.access_token = 'invalid-access-token';
            session.refresh_token = 'test-refresh-token';
            const req = createSpyObj<express.Request>([], {
                session,
            });

            const res = createSpyObj<express.Response>(['clearCookie', 'redirect', 'setHeader']);
            identityProvider['verifyAccessToken'] = vi.fn().mockRejectedValue({ name: 'JsonWebTokenError' });

            const next = vi.fn();
            identityProvider['destroySession'] = vi.fn(() => Promise.resolve());
            const middleware = identityProvider.middleware();
            await middleware(req, res, next);
            expect(identityProvider['verifyAccessToken']).toHaveBeenCalledWith('invalid-access-token');
            expect(identityProvider['destroySession']).toHaveBeenCalledWith(session);
            expect(res.redirect).toHaveBeenCalledWith('/auth/login');
        });
    });

    describe('updateAccount', () => {
        it('should update account', async () => {
            const session = createSessionMock();
            const req = createSpyObj<express.Request>([], {
                session,
                user: { id: 'john.doe@email.com', name: 'John Doe', role: 'user', client_id: 'test-client-id' },
                body: {
                    name: 'John Doe Updated',
                    id: 'john.doe@email.com',
                    password: 'password123',
                    newPassword: 'new-password',
                } satisfies UserProfile,
            });

            userStore.get.mockResolvedValue(await createUserData());

            userRightsStore.get.mockResolvedValue({ id: 'john.doe@email.com', role: 'user' });

            const res = createSpyObj<express.Response>(['json', 'status']);
            res.status.mockReturnThis();
            await identityProvider.updateAccount(req, res);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: 'john.doe@email.com',
                    name: 'John Doe Updated',
                    role: 'user',
                    client_id: 'test-client-id',
                }),
            );
        });

        it('should return 404 if user does not exist', async () => {
            const session = createSessionMock();
            const req = createSpyObj<express.Request>([], {
                session,
                user: { id: 'john.doe@email.com', name: 'John Doe', role: 'user', client_id: 'test-client-id' },
                body: {
                    name: 'John Doe Updated',
                    id: 'john.doe@email.com',
                    password: 'password123',
                    newPassword: 'new-password',
                } satisfies UserProfile,
            });

            const res = createSpyObj<express.Response>(['json', 'status']);
            res.status.mockReturnThis();
            userStore.get.mockResolvedValue(undefined);
            await identityProvider.updateAccount(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('should return 401 if user is not logged in', async () => {
            const session = createSessionMock();
            const req = createSpyObj<express.Request>([], {
                session,
                user: undefined,
                body: {
                    name: 'John Doe Updated',
                    id: 'john.doe@email.com',
                    password: 'password123',
                    newPassword: 'new-password',
                } satisfies UserProfile,
            });

            const res = createSpyObj<express.Response>(['json', 'status']);
            res.status.mockReturnThis();
            await identityProvider.updateAccount(req, res);
            expect(res.status).toHaveBeenCalledWith(401);
        });

        it('should return 401 if password is incorrect', async () => {
            const session = createSessionMock();
            const req = createSpyObj<express.Request>([], {
                session,
                user: { id: 'john.doe@email.com', name: 'John Doe', role: 'user', client_id: 'test-client-id' },
                body: {
                    name: 'John Doe Updated',
                    id: 'john.doe@email.com',
                    password: 'wrong-password',
                    newPassword: 'new-password',
                } satisfies UserProfile,
            });

            const res = createSpyObj<express.Response>(['json', 'status']);
            res.status.mockReturnThis();
            userStore.get.mockResolvedValue(await createUserData());
            await identityProvider.updateAccount(req, res);
            expect(res.status).toHaveBeenCalledWith(401);
        });

        it('should return 400 if new password is invalid', async () => {
            const session = createSessionMock();
            const req = createSpyObj<express.Request>([], {
                session,
                user: { id: 'john.doe@email.com', name: 'John Doe', role: 'user', client_id: 'test-client-id' },
                body: {
                    name: 'John Doe Updated',
                    id: 'john.doe@email.com',
                    password: 'password123',
                    newPassword: 'short',
                } satisfies UserProfile,
            });

            const res = createSpyObj<express.Response>(['json', 'status']);
            res.status.mockReturnThis();
            userStore.get.mockResolvedValue(await createUserData());
            await identityProvider.updateAccount(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('deleteAccount', () => {
        it('should delete account', async () => {
            const session = createSessionMock();
            const req = createSpyObj<express.Request>([], {
                session,
                user: { id: 'john.doe@email.com', name: 'John Doe', role: 'user', client_id: 'test-client-id' },
            });

            const res = createSpyObj<express.Response>(['clearCookie', 'sendStatus', 'status']);
            userStore.delete.mockResolvedValue(true);
            await identityProvider.deleteAccount(req, res);
            expect(res.sendStatus).toHaveBeenCalledWith(200);
        });

        it('should return 404 if user does not exist', async () => {
            const session = createSessionMock();
            const req = createSpyObj<express.Request>([], {
                session,
                user: { id: 'john.doe@email.com', name: 'John Doe', role: 'user', client_id: 'test-client-id' },
            });

            const res = createSpyObj<express.Response>(['json', 'status']);
            res.status.mockReturnThis();
            userStore.delete.mockResolvedValue(false);
            await identityProvider.deleteAccount(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('should return 401 if user is not logged in', async () => {
            const session = createSessionMock();
            const req = createSpyObj<express.Request>([], {
                session,
                user: undefined,
            });

            const res = createSpyObj<express.Response>(['json', 'status']);
            res.status.mockReturnThis();
            await identityProvider.deleteAccount(req, res);
            expect(res.status).toHaveBeenCalledWith(401);
        });
    });
});
