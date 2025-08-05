/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { container } from 'tsyringe';
import express, { Express, json, urlencoded } from 'express';
import morgan from 'morgan';
import request from 'supertest';
import { ApplicationError, AuthResult, Cookie, Credentials } from 'aas-core';
import { describe, beforeEach, it, expect, jest } from '@jest/globals';

import { createSpyObj } from 'aas-jest';
import { AuthService } from '../../app/auth/auth-service.js';
import { editorPayload, getToken } from '../assets/json-web-token.js';
import { RegisterRoutes } from '../../app/routes/routes.js';
import { LOGGER, Logger } from '../../app/logging/logger.js';
import { Variable } from '../../app/variable.js';
import { Authentication } from '../../app/controller/authentication.js';
import { errorHandler } from '../assets/error-handler.js';
import { ERRORS } from '../../app/errors.js';

describe('AuthController', () => {
    let app: Express;
    let auth: jest.Mocked<AuthService>;
    let logger: Logger;
    let variable: jest.Mocked<Variable>;
    let authentication: jest.Mocked<Authentication>;

    beforeEach(() => {
        logger = createSpyObj<Logger>(['error', 'warning', 'info']);
        variable = createSpyObj<Variable>({}, { JWT_SECRET: 'SecretSecretSecretSecretSecretSecret' });
        auth = createSpyObj<AuthService>([
            'deleteCookie',
            'getCookie',
            'getCookies',
            'getProfile',
            'hasUser',
            'login',
            'registerUser',
            'resetPassword',
            'setCookie',
        ]);

        authentication = createSpyObj<Authentication>(['check']);

        container.reset();
        container.registerInstance(AuthService, auth);
        container.registerInstance(LOGGER, logger);
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

    describe('login', () => {
        it('login a registered user', async () => {
            const token = getToken('John');
            auth.login.mockResolvedValueOnce({ token });

            const response = await request(app)
                .post('/api/v1/login')
                .send({ id: 'john.doe@email.com', password: '1234.xyz' } as Credentials);

            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual({ token } as AuthResult);
        });
    });

    describe('getCookie', () => {
        it('GET /api/v1/users/am9obi5kb2VAZW1haWwuY29t/cookies/Cookie1', async () => {
            authentication.check.mockResolvedValueOnce(editorPayload);
            auth.hasUser.mockResolvedValueOnce(true);
            auth.getCookie.mockResolvedValueOnce({ name: 'Cookie1', data: 'Hello World!' });

            const response = await request(app)
                .get('/api/v1/users/am9obi5kb2VAZW1haWwuY29t/cookies/Cookie1')
                .set('Authorization', `Bearer ${getToken('John')}`);

            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual({ name: 'Cookie1', data: 'Hello World!' });
        });

        it.skip('Unauthenticated user: GET /api/v1/users/am9obi5kb2VAZW1haWwuY29t/cookies/Cookie1', async () => {
            authentication.check.mockRejectedValueOnce(
                new ApplicationError(ERRORS.UnauthorizedAccess, ERRORS.UnauthorizedAccess),
            );

            const response = await request(app).get('/api/v1/users/am9obi5kb2VAZW1haWwuY29t/cookies/Cookie1');
            expect(response.statusCode).toBe(401);
        });
    });

    describe('getCookies', () => {
        it('GET /api/v1/users/am9obi5kb2VAZW1haWwuY29t/cookies', async () => {
            authentication.check.mockResolvedValueOnce(editorPayload);
            auth.hasUser.mockResolvedValueOnce(true);
            auth.getCookies.mockResolvedValueOnce([
                { name: 'Cookie1', data: 'Hello World!' },
                { name: 'Cookie2', data: '42' },
            ]);

            const response = await request(app)
                .get('/api/v1/users/am9obi5kb2VAZW1haWwuY29t/cookies')
                .set('Authorization', `Bearer ${getToken('John')}`);

            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual([
                { name: 'Cookie1', data: 'Hello World!' },
                { name: 'Cookie2', data: '42' },
            ]);
        });

        it.skip('Unauthenticated user: GET /api/v1/users/am9obi5kb2VAZW1haWwuY29t/cookies', async () => {
            authentication.check.mockRejectedValueOnce(
                new ApplicationError(ERRORS.UnauthorizedAccess, ERRORS.UnauthorizedAccess),
            );

            const response = await request(app).get('/api/v1/users/am9obi5kb2VAZW1haWwuY29t/cookies');
            expect(response.statusCode).toBe(401);
        });
    });

    describe('setCookie', () => {
        it('POST /api/v1/users/am9obi5kb2VAZW1haWwuY29t/cookies/Cookie1', async () => {
            authentication.check.mockResolvedValueOnce(editorPayload);
            auth.hasUser.mockResolvedValueOnce(true);
            const response = await request(app)
                .post('/api/v1/users/am9obi5kb2VAZW1haWwuY29t/cookies/Cookie1')
                .send({ name: 'Cookie1', data: 'Hello World!' } as Cookie)
                .set('Authorization', `Bearer ${getToken('John')}`)
                .set('Accept', 'application/json');

            expect(response.statusCode).toBe(204);
            expect(auth.setCookie).toHaveBeenCalled();
        });

        it.skip('Unauthenticated user: POST /api/v1/users/am9obi5kb2VAZW1haWwuY29t/cookies/Cookie1', async () => {
            authentication.check.mockRejectedValueOnce(
                new ApplicationError(ERRORS.UnauthorizedAccess, ERRORS.UnauthorizedAccess),
            );

            const response = await request(app)
                .post('/api/v1/users/am9obi5kb2VAZW1haWwuY29t/cookies/Cookie1')
                .send({ name: 'Cookie1', data: 'Hello World!' } as Cookie)
                .set('Accept', 'application/json');

            expect(response.statusCode).toBe(401);
        });
    });

    describe('deleteCookie', () => {
        it('DELETE /api/v1/users/am9obi5kb2VAZW1haWwuY29t/cookies/Cookie1', async () => {
            authentication.check.mockResolvedValueOnce(editorPayload);
            auth.hasUser.mockResolvedValueOnce(true);
            const response = await request(app)
                .delete('/api/v1/users/am9obi5kb2VAZW1haWwuY29t/cookies/Cookie1')
                .set('Authorization', `Bearer ${getToken('John')}`);

            expect(response.statusCode).toBe(204);
            expect(auth.deleteCookie).toHaveBeenCalled();
        });

        it.skip('Unauthenticated user: DELETE /api/v1/users/am9obi5kb2VAZW1haWwuY29t/cookies/Cookie1', async () => {
            authentication.check.mockRejectedValueOnce(
                new ApplicationError(ERRORS.UnauthorizedAccess, ERRORS.UnauthorizedAccess),
            );

            const response = await request(app).delete('/api/v1/users/am9obi5kb2VAZW1haWwuY29t/cookies/Cookie1');
            expect(response.statusCode).toBe(401);
        });
    });

    describe('getProfile', () => {
        it('GET /api/v1/users/am9obi5kb2VAZW1haWwuY29t', async () => {
            authentication.check.mockResolvedValueOnce(editorPayload);
            auth.getProfile.mockResolvedValueOnce({ id: 'john.doe@email.com', name: 'John Doe' });
            const response = await request(app)
                .get('/api/v1/users/am9obi5kb2VAZW1haWwuY29t')
                .set('Authorization', `Bearer ${getToken('John')}`);

            expect(response.statusCode).toBe(200);
            expect(auth.getProfile).toHaveBeenCalled();
        });

        it.skip('Unauthenticated user: GET /api/v1/users/am9obi5kb2VAZW1haWwuY29t', async () => {
            authentication.check.mockRejectedValueOnce(
                new ApplicationError('Unauthorized access.', ERRORS.UnauthorizedAccess),
            );

            const response = await request(app).get('/api/v1/users/am9obi5kb2VAZW1haWwuY29t');
            expect(response.statusCode).toBe(401);
        });
    });
});
