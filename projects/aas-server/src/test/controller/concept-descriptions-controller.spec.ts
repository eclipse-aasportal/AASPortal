/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import os from 'os';
import { container } from 'tsyringe';
import express, { Express, json, urlencoded } from 'express';
import morgan from 'morgan';
import request from 'supertest';
import multer from 'multer';
import { aas, jsonization, types } from 'aas-core';

import { LOGGER, Logger } from '../../app/logging/logger.js';
import { Variable } from '../../app/variable.js';
import { RegisterRoutes } from '../../app/routes/routes.js';
import { createSpyObj } from '../create-spy-obj.js';
import { errorHandler } from '../../app/error-handler.js';
import { getToken } from '../json-web-token.js';
import { ConceptDescriptionRepository } from '../../app/concept-description-repository.js';
import { encodeBase64Url, toJsonValue } from '../../app/utilities.js';
import { Authentication } from '../../app/controller/authentication.js';

describe('ConceptDescriptionsController', () => {
    let app: Express;
    let logger: Logger;
    let variable: jest.Mocked<Variable>;
    let authentication: jest.Mocked<Authentication>;
    let repository: jest.Mocked<ConceptDescriptionRepository>;

    beforeEach(() => {
        logger = createSpyObj<Logger>(['error', 'warning', 'info']);
        variable = createSpyObj<Variable>({}, { JWT_SECRET: 'SecretSecretSecretSecretSecretSecret' });
        repository = createSpyObj<ConceptDescriptionRepository>([
            'getConceptDescriptions',
            'getConceptDescription',
            'addConceptDescription',
            'deleteConceptDescription',
        ]);

        authentication = createSpyObj<Authentication>(['expressAuthentication']);
        authentication.expressAuthentication.mockResolvedValue({});

        container.registerInstance(LOGGER, logger);
        container.registerInstance(Variable, variable);
        container.registerInstance(Authentication, authentication);
        container.registerInstance(ConceptDescriptionRepository, repository);

        app = express();
        app.use(json());
        app.use(urlencoded({ extended: true }));
        app.use(morgan('dev'));
        app.set('trust proxy', 1);

        RegisterRoutes(app, { multer: multer({ dest: os.tmpdir() }) });
        app.use(errorHandler);
    });

    it('GET: /concept-descriptions', async () => {
        repository.getConceptDescriptions.mockResolvedValue({ result: [], paging_metadata: {} });
        const cursor = encodeBase64Url(JSON.stringify({ previous: null, next: null }));
        const response = await request(app)
            .get('/api/v3/concept-descriptions')
            .query({ limit: 123, cursor })
            .set('Authorization', `Bearer ${getToken()}`);

        expect(response.statusCode).toBe(200);
        expect(repository.getConceptDescriptions).toHaveBeenCalledWith(123, cursor);
        expect(response.body).toEqual({ result: [], paging_metadata: {} });
    });

    it('GET: /concept-descriptions/{id}', async () => {
        const cd: aas.ConceptDescription = {
            id: 'http://www.fraunhofer.de/cd/test-concept-description',
            idShort: 'test-concept-description',
            modelType: 'ConceptDescription',
        };

        repository.getConceptDescription.mockResolvedValue(cd);
        const id = 'aHR0cDovL3d3dy5mcmF1bmhvZmVyLmRlL2NkL3Rlc3QtY29uY2VwdC1kZXNjcmlwdGlvbg';
        const response = await request(app)
            .get(`/api/v3/concept-descriptions/${id}`)
            .set('Authorization', `Bearer ${getToken()}`);

        expect(response.statusCode).toBe(200);
        expect(repository.getConceptDescription).toHaveBeenCalledWith(
            'http://www.fraunhofer.de/cd/test-concept-description',
        );

        expect(response.body).toEqual(cd);
    });

    it('POST: /concept-descriptions', async () => {
        const cd: aas.ConceptDescription = {
            id: 'http://www.fraunhofer.de/cd/test-concept-description',
            idShort: 'test-concept-description',
            modelType: 'ConceptDescription',
        };

        repository.addConceptDescription.mockResolvedValue(
            jsonization.conceptDescriptionFromJsonable(toJsonValue(cd)).mustValue(),
        );
        
        const response = await request(app)
            .post('/api/v3/concept-descriptions')
            .set('Authorization', `Bearer ${getToken()}`)
            .send(cd);

        expect(response.statusCode).toBe(201);
        expect(repository.addConceptDescription).toHaveBeenCalledWith(cd);
        expect(response.body).toEqual(cd);
    });

    it('DELETE: /concept-descriptions/{id}', async () => {
        repository.deleteConceptDescription.mockResolvedValue(void 0);
        const id = 'aHR0cDovL3d3dy5mcmF1bmhvZmVyLmRlL2NkL3Rlc3QtY29uY2VwdC1kZXNjcmlwdGlvbg';
        const response = await request(app)
            .delete(`/api/v3/concept-descriptions/${id}`)
            .set('Authorization', `Bearer ${getToken()}`);

        expect(response.statusCode).toBe(204);
        expect(repository.deleteConceptDescription).toHaveBeenCalledWith(
            'http://www.fraunhofer.de/cd/test-concept-description',
        );
    });
});
