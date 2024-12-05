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
import { Readable } from 'stream';
import { resolve } from 'path/posix';
import { aas } from 'aas-core';

import { sampleDocument } from '../assets/sample-document.js';
import { Logger } from '../../app/logging/logger.js';
import { AuthService } from '../../app/auth/auth-service.js';
import { AASProvider } from '../../app/aas-provider/aas-provider.js';
import { createSpyObj } from 'fhg-jest';
import { Variable } from '../../app/variable.js';
import { getToken, guestPayload } from '../assets/json-web-token.js';
import { RegisterRoutes } from '../../app/routes/routes.js';
import { Authentication } from '../../app/controller/authentication.js';
import { errorHandler } from '../assets/error-handler.js';

describe('ContainersController', () => {
    let app: Express;
    let logger: Logger;
    let auth: jest.Mocked<AuthService>;
    let aasProvider: jest.Mocked<AASProvider>;
    let variable: jest.Mocked<Variable>;
    let authentication: jest.Mocked<Authentication>;

    beforeEach(() => {
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
            'updateDocumentAsync',
            'getContentAsync',
            'getPackageAsync',
            'getDocumentAsync',
            'addPackagesAsync',
            'deletePackageAsync',
            'getDataElementValueAsync',
            'invoke',
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

    it('getPackage: /api/v1/containers/:endpoint/packages/:id', async () => {
        aasProvider.getPackageAsync.mockReturnValue(
            new Promise<NodeJS.ReadableStream>(resolve => {
                const s = new Readable();
                s.push('Hello World!');
                s.push(null);
                resolve(s);
            }),
        );

        const response = await request(app)
            .get(`/api/v1/containers/U2FtcGxl/packages/aHR0cDovL2N1c3RvbWVyLmNvbS9hYXMvOTE3NV83MDEzXzcwOTFfOTE2OA`)
            .set('Authorization', `Bearer ${getToken()}`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toBeTruthy();
        expect(aasProvider.getPackageAsync).toHaveBeenCalled();
    });

    it('addPackage: /api/v1/containers/:endpoint/packages', async () => {
        auth.hasUserAsync.mockReturnValue(new Promise<boolean>(resolve => resolve(true)));
        const response = await request(app)
            .post('/api/v1/containers/U2FtcGxl/packages')
            .set('Authorization', `Bearer ${getToken('John')}`)
            .attach('files', resolve('./src/test/assets/samples/example-motor.aasx'));

        expect(response.statusCode).toBe(204);
        expect(aasProvider.addPackagesAsync).toHaveBeenCalled();
    });

    it('deletePackage: /api/v1/containers/:endpoint/packages/:id', async () => {
        auth.hasUserAsync.mockReturnValue(new Promise<boolean>(resolve => resolve(true)));
        const response = await request(app)
            .delete('/api/v1/containers/U2FtcGxl/packages/aHR0cDovL2N1c3RvbWVyLmNvbS9hYXMvOTE3NV83MDEzXzcwOTFfOTE2OA')
            .set('Authorization', `Bearer ${getToken('John')}`);

        expect(response.statusCode).toBe(204);
        expect(aasProvider.deletePackageAsync).toHaveBeenCalled();
    });

    it('getDocument: /api/v1/containers/:endpoint/documents/:id', async () => {
        aasProvider.getDocumentAsync.mockResolvedValue(sampleDocument);
        const response = await request(app)
            .get('/api/v1/containers/U2FtcGxl/documents/aHR0cDovL2N1c3RvbWVyLmNvbS9hYXMvOTE3NV83MDEzXzcwOTFfOTE2OA')
            .set('Authorization', `Bearer ${getToken()}`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual(sampleDocument);
        expect(aasProvider.getDocumentAsync).toHaveBeenCalled();
    });

    it('getDocumentContent: /api/v1/containers/:url/documents/:id/content', async () => {
        aasProvider.getContentAsync.mockReturnValue(
            new Promise<aas.Environment>(resolve => {
                resolve({ assetAdministrationShells: [], submodels: [], conceptDescriptions: [] });
            }),
        );

        const response = await request(app)
            .get('/api/v1/containers/Y29udGFpbmVy/documents/ZG9jdW1lbnQ/content')
            .set('Authorization', `Bearer ${getToken()}`);

        expect(response.statusCode).toBe(200);
        expect(aasProvider.getContentAsync).toHaveBeenCalled();
    });

    describe('getDataElementValue: /api/v1/containers/:url/documents/:id/submodels/:smId/submodel-elements/:path/value', () => {
        it('gets the value of a File that represents an image', async () => {
            aasProvider.getDataElementValueAsync.mockReturnValue(
                new Promise<NodeJS.ReadableStream>(resolve => {
                    const s = new Readable();
                    s.push('Hello World!');
                    s.push(null);
                    resolve(s);
                }),
            );

            const response = await request(app)
                .get(
                    '/api/v1/containers/Y29udGFpbmVy/documents/ZG9jdW1lbnQ/submodels/U3VibW9kZWw/submodel-elements/collection.file/value?width=200&height=100',
                )
                .set('Authorization', `Bearer ${getToken()}`);

            expect(response.statusCode).toBe(200);
            expect(aasProvider.getDataElementValueAsync).toHaveBeenCalled();
        });

        it('gets the value of a File', async () => {
            aasProvider.getDataElementValueAsync.mockReturnValue(
                new Promise<NodeJS.ReadableStream>(resolve => {
                    const s = new Readable();
                    s.push('Hello World!');
                    s.push(null);
                    resolve(s);
                }),
            );

            const response = await request(app)
                .get(
                    '/api/v1/containers/Y29udGFpbmVy/documents/ZG9jdW1lbnQ/submodels/U3VibW9kZWw/submodel-elements/collection.file/value',
                )
                .set('Authorization', `Bearer ${getToken()}`);

            expect(response.statusCode).toBe(200);
            expect(response.text).toEqual('Hello World!');
            expect(aasProvider.getDataElementValueAsync).toHaveBeenCalled();
        });

        it('gets the value of a Blob', async () => {
            aasProvider.getDataElementValueAsync.mockReturnValue(
                new Promise<NodeJS.ReadableStream>(resolve => {
                    const s = new Readable();
                    s.push(Buffer.from('Hello world!').toString('base64'));
                    s.push(null);
                    resolve(s);
                }),
            );

            const response = await request(app)
                .get(
                    `/api/v1/containers/Y29udGFpbmVy/documents/ZG9jdW1lbnQ/submodels/U3VibW9kZWw/submodel-elements/collection.blob/value`,
                )
                .set('Authorization', `Bearer ${getToken()}`);

            expect(response.statusCode).toBe(200);
            expect(response.text).toEqual(Buffer.from('Hello world!').toString('base64'));
            expect(aasProvider.getDataElementValueAsync).toHaveBeenCalled();
        });
    });

    it('updateDocument: /api/v1/containers/{endpoint}/documents/{id}', async () => {
        aasProvider.updateDocumentAsync.mockReturnValue(Promise.resolve([]));
        auth.hasUserAsync.mockReturnValue(new Promise<boolean>(resolve => resolve(true)));

        const endpoint = Buffer.from('Endpoint 1').toString('base64url');
        const id = Buffer.from('http://localhost/document').toString('base64url');

        const response = await request(app)
            .put(`/api/v1/containers/${endpoint}/documents/${id}`)
            .set('Authorization', `Bearer ${getToken('John')}`)
            .attach('content', resolve('./src/test/assets/aas-example.json'));

        expect(response.statusCode).toBe(200);
        expect(aasProvider.updateDocumentAsync).toHaveBeenCalled();
    });

    it('invokeOperation: /api/v1/containers/:url/documents/:id/invoke', async () => {
        const operation: aas.Operation = {
            idShort: 'noop',
            modelType: 'Operation',
        };

        aasProvider.invoke.mockReturnValue(Promise.resolve(operation));
        auth.hasUserAsync.mockReturnValue(new Promise<boolean>(resolve => resolve(true)));

        const url = Buffer.from('http://localhost/container').toString('base64url');
        const id = Buffer.from('http://localhost/document').toString('base64url');
        const response = await request(app)
            .post(`/api/v1/containers/${url}/documents/${id}/invoke`)
            .set('Authorization', `Bearer ${getToken('John')}`)
            .send(operation);

        expect(response.statusCode).toBe(200);
        expect(aasProvider.invoke).toHaveBeenCalled();
    });
});
