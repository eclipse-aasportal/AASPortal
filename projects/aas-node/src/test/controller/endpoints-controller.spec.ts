/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import os from 'os';
import { container } from 'tsyringe';
import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import express, { Express, json, urlencoded } from 'express';
import morgan from 'morgan';
import { Readable } from 'stream';
import { resolve } from 'path/posix';
import request from 'supertest';
import { aas, AASEndpoint } from 'aas-core';
import { createSpyObj } from 'fhg-jest';

import { sampleDocument } from '../assets/sample-document.js';
import { Logger } from '../../app/logging/logger.js';
import { AuthService } from '../../app/auth/auth-service.js';
import { AASProvider } from '../../app/aas-provider/aas-provider.js';
import { Variable } from '../../app/variable.js';
import { getToken, guestPayload } from '../assets/json-web-token.js';
import { RegisterRoutes } from '../../app/routes/routes.js';
import { Authentication } from '../../app/controller/authentication.js';
import { errorHandler } from '../assets/error-handler.js';
import multer from 'multer';

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
            'updateDocumentAsync',
            'getContentAsync',
            'getPackageAsync',
            'getDocumentAsync',
            'addPackagesAsync',
            'deletePackageAsync',
            'getDataElementValue',
            'invoke',
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

        RegisterRoutes(app, { multer: multer({ dest: os.tmpdir() }) });
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
        expect(aasProvider.updateEndpointAsync).toHaveBeenCalledWith(endpoint);
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

    it('GET: /api/v1/endpoints/:endpoint/packages/:id', async () => {
        aasProvider.getPackageAsync.mockReturnValue(
            new Promise<NodeJS.ReadableStream>(resolve => {
                const s = new Readable();
                s.push('Hello World!');
                s.push(null);
                resolve(s);
            }),
        );

        const response = await request(app)
            .get(`/api/v1/endpoints/U2FtcGxl/packages/aHR0cDovL2N1c3RvbWVyLmNvbS9hYXMvOTE3NV83MDEzXzcwOTFfOTE2OA`)
            .set('Authorization', `Bearer ${getToken()}`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toBeTruthy();
        expect(aasProvider.getPackageAsync).toHaveBeenCalled();
    });

    it('POST: /api/v1/endpoints/:endpoint/packages', async () => {
        auth.hasUserAsync.mockReturnValue(new Promise<boolean>(resolve => resolve(true)));
        const response = await request(app)
            .post('/api/v1/endpoints/U2FtcGxl/packages')
            .set('Authorization', `Bearer ${getToken('John')}`)
            .attach('files', resolve('./src/test/assets/samples/example-motor.aasx'));

        expect(response.statusCode).toBe(204);
        expect(aasProvider.addPackagesAsync).toHaveBeenCalled();
    });

    it('DELETE: /api/v1/endpoints/:endpoint/packages/:id', async () => {
        auth.hasUserAsync.mockReturnValue(new Promise<boolean>(resolve => resolve(true)));
        const response = await request(app)
            .delete('/api/v1/endpoints/U2FtcGxl/packages/aHR0cDovL2N1c3RvbWVyLmNvbS9hYXMvOTE3NV83MDEzXzcwOTFfOTE2OA')
            .set('Authorization', `Bearer ${getToken('John')}`);

        expect(response.statusCode).toBe(204);
        expect(aasProvider.deletePackageAsync).toHaveBeenCalled();
    });

    it('GET: /api/v1/endpoints/:endpoint/documents/:id', async () => {
        aasProvider.getDocumentAsync.mockResolvedValue(sampleDocument);
        const response = await request(app)
            .get('/api/v1/endpoints/U2FtcGxl/documents/aHR0cDovL2N1c3RvbWVyLmNvbS9hYXMvOTE3NV83MDEzXzcwOTFfOTE2OA')
            .set('Authorization', `Bearer ${getToken()}`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual(sampleDocument);
        expect(aasProvider.getDocumentAsync).toHaveBeenCalled();
    });

    it('GET: /api/v1/endpoints/:url/documents/:id/content', async () => {
        aasProvider.getContentAsync.mockReturnValue(
            new Promise<aas.Environment>(resolve => {
                resolve({ assetAdministrationShells: [], submodels: [], conceptDescriptions: [] });
            }),
        );

        const response = await request(app)
            .get('/api/v1/endpoints/Y29udGFpbmVy/documents/ZG9jdW1lbnQ/content')
            .set('Authorization', `Bearer ${getToken()}`);

        expect(response.statusCode).toBe(200);
        expect(aasProvider.getContentAsync).toHaveBeenCalled();
    });

    describe('getDataElementValue: /api/v1/endpoints/:url/documents/:id/submodels/:smId/submodel-elements/:path/value', () => {
        it('gets the value of a File that represents an image', async () => {
            aasProvider.getDataElementValue.mockReturnValue(
                new Promise<NodeJS.ReadableStream>(resolve => {
                    const s = new Readable();
                    s.push('Hello World!');
                    s.push(null);
                    resolve(s);
                }),
            );

            const response = await request(app)
                .get(
                    '/api/v1/endpoints/Y29udGFpbmVy/documents/ZG9jdW1lbnQ/submodels/U3VibW9kZWw/submodel-elements/collection.file/value?width=200&height=100',
                )
                .set('Authorization', `Bearer ${getToken()}`);

            expect(response.statusCode).toBe(200);
            expect(aasProvider.getDataElementValue).toHaveBeenCalled();
        });

        it('gets the value of a File', async () => {
            aasProvider.getDataElementValue.mockReturnValue(
                new Promise<NodeJS.ReadableStream>(resolve => {
                    const s = new Readable();
                    s.push('Hello World!');
                    s.push(null);
                    resolve(s);
                }),
            );

            const response = await request(app)
                .get(
                    '/api/v1/endpoints/Y29udGFpbmVy/documents/ZG9jdW1lbnQ/submodels/U3VibW9kZWw/submodel-elements/collection.file/value',
                )
                .set('Authorization', `Bearer ${getToken()}`);

            expect(response.statusCode).toBe(200);
            expect(response.text).toEqual('Hello World!');
            expect(aasProvider.getDataElementValue).toHaveBeenCalled();
        });

        it('gets the value of a Blob', async () => {
            aasProvider.getDataElementValue.mockReturnValue(
                new Promise<NodeJS.ReadableStream>(resolve => {
                    const s = new Readable();
                    s.push(Buffer.from('Hello world!').toString('base64'));
                    s.push(null);
                    resolve(s);
                }),
            );

            const response = await request(app)
                .get(
                    `/api/v1/endpoints/Y29udGFpbmVy/documents/ZG9jdW1lbnQ/submodels/U3VibW9kZWw/submodel-elements/collection.blob/value`,
                )
                .set('Authorization', `Bearer ${getToken()}`);

            expect(response.statusCode).toBe(200);
            expect(response.text).toEqual(Buffer.from('Hello world!').toString('base64'));
            expect(aasProvider.getDataElementValue).toHaveBeenCalled();
        });
    });

    it('PUT: /api/v1/endpoints/{endpoint}/documents/{id}', async () => {
        aasProvider.updateDocumentAsync.mockReturnValue(Promise.resolve([]));
        auth.hasUserAsync.mockReturnValue(new Promise<boolean>(resolve => resolve(true)));

        const endpoint = Buffer.from('Endpoint 1').toString('base64url');
        const id = Buffer.from('http://localhost/document').toString('base64url');
        const response = await request(app)
            .put(`/api/v1/endpoints/${endpoint}/documents/${id}`)
            .set('Authorization', `Bearer ${getToken('John')}`)
            .attach('file', resolve('./src/test/assets/aas-example.json'));

        expect(response.statusCode).toBe(200);
        expect(aasProvider.updateDocumentAsync).toHaveBeenCalled();
    });

    it('invokeOperation: /api/v1/endpoints/:url/documents/:id/invoke', async () => {
        const operation: aas.Operation = {
            idShort: 'noop',
            modelType: 'Operation',
        };

        aasProvider.invoke.mockReturnValue(Promise.resolve(operation));
        auth.hasUserAsync.mockReturnValue(new Promise<boolean>(resolve => resolve(true)));

        const url = Buffer.from('http://localhost/container').toString('base64url');
        const id = Buffer.from('http://localhost/document').toString('base64url');
        const response = await request(app)
            .post(`/api/v1/endpoints/${url}/documents/${id}/invoke`)
            .set('Authorization', `Bearer ${getToken('John')}`)
            .send(operation);

        expect(response.statusCode).toBe(200);
        expect(aasProvider.invoke).toHaveBeenCalled();
    });
});