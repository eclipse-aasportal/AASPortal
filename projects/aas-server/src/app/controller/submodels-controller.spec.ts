/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import fs from 'fs';
import { describe, beforeEach, it, expect, Mocked } from 'vitest';
import os from 'os';
import { container } from 'tsyringe';
import { fileURLToPath } from 'url';
import express, { Express, json, urlencoded } from 'express';
import request from 'supertest';
import multer from 'multer';
import { aas, jsonization, toJsonValue } from 'aas-core';
import { encodeBase64Url, FileResult, LOGGER, Logger } from 'aas-package';

import { Variable } from '../variable.js';
import { RegisterRoutes } from '../routes/routes.js';
import { Authentication } from './authentication.js';
import { errorHandler } from '../error-handler.js';
import { SubmodelRepository } from '../submodel-repository.js';
import { createSpyObj } from '../../test/mocks.js';

describe('SubmodelsController', () => {
    let app: Express;
    let logger: Logger;
    let variable: Mocked<Variable>;
    let authentication: Mocked<Authentication>;
    let repository: Mocked<SubmodelRepository>;

    beforeEach(() => {
        logger = createSpyObj<Logger>(['error', 'warning', 'info']);
        variable = createSpyObj<Variable>({}, {});
        repository = createSpyObj<SubmodelRepository>([
            'getSubmodel',
            'getSubmodels',
            'getFileByPath',
            'putFileByPath',
            'deleteFileByPath',
            'addSubmodel',
            'getSubmodelElement',
            'getSubmodelElementValue',
        ]);

        authentication = createSpyObj<Authentication>(['expressAuthentication']);
        authentication.expressAuthentication.mockResolvedValue({ label: 'test-user' });

        container.registerInstance(LOGGER, logger);
        container.registerInstance(Variable, variable);
        container.registerInstance(Authentication, authentication);
        container.registerInstance(SubmodelRepository, repository);

        app = express();
        app.use(json());
        app.use(urlencoded({ extended: true }));
        app.set('trust proxy', 1);

        RegisterRoutes(app, { multer: multer({ dest: os.tmpdir() }) });
        app.use(errorHandler);
    });

    it('GET: /submodels', async () => {
        const cursor = encodeBase64Url(JSON.stringify({ previous: null, next: null }));
        repository.getSubmodels.mockResolvedValue({ result: [], paging_metadata: {} });
        const response = await request(app)
            .get('/api/v3/submodels')
            .query({ limit: 123, cursor })
            .set('x-api-key', 'this-is-an-api-key');

        expect(response.statusCode).toBe(200);
        expect(repository.getSubmodels).toHaveBeenCalledWith(123, cursor, 'deep', 'withoutBlobValue');
        expect(response.body).toEqual({ result: [], paging_metadata: {} });
    });

    it('GET: /submodels/{smId}', async () => {
        const sm: aas.Submodel = {
            id: 'http://www.fraunhofer.de/sm/test-submodel',
            idShort: 'test-submodel',
            modelType: 'Submodel',
        };

        repository.getSubmodel.mockResolvedValue(sm);
        const smId = 'aHR0cDovL3d3dy5mcmF1bmhvZmVyLmRlL3NtL3Rlc3Qtc3VibW9kZWw';
        const response = await request(app).get(`/api/v3/submodels/${smId}`).set('x-api-key', 'this-is-an-api-key');

        expect(response.statusCode).toBe(200);
        expect(repository.getSubmodel).toHaveBeenCalledWith(
            'http://www.fraunhofer.de/sm/test-submodel',
            'deep',
            'withoutBlobValue',
        );
        expect(response.body).toEqual(sm);
    });

    it('GET: /submodels/{smId}', async () => {
        const sm: aas.Submodel = {
            id: 'http://www.fraunhofer.de/sm/test-submodel',
            idShort: 'test-submodel',
            modelType: 'Submodel',
        };

        repository.getSubmodel.mockResolvedValue(sm);
        const smId = 'aHR0cDovL3d3dy5mcmF1bmhvZmVyLmRlL3NtL3Rlc3Qtc3VibW9kZWw';
        const response = await request(app).get(`/api/v3/submodels/${smId}`).set('x-api-key', 'this-is-an-api-key');

        expect(response.statusCode).toBe(200);
        expect(repository.getSubmodel).toHaveBeenCalledWith(
            'http://www.fraunhofer.de/sm/test-submodel',
            'deep',
            'withoutBlobValue',
        );

        expect(response.body).toEqual(sm);
    });

    it('GET: /submodels/{id}/submodel-elements/{idShortPath}/attachment', async () => {
        const file = fileURLToPath(new URL('../../test/assets/Test.pdf', import.meta.url));
        const fileResult: FileResult = {
            filename: 'Test.pdf',
            value: 'Test.pdf',
            readable: fs.createReadStream(file),
        };

        repository.getFileByPath.mockResolvedValue(fileResult);
        const id = 'aHR0cDovL3d3dy5mcmF1bmhvZmVyLmRlL3NtL3Rlc3Qtc3VibW9kZWw';
        const idShortPath = 'Collection.File';
        const response = await request(app)
            .get(`/api/v3/submodels/${id}/submodel-elements/${idShortPath}/attachment`)
            .set('x-api-key', 'this-is-an-api-key');

        expect(response.statusCode).toBe(200);
        expect(repository.getFileByPath).toHaveBeenCalledWith(
            'http://www.fraunhofer.de/sm/test-submodel',
            'Collection.File',
        );
    });

    it('PUT: /submodels/{smId}/submodel-elements/{idShortPath}/attachment', async () => {
        repository.putFileByPath.mockResolvedValue();
        const smId = 'aHR0cDovL3d3dy5mcmF1bmhvZmVyLmRlL3NtL3Rlc3Qtc3VibW9kZWw';
        const idShortPath = 'Collection.File';
        const response = await request(app)
            .put(`/api/v3/submodels/${smId}/submodel-elements/${idShortPath}/attachment`)
            .set('x-api-key', 'this-is-an-api-key')
            .attach('file', fileURLToPath(new URL('../../test/assets/Test.pdf', import.meta.url)));

        expect(response.statusCode).toBe(204);
        expect(repository.putFileByPath).toHaveBeenCalled();
    });

    it('DELETE: /submodels/{smId}/submodel-elements/{idShortPath}/attachment', async () => {
        repository.deleteFileByPath.mockResolvedValue();
        const smId = 'aHR0cDovL3d3dy5mcmF1bmhvZmVyLmRlL3NtL3Rlc3Qtc3VibW9kZWw';
        const idShortPath = 'Collection.File';
        const response = await request(app)
            .delete(`/api/v3/submodels/${smId}/submodel-elements/${idShortPath}/attachment`)
            .set('x-api-key', 'this-is-an-api-key');

        expect(response.statusCode).toBe(204);
        expect(repository.deleteFileByPath).toHaveBeenCalledWith(
            'http://www.fraunhofer.de/sm/test-submodel',
            'Collection.File',
        );
    });

    it('POST: /submodels', async () => {
        const sm: aas.Submodel = {
            id: 'http://www.fraunhofer.de/sm/test-submodel',
            idShort: 'test-submodel',
            modelType: 'Submodel',
        };

        repository.addSubmodel.mockResolvedValue(jsonization.submodelFromJsonable(toJsonValue(sm)).mustValue());
        const response = await request(app).post('/api/v3/submodels').set('x-api-key', 'this-is-an-api-key').send(sm);

        expect(response.statusCode).toBe(201);
        expect(repository.addSubmodel).toHaveBeenCalledWith(sm);
        expect(response.body).toEqual(sm);
    });

    it('GET: /submodels/{smId}/submodel-elements/{idShortPath}', async () => {
        const property: aas.Property = {
            valueType: 'xs:string',
            idShort: 'name',
            modelType: 'Property',
        };

        repository.getSubmodelElement.mockResolvedValue(property);
        const smId = 'aHR0cDovL3d3dy5mcmF1bmhvZmVyLmRlL3NtL3Rlc3Qtc3VibW9kZWw';
        const idShortPath = 'Collection.Property';
        const response = await request(app)
            .get(`/api/v3/submodels/${smId}/submodel-elements/${idShortPath}?level=core`)
            .set('x-api-key', 'this-is-an-api-key');

        expect(response.statusCode).toBe(200);
        expect(repository.getSubmodelElement).toHaveBeenCalledWith(
            'http://www.fraunhofer.de/sm/test-submodel',
            'Collection.Property',
            'core',
            'withoutBlobValue',
        );
    });

    it('GET: /submodels/{smId}/submodel-elements/{idShortPath}/$value returns string', async () => {
        repository.getSubmodelElementValue.mockResolvedValue('test-value');
        const smId = 'aHR0cDovL3d3dy5mcmF1bmhvZmVyLmRlL3NtL3Rlc3Qtc3VibW9kZWw';
        const idShortPath = 'Collection.Property';
        const response = await request(app)
            .get(`/api/v3/submodels/${smId}/submodel-elements/${idShortPath}/$value`)
            .set('x-api-key', 'this-is-an-api-key');

        expect(response.statusCode).toBe(200);
        expect(repository.getSubmodelElementValue).toHaveBeenCalledWith(
            'http://www.fraunhofer.de/sm/test-submodel',
            'Collection.Property',
            'deep',
            'withoutBlobValue',
        );
        expect(response.body).toBe('test-value');
    });

    it('GET: /submodels/{smId}/submodel-elements/{idShortPath}/$value returns number', async () => {
        repository.getSubmodelElementValue.mockResolvedValue(42);
        const smId = 'aHR0cDovL3d3dy5mcmF1bmhvZmVyLmRlL3NtL3Rlc3Qtc3VibW9kZWw';
        const idShortPath = 'Collection.Property';
        const response = await request(app)
            .get(`/api/v3/submodels/${smId}/submodel-elements/${idShortPath}/$value?level=core`)
            .set('x-api-key', 'this-is-an-api-key');

        expect(response.statusCode).toBe(200);
        expect(repository.getSubmodelElementValue).toHaveBeenCalledWith(
            'http://www.fraunhofer.de/sm/test-submodel',
            'Collection.Property',
            'core',
            'withoutBlobValue',
        );
        expect(response.body).toBe(42);
    });

    it('GET: /submodels/{smId}/submodel-elements/{idShortPath}/$value returns boolean', async () => {
        repository.getSubmodelElementValue.mockResolvedValue(true);
        const smId = 'aHR0cDovL3d3dy5mcmF1bmhvZmVyLmRlL3NtL3Rlc3Qtc3VibW9kZWw';
        const idShortPath = 'Collection.Property';
        const response = await request(app)
            .get(`/api/v3/submodels/${smId}/submodel-elements/${idShortPath}/$value?extent=withBlobValue`)
            .set('x-api-key', 'this-is-an-api-key');

        expect(response.statusCode).toBe(200);
        expect(repository.getSubmodelElementValue).toHaveBeenCalledWith(
            'http://www.fraunhofer.de/sm/test-submodel',
            'Collection.Property',
            'deep',
            'withBlobValue',
        );
        expect(response.body).toBe(true);
    });
});
