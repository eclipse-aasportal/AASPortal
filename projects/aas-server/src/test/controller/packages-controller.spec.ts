/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import fs from 'fs';
import { describe, beforeEach, it, expect, Mocked } from 'vitest';
import os from 'os';
import { fileURLToPath } from 'url';
import { container } from 'tsyringe';
import express, { Express, json, urlencoded } from 'express';
import morgan from 'morgan';
import request from 'supertest';
import multer from 'multer';

import { LOGGER, Logger } from '../../app/logging/logger.js';
import { Variable } from '../../app/variable.js';
import { RegisterRoutes } from '../../app/routes/routes.js';
import { Authentication } from '../../app/controller/authentication.js';
import { errorHandler } from '../../app/error-handler.js';
import { getToken } from '../json-web-token.js';
import { PackageRepository } from '../../app/package-repository.js';
import { encodeBase64Url } from '../../app/utilities.js';
import { createSpyObj } from '../mocks.js';

describe('PackagesController', () => {
    let app: Express;
    let logger: Logger;
    let authentication: Mocked<Authentication>;
    let variable: Mocked<Variable>;
    let repository: Mocked<PackageRepository>;

    beforeEach(() => {
        logger = createSpyObj<Logger>(['error', 'warning', 'info']);
        variable = createSpyObj<Variable>({}, { JWT_SECRET: 'SecretSecretSecretSecretSecretSecret' });
        repository = createSpyObj<PackageRepository>(['add', 'delete', 'getPackage', 'update', 'getPackages']);

        authentication = createSpyObj<Authentication>(['expressAuthentication']);
        authentication.expressAuthentication.mockResolvedValue({});

        container.registerInstance(LOGGER, logger);
        container.registerInstance(Variable, variable);
        container.registerInstance(Authentication, authentication);
        container.registerInstance(PackageRepository, repository);

        app = express();
        app.use(json());
        app.use(urlencoded({ extended: true }));
        app.use(morgan('dev'));
        app.set('trust proxy', 1);

        RegisterRoutes(app, { multer: multer({ dest: os.tmpdir() }) });
        app.use(errorHandler);
    });

    it('POST: /packages', async () => {
        repository.add.mockResolvedValue('1');
        const src = fileURLToPath(new URL('../assets/example-motor.aasx', import.meta.url));
        const response = await request(app)
            .post('/api/v3/packages')
            .set('Authorization', `Bearer ${getToken()}`)
            .attach('file', src);

        expect(response.statusCode).toBe(201);
        expect(repository.add).toHaveBeenCalled();
        expect(response.body).toEqual('1');
    });

    it('DELETE: /packages/{packageId}', async () => {
        repository.delete.mockResolvedValue(void 0);
        const response = await request(app)
            .delete(`/api/v3/packages/${encodeBase64Url('1')}`)
            .set('Authorization', `Bearer ${getToken()}`);

        expect(response.statusCode).toBe(204);
        expect(repository.delete).toHaveBeenCalledWith('1');
    });

    it('GET: /packages/{packageId}', async () => {
        const file = fileURLToPath(new URL('../assets/example-motor.aasx', import.meta.url));
        repository.getPackage.mockResolvedValue({
            filename: 'example-motor.aasx',
            value: 'example-motor.aasx',
            readable: fs.createReadStream(file),
            size: fs.statSync(file).size,
        });

        const response = await request(app)
            .get(`/api/v3/packages/${encodeBase64Url('1')}`)
            .set('Authorization', `Bearer ${getToken()}`);

        expect(response.statusCode).toBe(200);
        expect(repository.getPackage).toHaveBeenCalledWith('1');
    });

    it('PUT: /packages/{packageId}', async () => {
        repository.update.mockResolvedValue(void 0);
        const src = fileURLToPath(new URL('../assets/example-motor.aasx', import.meta.url));
        const response = await request(app)
            .put('/api/v3/packages/MA')
            .set('Authorization', `Bearer ${getToken()}`)
            .attach('file', src);

        expect(response.statusCode).toBe(204);
        expect(repository.update).toHaveBeenCalled();
    });

    it('GET: /packages', async () => {
        repository.getPackages.mockResolvedValue({ result: [], paging_metadata: {} });
        const response = await request(app).get('/api/v3/packages').set('Authorization', `Bearer ${getToken()}`);
        expect(response.statusCode).toBe(200);
        expect(repository.getPackages).toHaveBeenCalled();
    });
});
