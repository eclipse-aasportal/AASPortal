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
import { Logger } from 'aas-package';

import { createSpyObj } from '../mocks.js';
import { FileSystemIdentityProvider } from '../../app/auth/file-system-identity-provider.js';
import { IdentityProvider, UserData } from '../../app/auth/identity-provider.js';
import { Variable } from '../../app/variable.js';

vi.mock('fs', () => {
    const fs = vi.importActual('fs');
    return {
        default: {
            ...fs,
            promises: {
                readFile: vi.fn().mockResolvedValue(
                    JSON.stringify({
                        id: 'john.doe@email.com',
                        name: 'John Doe',
                        role: 'editor',
                        created: new Date(),
                        lastLoggedIn: new Date(),
                        password: '$2b$10$vInNMtSyK./X7OVfPHP4Fuuv/oA9bJEQQfZq2hQu/YMTxQUs7otGu',
                    } satisfies UserData),
                ),
                writeFile: vi.fn(),
                mkdir: vi.fn(),
                rm: vi.fn(),
            },
            existsSync: vi.fn().mockReturnValue(true),
        },
    };
});

describe('FileSystemIdentityProvider', () => {
    let identityProvider: IdentityProvider;
    let variable: Mocked<Variable>;

    beforeEach(() => {
        variable = createSpyObj<Variable>([], {
            IDENTITY_PROVIDER: 'file:///users',
            CLIENT_ID: 'test-client-id',
            CLIENT_SECRET: 'test-client-secret',
            REDIRECT_URI: 'http://localhost/callback',
        });

        identityProvider = new FileSystemIdentityProvider(createSpyObj<Logger>(['error']), variable);
    });

    afterEach(() => {
        vitest.restoreAllMocks();
    });

    it('should create', () => {
        expect(identityProvider).toBeInstanceOf(FileSystemIdentityProvider);
    });

    describe('middleware', () => {
        it('should return a middleware function', () => {
            const middleware = identityProvider.middleware();
            expect(typeof middleware).toBe('function');
        });
    });

    describe('login', () => {
        it('should login a registered user', async () => {
            const session = createSpyObj<Session & SessionData>(['destroy', 'save'], {});
            identityProvider['saveSession'] = vi.fn(() => Promise.resolve());
            const req = createSpyObj<express.Request>([], { session });
            const res = createSpyObj<express.Response>(['cookie', 'json', 'redirect', 'status', 'sendStatus']);
            await identityProvider.login(req, res);
            expect(res.redirect).toHaveBeenCalled();
        });
    });

    describe('callback', () => {
        it('should handle callback', async () => {
            const session = createSpyObj<Session & SessionData>(['destroy', 'save'], {
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
                    password: 'password123',
                },
                session,
            });

            const res = createSpyObj<express.Response>(['cookie', 'json', 'redirect', 'status', 'sendStatus']);
            identityProvider['isValidCodeChallenge'] = vi.fn().mockReturnValue(true);
            await identityProvider.callback(req, res);
            expect(res.json).toHaveBeenCalledWith({ id: 'john.doe@email.com', name: 'John Doe', role: 'editor' });
        });

        it('should return 400 if state is invalid', async () => {
            const session = createSpyObj<Session & SessionData>(['destroy', 'save'], {
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
            const session = createSpyObj<Session & SessionData>(['destroy', 'save'], {
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
            const session = createSpyObj<Session & SessionData>(['destroy', 'save'], {
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
            const session = createSpyObj<Session & SessionData>(['destroy', 'save'], {});
            const req = createSpyObj<express.Request>([], { session });
            const res = createSpyObj<express.Response>(['clearCookie', 'sendStatus']);
            identityProvider['destroySession'] = vi.fn(() => Promise.resolve());
            await identityProvider.logout(req, res);
            expect(res.clearCookie).toHaveBeenCalledWith('access_token');
            expect(res.clearCookie).toHaveBeenCalledWith('refresh_token');
            expect(identityProvider['destroySession']).toHaveBeenCalled();
        });
    });

    describe('middleware', () => {
        it('set request user', async () => {
            const session = createSpyObj<Session & SessionData>(['destroy', 'save'], {});
            const req = createSpyObj<express.Request>([], {
                session,
                user: { id: 'john.doe@email.com', name: 'John Doe', role: 'editor' },
                cookies: { access_token: 'test-access-token', refresh_token: 'test-refresh-token' },
            });

            const res = createSpyObj<express.Response>(['clearCookie', 'setHeader']);
            identityProvider['verifyAccessToken'] = vi
                .fn()
                .mockResolvedValue({ email: 'john.doe@email.com', name: 'John Doe' });

            const next = vi.fn();
            const middleware = identityProvider.middleware();
            await middleware(req, res, next);
            expect(next).toHaveBeenCalled();
            expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Credentials', 'true');
            expect(identityProvider['verifyAccessToken']).toHaveBeenCalledWith('test-access-token');
            expect(req.user).toEqual({ id: 'john.doe@email.com', name: 'John Doe', role: 'editor' });
        });

        it('refresh expired access token', async () => {
            const session = createSpyObj<Session & SessionData>(['destroy', 'save'], {});
            const req = createSpyObj<express.Request>([], {
                session,
                user: { id: 'john.doe@email.com', name: 'John Doe', role: 'editor' },
                cookies: { access_token: 'expired-access-token', refresh_token: 'test-refresh-token' },
            });

            const res = createSpyObj<express.Response>(['clearCookie', 'cookie', 'redirect', 'setHeader']);
            identityProvider['verifyAccessToken'] = vi.fn().mockRejectedValue({ name: 'TokenExpiredError' });
            identityProvider['refreshToken'] = vi.fn().mockResolvedValue({
                access_token: 'new-access-token',
                refresh_token: 'test-refresh-token',
                user: { id: 'john.doe@email.com', name: 'John Doe', role: 'editor' },
            });

            const next = vi.fn();
            const middleware = identityProvider.middleware();
            await middleware(req, res, next);
            expect(identityProvider['verifyAccessToken']).toHaveBeenCalledWith('expired-access-token');
            expect(identityProvider['refreshToken']).toHaveBeenCalledWith('test-refresh-token');
            expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Credentials', 'true');
            expect(req.user).toEqual({ id: 'john.doe@email.com', name: 'John Doe', role: 'editor' });
            expect(next).toHaveBeenCalled();
        });

        it('create access token from valid refresh token', async () => {
            const session = createSpyObj<Session & SessionData>(['destroy', 'save'], {});
            const req = createSpyObj<express.Request>([], {
                session,
                user: { id: 'john.doe@email.com', name: 'John Doe', role: 'editor' },
                cookies: { refresh_token: 'test-refresh-token' },
            });

            const res = createSpyObj<express.Response>(['clearCookie', 'cookie', 'setHeader']);
            identityProvider['verifyAccessToken'] = vi.fn().mockRejectedValue({ name: 'TokenExpiredError' });
            identityProvider['refreshToken'] = vi.fn().mockResolvedValue({
                access_token: 'new-access-token',
                refresh_token: 'test-refresh-token',
                user: { id: 'john.doe@email.com', name: 'John Doe', role: 'editor' },
            });

            const next = vi.fn();
            const middleware = identityProvider.middleware();
            await middleware(req, res, next);
            expect(identityProvider['refreshToken']).toHaveBeenCalledWith('test-refresh-token');
            expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Credentials', 'true');
            expect(req.user).toEqual({ id: 'john.doe@email.com', name: 'John Doe', role: 'editor' });
            expect(next).toHaveBeenCalled();
        });

        it('clear cookies if token is invalid', async () => {
            const session = createSpyObj<Session & SessionData>(['destroy', 'save'], {});
            const req = createSpyObj<express.Request>([], {
                session,
                cookies: { access_token: 'invalid-access-token', refresh_token: 'test-refresh-token' },
            });

            const res = createSpyObj<express.Response>(['clearCookie', 'redirect', 'setHeader']);
            identityProvider['verifyAccessToken'] = vi.fn().mockRejectedValue({ name: 'JsonWebTokenError' });

            const next = vi.fn();
            const middleware = identityProvider.middleware();
            await middleware(req, res, next);
            expect(identityProvider['verifyAccessToken']).toHaveBeenCalledWith('invalid-access-token');
            expect(res.clearCookie).toHaveBeenCalledWith('access_token');
            expect(res.clearCookie).toHaveBeenCalledWith('refresh_token');
            expect(res.redirect).toHaveBeenCalledWith('/api/login');
        });
    });
});
