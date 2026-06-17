/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { container } from 'tsyringe';
import express, { Express, json, urlencoded } from 'express';
import morgan from 'morgan';
import request from 'supertest';
import { Cookie } from 'aas-core';
import { describe, it, expect, Mocked, vi, beforeAll, afterAll } from 'vitest';

import { createSpyObj } from '../mocks.js';
import { RegisterRoutes } from '../../app/routes/routes.js';
import { errorHandler } from '../assets/error-handler.js';
import { COOKIE_STORAGE, CookieStorage } from '../../app/cookie-storage/cookie-storage.js';
import { Authentication } from '../../app/controller/authentication.js';

describe('CookieController', () => {
    let app: Express;
    let storage: Mocked<CookieStorage>;
    let authentication: Mocked<Authentication>;

    beforeAll(() => {
        storage = createSpyObj<CookieStorage>(['deleteCookie', 'getCookie', 'setCookie']);
        authentication = createSpyObj<Authentication>(['authentication']);
        authentication.authentication.mockResolvedValue({ id: 'john.doe@email.com', name: 'John Doe', role: 'editor' });
        container.registerInstance(COOKIE_STORAGE, storage);
        container.registerInstance(Authentication, authentication);

        app = express();
        app.use(json());
        app.use(urlencoded({ extended: true }));
        app.use(morgan('dev'));
        app.use((req, res, next) => {
            req.user = { id: 'john.doe@email.com', name: 'John Doe', role: 'editor' };
            next();
        });

        app.set('trust proxy', 1);

        RegisterRoutes(app);
        app.use(errorHandler);
    });

    afterAll(() => {
        vi.resetAllMocks();
    });

    describe('getCookie', () => {
        it('GET /api/v1/cookies/Cookie1', async () => {
            storage.getCookie.mockResolvedValueOnce({ name: 'Cookie1', data: 'Hello World!' });
            const response = await request(app).get('/api/v1/cookies/Cookie1');
            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual({ name: 'Cookie1', data: 'Hello World!' });
        });
    });

    describe('setCookie', () => {
        it('POST /api/v1/cookies/Cookie1', async () => {
            const response = await request(app)
                .post('/api/v1/cookies/Cookie1')
                .send({ name: 'Cookie1', data: 'Hello World!' } as Cookie)
                .set('Accept', 'application/json');

            expect(response.statusCode).toBe(204);
            expect(storage.setCookie).toHaveBeenCalled();
        });
    });

    describe('deleteCookie', () => {
        it('DELETE /api/v1/cookies/Cookie1', async () => {
            const response = await request(app).delete('/api/v1/cookies/Cookie1');
            expect(response.statusCode).toBe(204);
            expect(storage.deleteCookie).toHaveBeenCalled();
        });
    });
});
