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
import { AASEndpoint } from 'common';

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
            'addEndpointAsync',
            'removeEndpointAsync',
            'resetAsync',
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

    it('getEndpoints: /api/v1/endpoints', async function () {
        const endpoints: AASEndpoint = {
            name: 'Test',
            url: 'http://localhost:1234',
            type: 'AASServer',
        };

        aasProvider.getEndpoints.mockResolvedValue([endpoints]);
        const response = await request(app).get('/api/v1/endpoints').set('Authorization', `Bearer ${getToken()}`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual([endpoints]);
        expect(aasProvider.getEndpoints).toHaveBeenCalled();
    });

    it('POST: /api/v1/endpoints/:name', async function () {
        const endpoint: AASEndpoint = { name: 'Samples', url: 'file:///assets/samples', type: 'FileSystem' };
        aasProvider.addEndpointAsync.mockResolvedValue();
        auth.hasUserAsync.mockResolvedValue(true);
        const response = await request(app)
            .post('/api/v1/endpoints/samples')
            .set('Authorization', `Bearer ${getToken('John')}`)
            .send(endpoint);

        expect(response.statusCode).toBe(204);
        expect(aasProvider.addEndpointAsync).toHaveBeenCalled();
    });

    it('DELETE: /api/v1/endpoints/:name', async function () {
        aasProvider.removeEndpointAsync.mockReturnValue(new Promise<void>(resolve => resolve()));
        auth.hasUserAsync.mockReturnValue(new Promise<boolean>(resolve => resolve(true)));
        const response = await request(app)
            .delete('/api/v1/endpoints/samples')
            .set('Authorization', `Bearer ${getToken('John')}`);

        expect(response.statusCode).toBe(204);
        expect(aasProvider.removeEndpointAsync).toHaveBeenCalled();
    });

    it('reset: /api/v1/endpoints', async function () {
        auth.hasUserAsync.mockReturnValue(new Promise<boolean>(resolve => resolve(true)));
        aasProvider.resetAsync.mockReturnValue(new Promise<void>(resolve => resolve()));
        const response = await request(app)
            .delete('/api/v1/endpoints')
            .set('Authorization', `Bearer ${getToken('John')}`);

        expect(response.statusCode).toBe(204);
        expect(aasProvider.resetAsync).toHaveBeenCalled();
    });
});
