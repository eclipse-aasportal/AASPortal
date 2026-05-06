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
import morgan from 'morgan';
import request from 'supertest';
import { AASCursor, AASPagedResult } from 'aas-core';
import { encodeBase64Url, LOGGER, Logger } from 'aas-package';

import { AASProvider } from '../../app/provider/aas-provider.js';
import { sampleDocument } from '../assets/sample-document.js';
import { createSpyObj } from '../mocks.js';
import { Variable } from '../../app/variable.js';
import { RegisterRoutes } from '../../app/routes/routes.js';
import { Authentication } from '../../app/controller/authentication.js';
import { errorHandler } from '../assets/error-handler.js';

describe('DocumentsController', () => {
    let app: Express;
    let logger: Logger;
    let aasProvider: Mocked<AASProvider>;
    let variable: Mocked<Variable>;
    let authentication: Mocked<Authentication>;

    beforeEach(() => {
        logger = createSpyObj<Logger>(['error', 'warning', 'info']);
        variable = createSpyObj<Variable>({}, {});

        aasProvider = createSpyObj<AASProvider>([
            'updateDocument',
            'getContent',
            'getPackage',
            'getDocument',
            'getDocuments',
            'insertPackages',
            'deletePackage',
            'getDataElementValue',
            'invoke',
            'reset',
        ]);

        authentication = createSpyObj<Authentication>(['authentication']);
        authentication.authentication.mockResolvedValue({ id: 'john.doe@email.com', name: 'John Doe', role: 'editor' });

        container.registerInstance(LOGGER, logger);
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

    it('getDocument: /api/v1/documents/{id}', async () => {
        aasProvider.getDocument.mockResolvedValue(sampleDocument);
        const response = await request(app).get(
            '/api/v1/documents/aHR0cDovL2N1c3RvbWVyLmNvbS9hYXMvOTE3NV83MDEzXzcwOTFfOTE2OA',
        );

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual(sampleDocument);
        expect(aasProvider.getDocument).toHaveBeenCalled();
    });

    it('getDocument: /api/v1/documents/asset/{id}', async () => {
        aasProvider.getDocument.mockResolvedValue(sampleDocument);
        const response = await request(app).get(
            '/api/v1/documents/asset/aHR0cDovL2N1c3RvbWVyLmNvbS9hc3NldHMvS0hCVlpKU1FLSVk',
        );

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual(sampleDocument);
        expect(aasProvider.getDocument).toHaveBeenCalled();
    });

    it('getDocuments: /api/v1/documents?cursor=<cursor>&filter=<filter>', async () => {
        const page: AASPagedResult = { previous: null, documents: [sampleDocument], next: null };
        aasProvider.getDocuments.mockResolvedValue(page);
        const cursor = encodeBase64Url(JSON.stringify({ previous: null, limit: 10 } as AASCursor));
        const filter = encodeBase64Url('#prop:Name=Value');
        const response = await request(app).get(`/api/v1/documents?cursor=${cursor}&filter=${filter}`);
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual(page);
        expect(aasProvider.getDocuments).toHaveBeenCalled();
    });
});
