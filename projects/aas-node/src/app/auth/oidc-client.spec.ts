/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { describe, beforeEach, it, expect, Mocked, vi, afterEach } from 'vitest';
import express from 'express';
import { Session, SessionData } from 'express-session';
import { Logger, LOGGER } from 'aas-package';
import { container } from 'tsyringe';

import { AuthorizationServer, OidcClient, TokenEndpointResponse } from './oidc-client.js';
import { Variable } from '../variable.js';
import { createSpyObj } from '../../test/mocks.js';
import { COOKIE_STORE, CookieStore } from '../cookie-storage/cookie-store.js';
import { USER_RIGHTS_STORE, UserRightsStore } from './user-rights-store.js';

describe('OidcClient', () => {
    let identityProvider: OidcClient;
    let variable: Mocked<Variable>;
    let logger: Mocked<Logger>;
    let configuration: Mocked<AuthorizationServer>;
    let cookies: Mocked<CookieStore>;
    let userRightsStore: Mocked<UserRightsStore>;

    beforeEach(() => {
        logger = createSpyObj<Logger>(['error', 'warning', 'info']);
        variable = createSpyObj<Variable>([], {
            IDENTITY_PROVIDER: 'https://example.com',
            CLIENT_ID: 'client-id',
            CLIENT_SECRET: 'client-secret',
            REDIRECT_URI: 'https://localhost/callback',
            HOST_URL: 'https://localhost',
        });

        configuration = createSpyObj<AuthorizationServer>([], {
            issuer: 'https://example.com',
            authorization_endpoint: 'https://example.com/auth',
            token_endpoint: 'https://example.com/token',
            end_session_endpoint: 'https://example.com/logout',
            jwks_uri: 'https://example.com/keys',
            check_session_iframe: 'https://example.com/check_session',
            userinfo_endpoint: 'https://example.com/userinfo',
        });

        cookies = createSpyObj<CookieStore>(['getCookie', 'setCookie', 'getEndpoints']);
        userRightsStore = createSpyObj<UserRightsStore>(['get', 'add', 'update', 'delete']);
        container.clearInstances();
        container.registerInstance(LOGGER, logger);
        container.registerInstance(COOKIE_STORE, cookies);
        container.registerInstance(Variable, variable);
        container.registerInstance(USER_RIGHTS_STORE, userRightsStore);
        container.registerSingleton(OidcClient);
        identityProvider = container.resolve(OidcClient);
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    it('should create', () => {
        expect(identityProvider).toBeInstanceOf(OidcClient);
    });

    describe('login', () => {
        it('should redirect to identity provider', async () => {
            const res = createSpyObj<express.Response>(['redirect', 'status']);
            const session = createSpyObj<Session>(['save'], {});
            session.save = vi.fn().mockImplementation(callback => {
                callback?.();
            });

            const req = createSpyObj<express.Request>([], { protocol: 'https', host: 'localhost', session });
            const response = createSpyObj<Response>(['json'], {
                ok: true,
                status: 200,
                statusText: 'OK',
            });

            response.json.mockResolvedValue(configuration);
            vi.spyOn(global, 'fetch').mockResolvedValue(response);

            await identityProvider.login(req, res);
            expect(req.session.code_verifier).toBeDefined();
            expect(req.session.state).toBeDefined();
            expect(res.redirect).toHaveBeenCalled();
        });

        it('responds with status code 500 if reading configuration failed', async () => {
            const res = createSpyObj<express.Response>(['json', 'status']);
            res.status.mockReturnThis();
            const session = createSpyObj<Session>(['save'], {});
            session.save = vi.fn().mockImplementation(callback => {
                callback?.();
            });

            const req = createSpyObj<express.Request>([], { protocol: 'https', host: 'localhost', session });
            vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Failed to fetch configuration'));

            await identityProvider.login(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalled();
        });
    });

    describe('callback', () => {
        it('should authorize the current user', async () => {
            const res = createSpyObj<express.Response>(['redirect', 'cookie']);
            const session = createSpyObj<Session & SessionData>(['save'], {
                state: 'test-state',
                code_verifier: 'test-code-verifier',
            });

            session.save = vi.fn().mockImplementation(callback => {
                callback?.();
            });

            const req = createSpyObj<express.Request>([], {
                protocol: 'https',
                host: 'localhost',
                session,
                query: { code: 'test-code', state: 'test-state' },
            });

            const configurationResponse = createSpyObj<Response>(['json'], {
                ok: true,
                status: 200,
                statusText: 'OK',
            });

            configurationResponse.json.mockResolvedValue(configuration);

            const tokenResponse = createSpyObj<Response>(['json'], {
                ok: true,
                status: 200,
                statusText: 'OK',
            });

            tokenResponse.json.mockResolvedValue({
                access_token: 'test-access-token',
                refresh_token: 'test-refresh-token',
                token_type: 'access',
                expires_in: 0,
                scope: 'email',
            } satisfies TokenEndpointResponse);

            vi.spyOn(global, 'fetch').mockImplementation(url => {
                if ((url as string).includes('/.well-known/openid-configuration')) {
                    return Promise.resolve(configurationResponse);
                }

                return Promise.resolve(tokenResponse);
            });

            identityProvider['getPublicKey'] = vi.fn(() => Promise.resolve('test-public-key'));

            await identityProvider.callback(req, res);
            expect(req.session.state).toBeUndefined();
            expect(req.session.code_verifier).toBeUndefined();
            expect(req.session.access_token).toBe('test-access-token');
            expect(req.session.refresh_token).toBe('test-refresh-token');
            expect(res.redirect).toHaveBeenCalled();
        });
    });

    describe('logout', () => {
        it('should log out the current user', async () => {
            const res = createSpyObj<express.Response>(['redirect', 'clearCookie', 'sendStatus', 'status']);
            const session = createSpyObj<Session & SessionData>([], {
                state: 'test-state',
                code_verifier: 'test-code-verifier',
                refresh_token: 'test-refresh-token',
            });

            const req = createSpyObj<express.Request>([], {
                protocol: 'https',
                host: 'localhost',
                session,
            });

            const configurationResponse = createSpyObj<Response>(['json'], {
                ok: true,
                status: 200,
                statusText: 'OK',
            });

            configurationResponse.json.mockResolvedValue(configuration);

            const logoutResponse = createSpyObj<Response>([], {
                ok: true,
                status: 200,
                statusText: 'OK',
            });

            vi.spyOn(global, 'fetch').mockImplementation(url => {
                if ((url as string).includes('/.well-known/openid-configuration')) {
                    return Promise.resolve(configurationResponse);
                }

                return Promise.resolve(logoutResponse);
            });

            identityProvider['destroySession'] = vi.fn(() => Promise.resolve());
            await identityProvider.logout(req, res);
            expect(identityProvider['destroySession']).toHaveBeenCalled();
            expect(res.sendStatus).toHaveBeenCalledWith(200);
        });
    });
});
