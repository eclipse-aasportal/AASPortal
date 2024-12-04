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
import multer from 'multer';
import request from 'supertest';
import { AASCursor, AASPagedResult } from 'aas-core';

import { Logger } from '../../app/logging/logger.js';
import { AuthService } from '../../app/auth/auth-service.js';
import { AASProvider } from '../../app/aas-provider/aas-provider.js';
import { sampleDocument } from '../assets/sample-document.js';
import { createSpyObj } from 'fhg-jest';
import { Variable } from '../../app/variable.js';
import { getToken, guestPayload } from '../assets/json-web-token.js';
import { RegisterRoutes } from '../../app/routes/routes.js';
import { Authentication } from '../../app/controller/authentication.js';
import { errorHandler } from '../assets/error-handler.js';
import { encodeBase64Url } from '../../app/convert.js';

describe('DocumentsController', function () {
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
            'updateDocumentAsync',
            'getContentAsync',
            'getPackageAsync',
            'getDocumentAsync',
            'getDocumentsAsync',
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

        RegisterRoutes(app, { multer: multer({ dest: './temp' }) });
        app.use(errorHandler);
    });

    it('getDocument: /api/v1/documents/:id', async function () {
        aasProvider.getDocumentAsync.mockResolvedValue(sampleDocument);
        const response = await request(app)
            .get('/api/v1/documents/aHR0cDovL2N1c3RvbWVyLmNvbS9hYXMvOTE3NV83MDEzXzcwOTFfOTE2OA')
            .set('Authorization', `Bearer ${getToken()}`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual(sampleDocument);
        expect(aasProvider.getDocumentAsync).toHaveBeenCalled();
    });

    it('getDocuments: /api/v1/documents?cursor=<cursor>&filter=<filter>', async function () {
        const page: AASPagedResult = { previous: null, documents: [sampleDocument], next: null };
        aasProvider.getDocumentsAsync.mockResolvedValue(page);
        const cursor = encodeBase64Url(JSON.stringify({ previous: null, limit: 10 } as AASCursor));
        const filter = encodeBase64Url('#prop:Name=Value');
        const response = await request(app)
            .get(`/api/v1/documents?cursor=${cursor}&filter=${filter}`)
            .set('Authorization', `Bearer ${getToken()}`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual(page);
        expect(aasProvider.getDocumentsAsync).toHaveBeenCalled();
    });
});
