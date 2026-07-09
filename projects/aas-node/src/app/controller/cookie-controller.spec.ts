/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { container } from 'tsyringe';
import express, { Express, json, text, urlencoded } from 'express';
import request from 'supertest';
import { describe, it, expect, Mocked, vi, beforeAll, afterAll } from 'vitest';

import { createSpyObj } from '../../test/mocks.js';
import { RegisterRoutes } from '../routes/routes.js';
import { errorHandler } from '../../test/assets/error-handler.js';
import { COOKIE_STORAGE, CookieStorage } from '../cookie-storage/cookie-storage.js';
import { Authentication } from './authentication.js';

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
        app.use(text());
        app.use(urlencoded({ extended: true }));
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
            storage.getCookie.mockResolvedValueOnce('Hello World!');
            const response = await request(app).get('/api/v1/cookies/Cookie1');
            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual('Hello World!');
        });
    });

    describe('setCookie', () => {
        it('POST /api/v1/cookies/Cookie1', async () => {
            const response = await request(app)
                .post('/api/v1/cookies/Cookie1')
                .set('Content-Type', 'text/plain')
                .send('Hello World!');

            expect(response.statusCode).toBe(204);
            expect(storage.setCookie).toHaveBeenCalledWith('john.doe@email.com', 'Cookie1', 'Hello World!');
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
