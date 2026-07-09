/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { container } from 'tsyringe';
import { describe, beforeEach, it, expect, Mocked } from 'vitest';
import express, { Express, json, urlencoded } from 'express';
import request from 'supertest';
import { aas, AASCursor, AASPagedResult } from 'aas-core';
import { encodeBase64Url, LOGGER, Logger } from 'aas-package';
import { Readable } from 'stream';

import { DocumentProvider } from '../provider/document-provider.js';
import { sampleDocument } from '../../test/assets/sample-document.js';
import { createSpyObj } from '../../test/mocks.js';
import { Variable } from '../variable.js';
import { RegisterRoutes } from '../routes/routes.js';
import { Authentication } from './authentication.js';
import { errorHandler } from '../../test/assets/error-handler.js';
import { AAS_INDEX, AASIndex } from '../index/aas-index.js';

describe('DocumentsController', () => {
    let app: Express;
    let logger: Logger;
    let provider: Mocked<DocumentProvider>;
    let index: Mocked<AASIndex>;
    let variable: Mocked<Variable>;
    let authentication: Mocked<Authentication>;

    beforeEach(() => {
        logger = createSpyObj<Logger>(['error', 'warning', 'info']);
        variable = createSpyObj<Variable>({}, {});
        index = createSpyObj<AASIndex>(['getDocuments', 'getEndpoints', 'getEndpoint', 'find', 'getCount'], {});

        provider = createSpyObj<DocumentProvider>([
            'updateDocument',
            'getContent',
            'getDocument',
            'getDataElementValue',
            'invoke',
        ]);

        authentication = createSpyObj<Authentication>(['authentication']);
        authentication.authentication.mockResolvedValue({ id: 'john.doe@email.com', name: 'John Doe', role: 'editor' });

        container.registerInstance(LOGGER, logger);
        container.registerInstance(AAS_INDEX, index);
        container.registerInstance(Variable, variable);
        container.registerInstance(DocumentProvider, provider);
        container.registerInstance(Authentication, authentication);

        app = express();
        app.use(json());
        app.use(urlencoded({ extended: true }));
        app.set('trust proxy', 1);

        RegisterRoutes(app);
        app.use(errorHandler);
    });

    it('getDocument: /api/v1/documents/{id}', async () => {
        provider.getDocument.mockResolvedValue(sampleDocument);
        const response = await request(app).get(
            '/api/v1/documents/aHR0cDovL2N1c3RvbWVyLmNvbS9hYXMvOTE3NV83MDEzXzcwOTFfOTE2OA',
        );

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual(sampleDocument);
        expect(provider.getDocument).toHaveBeenCalled();
    });

    it('getDocument: /api/v1/documents/assets/{id}', async () => {
        provider.getDocument.mockResolvedValue(sampleDocument);
        const response = await request(app).get(
            '/api/v1/documents/assets/aHR0cDovL2N1c3RvbWVyLmNvbS9hc3NldHMvS0hCVlpKU1FLSVk',
        );

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual(sampleDocument);
        expect(provider.getDocument).toHaveBeenCalled();
    });

    it('getDocuments: /api/v1/documents?cursor=<cursor>&filter=<filter>', async () => {
        const page: AASPagedResult = { previous: null, documents: [sampleDocument], next: null };
        index.getDocuments.mockResolvedValue(page);
        const cursor = encodeBase64Url(JSON.stringify({ previous: null, limit: 10 } as AASCursor));
        const filter = encodeBase64Url('#prop:Name=Value');
        const response = await request(app).get(`/api/v1/documents?cursor=${cursor}&filter=${filter}`);
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual(page);
        expect(index.getDocuments).toHaveBeenCalled();
    });

    it('GET: /api/v1/endpoints/{name}/documents/{id}', async () => {
        provider.getDocument.mockResolvedValue(sampleDocument);
        const response = await request(app).get(
            '/api/v1/endpoints/U2FtcGxl/documents/aHR0cDovL2N1c3RvbWVyLmNvbS9hYXMvOTE3NV83MDEzXzcwOTFfOTE2OA',
        );
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual(sampleDocument);
        expect(provider.getDocument).toHaveBeenCalled();
    });

    it('GET: /api/v1/endpoints/{name}/documents/assets/{id}', async () => {
        provider.getDocument.mockResolvedValue(sampleDocument);
        const response = await request(app).get(
            '/api/v1/endpoints/U2FtcGxl/documents/assets/aHR0cDovL2N1c3RvbWVyLmNvbS9hc3NldHMvS0hCVlpKU1FLSVk',
        );
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual(sampleDocument);
        expect(provider.getDocument).toHaveBeenCalled();
    });

    it('GET: /api/v1/endpoints/{name}/documents/{id}/content', async () => {
        provider.getContent.mockReturnValue(
            new Promise<aas.Environment>(resolve => {
                resolve({ assetAdministrationShells: [], submodels: [], conceptDescriptions: [] });
            }),
        );

        const response = await request(app).get('/api/v1/endpoints/Y29udGFpbmVy/documents/ZG9jdW1lbnQ/content');
        expect(response.statusCode).toBe(200);
        expect(provider.getContent).toHaveBeenCalled();
    });

    describe('getDataElementValue: /api/v1/endpoints/{name}/documents/{id}/submodels/:smId/submodel-elements/{path}/value', () => {
        it('gets the value of a File that represents an image', async () => {
            provider.getDataElementValue.mockReturnValue(
                new Promise<NodeJS.ReadableStream>(resolve => {
                    const s = new Readable();
                    s.push('Hello World!');
                    s.push(null);
                    resolve(s);
                }),
            );

            const response = await request(app).get(
                '/api/v1/endpoints/Y29udGFpbmVy/documents/ZG9jdW1lbnQ/submodels/U3VibW9kZWw/submodel-elements/collection.file/value?width=200&height=100',
            );
            expect(response.statusCode).toBe(200);
            expect(provider.getDataElementValue).toHaveBeenCalled();
        });

        it('gets the value of a File', async () => {
            provider.getDataElementValue.mockReturnValue(
                new Promise<Readable>(resolve => {
                    const s = new Readable();
                    s.push('Hello World!');
                    s.push(null);
                    resolve(s);
                }),
            );

            const response = await request(app).get(
                '/api/v1/endpoints/Y29udGFpbmVy/documents/ZG9jdW1lbnQ/submodels/U3VibW9kZWw/submodel-elements/collection.file/value',
            );
            expect(response.statusCode).toBe(200);
            expect(response.text).toEqual('Hello World!');
            expect(provider.getDataElementValue).toHaveBeenCalled();
        });

        it('gets the value of a Blob', async () => {
            provider.getDataElementValue.mockReturnValue(
                new Promise<Readable>(resolve => {
                    const s = new Readable();
                    s.push(Buffer.from('Hello world!').toString('base64'));
                    s.push(null);
                    resolve(s);
                }),
            );

            const response = await request(app).get(
                `/api/v1/endpoints/Y29udGFpbmVy/documents/ZG9jdW1lbnQ/submodels/U3VibW9kZWw/submodel-elements/collection.blob/value`,
            );
            expect(response.statusCode).toBe(200);
            expect(response.text).toEqual(Buffer.from('Hello world!').toString('base64'));
            expect(provider.getDataElementValue).toHaveBeenCalled();
        });
    });

    it('PUT: /api/v1/endpoints/{endpoint}/documents/{id}', async () => {
        provider.updateDocument.mockResolvedValue(void 0);

        const endpoint = Buffer.from('Endpoint 1').toString('base64url');
        const id = Buffer.from('http://localhost/document').toString('base64url');
        const response = await request(app)
            .put(`/api/v1/endpoints/${endpoint}/documents/${id}`)
            .send({
                assetAdministrationShells: [],
                conceptDescriptions: [],
                submodels: [],
            } satisfies aas.Environment);

        expect(response.statusCode).toBe(204);
        expect(provider.updateDocument).toHaveBeenCalled();
    });

    it('invokeOperation: /api/v1/endpoints/{name}/documents/{id}/invoke', async () => {
        const operation: aas.Operation = {
            idShort: 'noop',
            modelType: 'Operation',
        };

        provider.invoke.mockReturnValue(Promise.resolve(operation));

        const endpointName = Buffer.from('endpoint').toString('base64url');
        const id = Buffer.from('http://localhost/document').toString('base64url');
        const response = await request(app)
            .post(`/api/v1/endpoints/${endpointName}/documents/${id}/invoke`)
            .send(operation);

        expect(response.statusCode).toBe(200);
        expect(provider.invoke).toHaveBeenCalled();
    });
});
