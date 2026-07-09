/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import os from 'os';
import { container } from 'tsyringe';
import { describe, beforeEach, it, expect, Mocked } from 'vitest';
import express, { Express, json, urlencoded } from 'express';
import request from 'supertest';
import multer from 'multer';
import { AASEndpoint, EndpointAuth } from 'aas-core';

import { createSpyObj } from '../../test/mocks.js';
import { RegisterRoutes } from '../routes/routes.js';
import { Authentication } from './authentication.js';
import { errorHandler } from '../../test/assets/error-handler.js';
import { AAS_INDEX, AASIndex } from '../index/aas-index.js';
import { EndpointProvider } from '../provider/endpoint-provider.js';
import { COOKIE_STORAGE, CookieStorage } from '../cookie-storage/cookie-storage.js';

describe('EndpointsController', () => {
    let app: Express;
    let provider: Mocked<EndpointProvider>;
    let authentication: Mocked<Authentication>;
    let index: Mocked<AASIndex>;
    let cookieStorage: Mocked<CookieStorage>;

    beforeEach(() => {
        provider = createSpyObj<EndpointProvider>([
            'addEndpoint',
            'updateEndpoint',
            'removeEndpoint',
            'reset',
            'startEndpointScan',
        ]);

        index = createSpyObj<AASIndex>(['getEndpoints', 'getEndpointCount', 'getCount']);
        authentication = createSpyObj<Authentication>(['authentication']);
        authentication.authentication.mockResolvedValue({ id: 'john.doe@email.com', name: 'John Doe', role: 'editor' });
        cookieStorage = createSpyObj<CookieStorage>(['getEndpoints', 'updatesEndpoints']);

        container.registerInstance(EndpointProvider, provider);
        container.registerInstance(Authentication, authentication);
        container.registerInstance(AAS_INDEX, index);
        container.registerInstance(COOKIE_STORAGE, cookieStorage);

        app = express();
        app.use(json());
        app.use(urlencoded({ extended: true }));
        app.set('trust proxy', 1);
        app.use((req, res, next) => {
            req.user = { id: 'john.doe@email.com', name: 'John Doe', role: 'editor' };
            next();
        });

        RegisterRoutes(app, { multer: multer({ dest: os.tmpdir() }) });
        app.use(errorHandler);
    });

    it('GET: /api/v1/endpoints', async () => {
        const endpoints: AASEndpoint = {
            name: 'Test',
            url: 'http://localhost:1234',
            type: 'AAS_API',
        };

        index.getEndpoints.mockResolvedValue([endpoints]);
        const response = await request(app).get('/api/v1/endpoints');
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual([endpoints]);
        expect(index.getEndpoints).toHaveBeenCalled();
    });

    it('GET: /api/v1/endpoints/count', async () => {
        index.getEndpointCount.mockResolvedValue(42);
        const response = await request(app).get('/api/v1/endpoints/count');
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ count: 42 });
        expect(index.getEndpointCount).toHaveBeenCalled();
    });

    it('GET: /api/v1/endpoints/documents-count', async () => {
        index.getCount.mockResolvedValue(42);
        const response = await request(app).get('/api/v1/endpoints/documents-count');
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ count: 42 });
        expect(index.getCount).toHaveBeenCalledWith();
    });

    it('GET: /api/v1/endpoints/{name}/documents-count', async () => {
        index.getCount.mockResolvedValue(42);
        const response = await request(app).get('/api/v1/endpoints/U2FtcGxlcw/documents-count');
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ count: 42 });
        expect(index.getCount).toHaveBeenCalledWith('Samples');
    });

    it('POST: /api/v1/endpoints', async () => {
        const endpoint: AASEndpoint = { name: 'Samples', url: 'file:///assets/samples', type: 'FileSystem' };
        provider.addEndpoint.mockResolvedValue();
        const response = await request(app).post('/api/v1/endpoints').send(endpoint);
        expect(response.statusCode).toBe(204);
        expect(provider.addEndpoint).toHaveBeenCalled();
    });

    it('PUT: /api/v1/endpoints/{name}', async () => {
        const endpoint: AASEndpoint = {
            name: 'Samples',
            url: 'file:///assets/samples',
            type: 'FileSystem',
            schedule: { type: 'manual' },
        };

        provider.updateEndpoint.mockResolvedValue();
        const response = await request(app).put('/api/v1/endpoints/U2FtcGxlcw').send(endpoint);
        expect(response.statusCode).toBe(204);
        expect(provider.updateEndpoint).toHaveBeenCalledWith(endpoint);
    });

    it('DELETE: /api/v1/endpoints/{name}', async () => {
        provider.removeEndpoint.mockReturnValue(new Promise<void>(resolve => resolve()));
        const response = await request(app).delete('/api/v1/endpoints/U2FtcGxlcw');
        expect(response.statusCode).toBe(204);
        expect(provider.removeEndpoint).toHaveBeenCalledWith('Samples');
    });

    it('DELETE: /api/v1/endpoints', async () => {
        provider.reset.mockReturnValue(new Promise<void>(resolve => resolve()));
        const response = await request(app).delete('/api/v1/endpoints');
        expect(response.statusCode).toBe(204);
        expect(provider.reset).toHaveBeenCalled();
    });

    it('PUT: /api/v1/endpoints/{name}/scan', async () => {
        provider.startEndpointScan.mockReturnValue(new Promise<void>(resolve => resolve()));
        const response = await request(app).put('/api/v1/endpoints/U2FtcGxlcw/scan');
        expect(response.statusCode).toBe(204);
        expect(provider.startEndpointScan).toHaveBeenCalledWith('Samples');
    });

    it('GET: /api/v1/endpoints/auth', async () => {
        const endpointAuth: EndpointAuth = {
            name: 'Samples',
            headers: { key: 'value' },
        };

        cookieStorage.getEndpoints.mockResolvedValue([endpointAuth]);
        const response = await request(app).get('/api/v1/endpoints/auth');
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual([
            {
                name: 'Samples',
                headers: { key: '*****' },
            },
        ]);

        expect(cookieStorage.getEndpoints).toHaveBeenCalledWith('john.doe@email.com');
    });

    it('PATCH: /api/v1/endpoints/auth', async () => {
        const endpointAuth: EndpointAuth = {
            name: 'Samples',
            headers: { key: '*****' },
        };

        cookieStorage.updatesEndpoints.mockResolvedValue();
        const response = await request(app).patch('/api/v1/endpoints/auth').send([endpointAuth]);
        expect(response.statusCode).toBe(204);
        expect(cookieStorage.updatesEndpoints).toHaveBeenCalledWith('john.doe@email.com', [endpointAuth]);
    });
});
