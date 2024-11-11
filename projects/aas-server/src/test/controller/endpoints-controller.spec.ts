/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { container } from 'tsyringe';
import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import express, { Express, json, urlencoded } from 'express';
import morgan from 'morgan';
import request from 'supertest';
import { AASEndpoint } from 'aas-core';

import { Logger } from '../../app/logging/logger.js';
import { AuthService } from '../../app/auth/auth-service.js';
import { AASProvider } from '../../app/aas-provider/aas-provider.js';
import { createSpyObj } from 'fhg-jest';
import { Variable } from '../../app/variable.js';
import { getToken, guestPayload } from '../assets/json-web-token.js';
import { RegisterRoutes } from '../../app/routes/routes.js';
import { Authentication } from '../../app/controller/authentication.js';
import { errorHandler } from '../assets/error-handler.js';

describe('EndpointsController', function () {
    let app: Express;
    let logger: Logger;
    let auth: jest.Mocked<AuthService>;
    let aasProvider: jest.Mocked<AASProvider>;
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

        aasProvider = createSpyObj<AASProvider>([
            'getEndpoints',
            'getEndpointCount',
            'addEndpointAsync',
            'updateEndpointAsync',
            'removeEndpointAsync',
            'getCountAsync',
            'resetAsync',
            'startEndpointScan',
        ]);

        authentication = createSpyObj<Authentication>(['checkAsync']);
        authentication.checkAsync.mockResolvedValue(guestPayload);

        container.registerInstance(AuthService, auth);
        container.registerInstance('Logger', logger);
        container.registerInstance(Variable, variable);
        container.registerInstance(AASProvider, aasProvider);
        container.registerInstance(Authentication, authentication);

        app = express();
        app.use(json());
        app.use(urlencoded({ extended: true }));
        app.use(morgan('dev'));
        app.set('trust proxy', 1);

        RegisterRoutes(app);
        app.use(errorHandler);
    });

    it('GET: /api/v1/endpoints', async () => {
        const endpoints: AASEndpoint = {
            name: 'Test',
            url: 'http://localhost:1234',
            type: 'AAS_API',
        };

        aasProvider.getEndpoints.mockResolvedValue([endpoints]);
        const response = await request(app).get('/api/v1/endpoints').set('Authorization', `Bearer ${getToken()}`);
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual([endpoints]);
        expect(aasProvider.getEndpoints).toHaveBeenCalled();
    });

    it('GET: /api/v1/endpoints/count', async () => {
        aasProvider.getEndpointCount.mockResolvedValue(42);
        const response = await request(app).get('/api/v1/endpoints/count').set('Authorization', `Bearer ${getToken()}`);
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ count: 42 });
        expect(aasProvider.getEndpointCount).toHaveBeenCalled();
    });

    it('GET: /api/v1/endpoints/{name}/documents/count', async () => {
        aasProvider.getCountAsync.mockResolvedValue(42);
        const response = await request(app)
            .get('/api/v1/endpoints/U2FtcGxlcw/documents/count')
            .set('Authorization', `Bearer ${getToken()}`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ count: 42 });
        expect(aasProvider.getCountAsync).toHaveBeenCalledWith('Samples');
    });

    it('POST: /api/v1/endpoints/{name}', async () => {
        const endpoint: AASEndpoint = { name: 'Samples', url: 'file:///assets/samples', type: 'FileSystem' };
        aasProvider.addEndpointAsync.mockResolvedValue();
        auth.hasUserAsync.mockResolvedValue(true);
        const response = await request(app)
            .post('/api/v1/endpoints/U2FtcGxlcw')
            .set('Authorization', `Bearer ${getToken('John')}`)
            .send(endpoint);

        expect(response.statusCode).toBe(204);
        expect(aasProvider.addEndpointAsync).toHaveBeenCalled();
    });

    it('PUT: /api/v1/endpoints/{name}', async () => {
        const endpoint: AASEndpoint = {
            name: 'Samples',
            url: 'file:///assets/samples',
            type: 'FileSystem',
            schedule: { type: 'manual' },
        };

        aasProvider.updateEndpointAsync.mockResolvedValue();
        auth.hasUserAsync.mockResolvedValue(true);
        const response = await request(app)
            .put('/api/v1/endpoints/U2FtcGxlcw')
            .set('Authorization', `Bearer ${getToken('John')}`)
            .send(endpoint);

        expect(response.statusCode).toBe(204);
        expect(aasProvider.updateEndpointAsync).toHaveBeenCalledWith('Samples', endpoint);
    });

    it('DELETE: /api/v1/endpoints/{name}', async () => {
        aasProvider.removeEndpointAsync.mockReturnValue(new Promise<void>(resolve => resolve()));
        auth.hasUserAsync.mockReturnValue(new Promise<boolean>(resolve => resolve(true)));
        const response = await request(app)
            .delete('/api/v1/endpoints/U2FtcGxlcw')
            .set('Authorization', `Bearer ${getToken('John')}`);

        expect(response.statusCode).toBe(204);
        expect(aasProvider.removeEndpointAsync).toHaveBeenCalledWith('Samples');
    });

    it('DELETE: /api/v1/endpoints', async () => {
        auth.hasUserAsync.mockReturnValue(new Promise<boolean>(resolve => resolve(true)));
        aasProvider.resetAsync.mockReturnValue(new Promise<void>(resolve => resolve()));
        const response = await request(app)
            .delete('/api/v1/endpoints')
            .set('Authorization', `Bearer ${getToken('John')}`);

        expect(response.statusCode).toBe(204);
        expect(aasProvider.resetAsync).toHaveBeenCalled();
    });

    it('PUT: /api/v1/endpoints/{name}/scan', async () => {
        auth.hasUserAsync.mockReturnValue(new Promise<boolean>(resolve => resolve(true)));
        aasProvider.startEndpointScan.mockReturnValue(new Promise<void>(resolve => resolve()));
        const response = await request(app)
            .put('/api/v1/endpoints/U2FtcGxlcw/scan')
            .set('Authorization', `Bearer ${getToken('John')}`);

        expect(response.statusCode).toBe(204);
        expect(aasProvider.startEndpointScan).toHaveBeenCalledWith('Samples');
    });
});
