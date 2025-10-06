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
import { resolve } from 'path';
import fs from 'fs';
import { aas, jsonization, types } from 'aas-core';

import { LOGGER, Logger } from '../../app/logging/logger.js';
import { Variable } from '../../app/variable.js';
import { RegisterRoutes } from '../../app/routes/routes.js';
import { Authentication } from '../../app/controller/authentication.js';
import { createSpyObj } from '../create-spy-obj.js';
import { errorHandler } from '../../app/error-handler.js';
import { getToken } from '../json-web-token.js';
import { ShellRepository } from '../../app/shell-repository.js';
import { toJsonValue } from '../../app/utilities.js';

describe('ShellsController', () => {
    let app: Express;
    let logger: Logger;
    let variable: jest.Mocked<Variable>;
    let authentication: jest.Mocked<Authentication>;
    let repository: jest.Mocked<ShellRepository>;

    beforeEach(() => {
        logger = createSpyObj<Logger>(['error', 'warning', 'info']);
        variable = createSpyObj<Variable>({}, { JWT_SECRET: 'SecretSecretSecretSecretSecretSecret' });
        repository = createSpyObj<ShellRepository>([
            'getShells',
            'getShell',
            'getAssetInformation',
            'getThumbnail',
            'updateThumbnail',
            'deleteThumbnail',
            'getSubmodel',
            'getSubmodelElement',
            'addShell',
        ]);

        authentication = createSpyObj<Authentication>(['expressAuthentication']);
        authentication.expressAuthentication.mockResolvedValue({});

        container.registerInstance(LOGGER, logger);
        container.registerInstance(Variable, variable);
        container.registerInstance(Authentication, authentication);
        container.registerInstance(ShellRepository, repository);

        app = express();
        app.use(json());
        app.use(urlencoded({ extended: true }));
        app.use(morgan('dev'));
        app.set('trust proxy', 1);

        RegisterRoutes(app, { multer: multer({ dest: os.tmpdir() }) });
        app.use(errorHandler);
    });

    it('GET: /shells', async () => {
        repository.getShells.mockResolvedValue({ result: [], paging_metadata: {} });
        const response = await request(app).get('/api/v3/shells').set('Authorization', `Bearer ${getToken()}`);
        expect(response.statusCode).toBe(200);
        expect(repository.getShells).toHaveBeenCalled();
        expect(response.body).toEqual({ result: [], paging_metadata: {} });
    });

    it('GET: /shells/{id}', async () => {
        const shell: aas.AssetAdministrationShell = {
            assetInformation: {
                assetKind: 'Instance',
            },
            id: 'http://www.fraunhofer.de/aas/test-aas',
            idShort: 'TestShell',
            modelType: 'AssetAdministrationShell',
        };

        repository.getShell.mockResolvedValue(shell);
        const response = await request(app)
            .get('/api/v3/shells/aHR0cDovL3d3dy5mcmF1bmhvZmVyLmRlL2Fhcy90ZXN0LWFhcw')
            .set('Authorization', `Bearer ${getToken()}`);

        expect(response.statusCode).toBe(200);
        expect(repository.getShell).toHaveBeenCalledWith('http://www.fraunhofer.de/aas/test-aas');
        expect(response.body).toEqual(shell);
    });

    it('GET: /shells/{id}/asset-information', async () => {
        const info: aas.AssetInformation = { assetKind: 'Instance' };
        repository.getAssetInformation.mockResolvedValue(info);
        const response = await request(app)
            .get('/api/v3/shells/aHR0cDovL3d3dy5mcmF1bmhvZmVyLmRlL2Fhcy90ZXN0LWFhcw/asset-information')
            .set('Authorization', `Bearer ${getToken()}`);

        expect(response.statusCode).toBe(200);
        expect(repository.getAssetInformation).toHaveBeenCalledWith('http://www.fraunhofer.de/aas/test-aas');
    });

    it('GET: /shells/{id}/asset-information/thumbnail', async () => {
        const file = resolve('./src/test/assets/MotorI40.JPG');
        repository.getThumbnail.mockResolvedValue({
            filename: 'MotorI40.JPG',
            readable: fs.createReadStream(file),
            size: fs.statSync(file).size,
        });

        const response = await request(app)
            .get('/api/v3/shells/aHR0cDovL3d3dy5mcmF1bmhvZmVyLmRlL2Fhcy90ZXN0LWFhcw/asset-information/thumbnail')
            .set('Authorization', `Bearer ${getToken()}`);

        expect(response.statusCode).toBe(200);
        expect(response.headers['content-type']).toEqual('image/jpeg');
        expect(repository.getThumbnail).toHaveBeenCalledWith('http://www.fraunhofer.de/aas/test-aas');
    });

    it('PUT: /shells/{id}/asset-information/thumbnail', async () => {
        const file = resolve('./src/test/assets/thumbnail.png');
        repository.updateThumbnail.mockResolvedValue();
        const response = await request(app)
            .put('/api/v3/shells/aHR0cDovL3d3dy5mcmF1bmhvZmVyLmRlL2Fhcy90ZXN0LWFhcw/asset-information/thumbnail')
            .set('Authorization', `Bearer ${getToken()}`)
            .attach('file', file);

        expect(response.statusCode).toBe(204);
        expect(repository.updateThumbnail).toHaveBeenCalled();
    });

    it('DELETE: /shells/{id}/asset-information/thumbnail', async () => {
        repository.deleteThumbnail.mockResolvedValue();
        const response = await request(app)
            .delete('/api/v3/shells/aHR0cDovL3d3dy5mcmF1bmhvZmVyLmRlL2Fhcy90ZXN0LWFhcw/asset-information/thumbnail')
            .set('Authorization', `Bearer ${getToken()}`);

        expect(response.statusCode).toBe(204);
        expect(repository.deleteThumbnail).toHaveBeenCalled();
    });

    it('GET: /shells/{aasId}/submodels/{smId}', async () => {
        const sm: aas.Submodel = {
            id: 'http://www.fraunhofer.de/sm/test-submodel',
            idShort: 'test-submodel',
            modelType: 'Submodel',
        };

        repository.getSubmodel.mockResolvedValue(sm);
        const aasId = 'aHR0cDovL3d3dy5mcmF1bmhvZmVyLmRlL2Fhcy90ZXN0LWFhcw';
        const smId = 'aHR0cDovL3d3dy5mcmF1bmhvZmVyLmRlL3NtL3Rlc3Qtc3VibW9kZWw';
        const response = await request(app)
            .get(`/api/v3/shells/${aasId}/submodels/${smId}`)
            .set('Authorization', `Bearer ${getToken()}`);

        expect(response.statusCode).toBe(200);
        expect(repository.getSubmodel).toHaveBeenCalledWith(
            'http://www.fraunhofer.de/aas/test-aas',
            'http://www.fraunhofer.de/sm/test-submodel',
            'deep',
            'withoutBlobValue',
        );

        expect(response.body).toEqual(sm);
    });

    it('GET: /shells/{aasId}/submodels/{smId}/submodel-elements/{idShortPath}', async () => {
        const property: aas.Property = {
            valueType: 'xs:string',
            idShort: 'name',
            modelType: 'Property',
        };

        repository.getSubmodelElement.mockResolvedValue(property);
        const aasId = 'aHR0cDovL3d3dy5mcmF1bmhvZmVyLmRlL2Fhcy90ZXN0LWFhcw';
        const smId = 'aHR0cDovL3d3dy5mcmF1bmhvZmVyLmRlL3NtL3Rlc3Qtc3VibW9kZWw';
        const idShortPath = 'Collection.Property';
        const response = await request(app)
            .get(`/api/v3/shells/${aasId}/submodels/${smId}/submodel-elements/${idShortPath}?level=core`)
            .set('Authorization', `Bearer ${getToken()}`);

        expect(response.statusCode).toBe(200);
        expect(repository.getSubmodelElement).toHaveBeenCalledWith(
            'http://www.fraunhofer.de/aas/test-aas',
            'http://www.fraunhofer.de/sm/test-submodel',
            'Collection.Property',
            'core',
            'withoutBlobValue',
        );
    });

    it('POST: /shells', async () => {
        const aas: aas.AssetAdministrationShell = {
            assetInformation: {
                assetKind: 'Instance',
            },
            id: 'http://www.fraunhofer.de/sm/test-aas',
            idShort: 'TestAAS',
            modelType: 'AssetAdministrationShell',
            submodels: [],
        };

        const coreAAS = jsonization.assetAdministrationShellFromJsonable(toJsonValue(aas)).mustValue();
        repository.addShell.mockResolvedValue(coreAAS);
        const response = await request(app)
            .post('/api/v3/shells')
            .set('Authorization', `Bearer ${getToken()}`)
            .send(aas);

        expect(response.statusCode).toBe(201);
        expect(repository.addShell).toHaveBeenCalled();
    });
});
