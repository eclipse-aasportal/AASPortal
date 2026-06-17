/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { describe, beforeEach, it, expect, Mocked } from 'vitest';
import os from 'os';
import { container } from 'tsyringe';
import express, { Express, json, urlencoded } from 'express';
import morgan from 'morgan';
import request from 'supertest';
import multer from 'multer';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { aas } from 'aas-core';

import { LOGGER, Logger } from '../../app/logging/logger.js';
import { Variable } from '../../app/variable.js';
import { RegisterRoutes } from '../../app/routes/routes.js';
import { Authentication } from '../../app/controller/authentication.js';
import { errorHandler } from '../../app/error-handler.js';
import { ShellRepository } from '../../app/shell-repository.js';
import { createSpyObj } from '../mocks.js';

describe('ShellsController', () => {
    let app: Express;
    let logger: Logger;
    let variable: Mocked<Variable>;
    let authentication: Mocked<Authentication>;
    let repository: Mocked<ShellRepository>;

    beforeEach(() => {
        logger = createSpyObj<Logger>(['error', 'warning', 'info']);
        variable = createSpyObj<Variable>({}, {});
        repository = createSpyObj<ShellRepository>([
            'addShell',
            'deleteThumbnail',
            'getAssetInformation',
            'getShell',
            'getShells',
            'getThumbnail',
            'updateShell',
            'updateThumbnail',
        ]);

        authentication = createSpyObj<Authentication>(['expressAuthentication']);
        authentication.expressAuthentication.mockResolvedValue({ label: 'test-user' });

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
        const response = await request(app).get('/api/v3/shells').set('x-api-key', 'this-is-an-api-key');
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
            .set('x-api-key', 'this-is-an-api-key');

        expect(response.statusCode).toBe(200);
        expect(repository.getShell).toHaveBeenCalledWith('http://www.fraunhofer.de/aas/test-aas');
        expect(response.body).toEqual(shell);
    });

    it('GET: /shells/{id}/asset-information', async () => {
        const info: aas.AssetInformation = { assetKind: 'Instance' };
        repository.getAssetInformation.mockResolvedValue(info);
        const response = await request(app)
            .get('/api/v3/shells/aHR0cDovL3d3dy5mcmF1bmhvZmVyLmRlL2Fhcy90ZXN0LWFhcw/asset-information')
            .set('x-api-key', 'this-is-an-api-key');

        expect(response.statusCode).toBe(200);
        expect(repository.getAssetInformation).toHaveBeenCalledWith('http://www.fraunhofer.de/aas/test-aas');
    });

    it('GET: /shells/{id}/asset-information/thumbnail', async () => {
        const file = fileURLToPath(new URL('../assets/MotorI40.JPG', import.meta.url));
        repository.getThumbnail.mockResolvedValue({
            filename: 'MotorI40.JPG',
            value: 'MotorI40.JPG',
            readable: fs.createReadStream(file),
            size: fs.statSync(file).size,
        });

        const response = await request(app)
            .get('/api/v3/shells/aHR0cDovL3d3dy5mcmF1bmhvZmVyLmRlL2Fhcy90ZXN0LWFhcw/asset-information/thumbnail')
            .set('x-api-key', 'this-is-an-api-key');

        expect(response.statusCode).toBe(200);
        expect(response.headers['content-type']).toEqual('image/jpeg');
        expect(repository.getThumbnail).toHaveBeenCalledWith('http://www.fraunhofer.de/aas/test-aas');
    });

    it('PUT: /shells/{id}/asset-information/thumbnail', async () => {
        const file = fileURLToPath(new URL('../assets/thumbnail.png', import.meta.url));
        repository.updateThumbnail.mockResolvedValue();
        const response = await request(app)
            .put('/api/v3/shells/aHR0cDovL3d3dy5mcmF1bmhvZmVyLmRlL2Fhcy90ZXN0LWFhcw/asset-information/thumbnail')
            .set('x-api-key', 'this-is-an-api-key')
            .attach('file', file);

        expect(response.statusCode).toBe(204);
        expect(repository.updateThumbnail).toHaveBeenCalled();
    });

    it('DELETE: /shells/{id}/asset-information/thumbnail', async () => {
        repository.deleteThumbnail.mockResolvedValue();
        const response = await request(app)
            .delete('/api/v3/shells/aHR0cDovL3d3dy5mcmF1bmhvZmVyLmRlL2Fhcy90ZXN0LWFhcw/asset-information/thumbnail')
            .set('x-api-key', 'this-is-an-api-key');

        expect(response.statusCode).toBe(204);
        expect(repository.deleteThumbnail).toHaveBeenCalled();
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

        repository.addShell.mockResolvedValue(aas);
        const response = await request(app).post('/api/v3/shells').set('x-api-key', 'this-is-an-api-key').send(aas);

        expect(response.statusCode).toBe(201);
        expect(repository.addShell).toHaveBeenCalled();
    });

    it('PUT: /shells', async () => {
        const aas: aas.AssetAdministrationShell = {
            assetInformation: {
                assetKind: 'Instance',
            },
            id: 'http://www.fraunhofer.de/sm/test-aas',
            idShort: 'TestAAS',
            modelType: 'AssetAdministrationShell',
            submodels: [],
        };

        repository.updateShell.mockResolvedValue(aas);
        const response = await request(app).put('/api/v3/shells').set('x-api-key', 'this-is-an-api-key').send(aas);

        expect(response.statusCode).toBe(200);
        expect(repository.updateShell).toHaveBeenCalled();
    });
});
