/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { container } from 'tsyringe';
import express, { Express, json, urlencoded } from 'express';
import morgan from 'morgan';
import request from 'supertest';
import { AuthResult, Cookie, Credentials } from 'common';
import { describe, beforeEach, it, expect, jest } from '@jest/globals';

import { AuthService } from '../../app/auth/auth-service.js';
import { createSpyObj } from '../utils.js';
import { getToken, guestPayload } from '../assets/json-web-token.js';
import { RegisterRoutes } from '../../app/routes/routes.js';
import { Logger } from '../../app/logging/logger.js';
import { Variable } from '../../app/variable.js';
import { Authentication } from '../../app/controller/authentication.js';
import { errorHandler } from '../assets/error-handler.js';

describe('AuthController', function () {
    let app: Express;
    let auth: jest.Mocked<AuthService>;
    let logger: Logger;
    let variable: jest.Mocked<Variable>;
    let authentication: jest.Mocked<Authentication>;

    beforeEach(function () {
        logger = createSpyObj<Logger>(['error', 'warning', 'info', 'debug', 'start', 'stop']);
        variable = createSpyObj<Variable>({}, { JWT_SECRET: 'SecretSecretSecretSecretSecretSecret' });
        auth = createSpyObj<AuthService>([
            'hasUserAsync',
            'loginAsync',
            'getCookieAsync',
            'getCookiesAsync',
            'setCookieAsync',
            'deleteCookieAsync',
        ]);

        authentication = createSpyObj<Authentication>(['checkAsync']);
        authentication.checkAsync.mockResolvedValue(guestPayload);

        container.registerInstance(AuthService, auth);
        container.registerInstance('Logger', logger);
        container.registerInstance(Variable, variable);
        container.registerInstance(Authentication, authentication);

        app = express();
        app.use(json());
        app.use(urlencoded({ extended: true }));
        app.use(morgan('dev'));
        app.set('trust proxy', 1);

        RegisterRoutes(app);
        app.use(errorHandler);
    });

    describe('guest', function () {
        it('creates a guest account', async function () {
            const token = getToken();
            auth.loginAsync.mockReturnValue(new Promise<AuthResult>(resolve => resolve({ token })));

            const response = await request(app).post('/api/v1/guest');

            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual({ token } as AuthResult);
        });
    });

    describe('login', function () {
        it('login a registered user', async function () {
            const token = getToken('John');
            auth.loginAsync.mockReturnValue(new Promise<AuthResult>(resolve => resolve({ token })));

            const response = await request(app)
                .post('/api/v1/login')
                .send({ id: 'john.doe@email.com', password: '1234.xyz' } as Credentials);

            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual({ token } as AuthResult);
        });
    });

    describe('getCookie', function () {
        it('GET /api/v1/users/am9obi5kb2VAZW1haWwuY29t/cookies/Cookie1', async function () {
            auth.hasUserAsync.mockReturnValue(new Promise<boolean>(resolve => resolve(true)));
            auth.getCookieAsync.mockReturnValue(
                new Promise<Cookie>(resolve => resolve({ name: 'Cookie1', data: 'Hello World!' })),
            );

            const response = await request(app)
                .get('/api/v1/users/am9obi5kb2VAZW1haWwuY29t/cookies/Cookie1')
                .set('Authorization', `Bearer ${getToken('John')}`);

            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual({ name: 'Cookie1', data: 'Hello World!' });
        });

        // it('Unauthenticated user: GET /api/v1/users/am9obi5kb2VAZW1haWwuY29t/cookies/Cookie1', async function () {
        //     authentication.checkAsync.mockReturnValue(new Promise((_, reject) => reject(
        //         new ApplicationError(ERRORS.UnauthorizedAccess, ERRORS.UnauthorizedAccess))));

        //     const response = await request(app).get('/api/v1/users/am9obi5kb2VAZW1haWwuY29t/cookies/Cookie1');
        //     expect(response.statusCode).toBe(401);
        // });
    });

    describe('getCookies', function () {
        it('GET /api/v1/users/am9obi5kb2VAZW1haWwuY29t/cookies', async function () {
            auth.hasUserAsync.mockReturnValue(new Promise<boolean>(resolve => resolve(true)));
            auth.getCookiesAsync.mockReturnValue(
                new Promise<Cookie[]>(resolve =>
                    resolve([
                        { name: 'Cookie1', data: 'Hello World!' },
                        { name: 'Cookie2', data: '42' },
                    ]),
                ),
            );

            const response = await request(app)
                .get('/api/v1/users/am9obi5kb2VAZW1haWwuY29t/cookies')
                .set('Authorization', `Bearer ${getToken('John')}`);

            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual([
                { name: 'Cookie1', data: 'Hello World!' },
                { name: 'Cookie2', data: '42' },
            ]);
        });

        // it('Unauthenticated user: GET /api/v1/users/am9obi5kb2VAZW1haWwuY29t/cookies', async function () {
        //     authentication.checkAsync.mockReturnValue(
        //         Promise.reject(new ApplicationError(ERRORS.UnauthorizedAccess, ERRORS.UnauthorizedAccess)));

        //     const response = await request(app).get('/api/v1/users/am9obi5kb2VAZW1haWwuY29t/cookies');
        //     expect(response.statusCode).toBe(401);
        // });
    });

    describe('setCookie', function () {
        it('POST /api/v1/users/am9obi5kb2VAZW1haWwuY29t/cookies/Cookie1', async function () {
            auth.hasUserAsync.mockReturnValue(new Promise<boolean>(resolve => resolve(true)));
            const response = await request(app)
                .post('/api/v1/users/am9obi5kb2VAZW1haWwuY29t/cookies/Cookie1')
                .send({ name: 'Cookie1', data: 'Hello World!' } as Cookie)
                .set('Authorization', `Bearer ${getToken('John')}`)
                .set('Accept', 'application/json');

            expect(response.statusCode).toBe(204);
            expect(auth.setCookieAsync).toHaveBeenCalled();
        });

        // it('Unauthenticated user: POST /api/v1/users/am9obi5kb2VAZW1haWwuY29t/cookies/Cookie1', async function () {
        //     authentication.checkAsync.mockReturnValue(
        //         Promise.reject(new ApplicationError(ERRORS.UnauthorizedAccess, ERRORS.UnauthorizedAccess)));

        //     const response = await request(app)
        //         .post('/api/v1/users/am9obi5kb2VAZW1haWwuY29t/cookies/Cookie1')
        //         .send({ name: 'Cookie1', data: 'Hello World!' } as Cookie)
        //         .set('Accept', 'application/json');

        //     expect(response.statusCode).toBe(401);
        // });
    });

    describe('deleteCookie', function () {
        it('DELETE /api/v1/users/am9obi5kb2VAZW1haWwuY29t/cookies/Cookie1', async function () {
            auth.hasUserAsync.mockReturnValue(new Promise<boolean>(resolve => resolve(true)));
            const response = await request(app)
                .delete('/api/v1/users/am9obi5kb2VAZW1haWwuY29t/cookies/Cookie1')
                .set('Authorization', `Bearer ${getToken('John')}`);

            expect(response.statusCode).toBe(204);
            expect(auth.deleteCookieAsync).toHaveBeenCalled();
        });

        // it('Unauthenticated user: DELETE /api/v1/users/am9obi5kb2VAZW1haWwuY29t/cookies/Cookie1', async function () {
        //     authentication.checkAsync.mockReturnValue(
        //         Promise.reject(new ApplicationError(ERRORS.UnauthorizedAccess, ERRORS.UnauthorizedAccess)));

        //     const response = await request(app).delete('/api/v1/users/am9obi5kb2VAZW1haWwuY29t/cookies/Cookie1');
        //     expect(response.statusCode).toBe(401);
        // });
    });
});
