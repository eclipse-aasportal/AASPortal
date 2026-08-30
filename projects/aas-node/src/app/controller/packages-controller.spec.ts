/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import os from 'os';
import { container } from 'tsyringe';
import { describe, beforeEach, it, expect, Mocked } from 'vitest';
import express, { Express, json, urlencoded } from 'express';
import { Readable } from 'stream';
import request from 'supertest';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { LOGGER, Logger } from 'aas-package';

import { createSpyObj } from '../../test/mocks.js';
import { RegisterRoutes } from '../routes/routes.js';
import { Authentication } from './authentication.js';
import { errorHandler } from '../../test/assets/error-handler.js';
import { PackageProvider } from '../provider/package-provider.js';

describe('PackagesController', () => {
    let app: Express;
    let logger: Logger;
    let provider: Mocked<PackageProvider>;
    let authentication: Mocked<Authentication>;

    beforeEach(() => {
        logger = createSpyObj<Logger>(['error', 'warning', 'info']);
        provider = createSpyObj<PackageProvider>(['getPackage', 'insertPackages', 'deletePackage']);
        authentication = createSpyObj<Authentication>(['authentication']);
        authentication.authentication.mockResolvedValue({ id: 'john.doe@email.com', name: 'John Doe', role: 'user' });

        container.registerInstance(LOGGER, logger);
        container.registerInstance(PackageProvider, provider);
        container.registerInstance(Authentication, authentication);

        app = express();
        app.use(json());
        app.use(urlencoded({ extended: true }));
        app.set('trust proxy', 1);

        RegisterRoutes(app, { multer: multer({ dest: os.tmpdir() }) });
        app.use(errorHandler);
    });

    it('GET: /api/v1/endpoints/{endpoint}/packages/{id}', async () => {
        provider.getPackage.mockReturnValue(
            new Promise<Readable>(resolve => {
                const s = new Readable();
                s.push('Hello World!');
                s.push(null);
                resolve(s);
            }),
        );

        const response = await request(app).get(
            `/api/v1/endpoints/U2FtcGxl/packages/aHR0cDovL2N1c3RvbWVyLmNvbS9hYXMvOTE3NV83MDEzXzcwOTFfOTE2OA`,
        );

        expect(response.statusCode).toBe(200);
        expect(response.body).toBeTruthy();
        expect(provider.getPackage).toHaveBeenCalledWith(
            'Sample',
            'http://customer.com/aas/9175_7013_7091_9168',
            undefined,
        );
    });

    it('POST: /api/v1/endpoints/{endpoint}/packages', async () => {
        const response = await request(app)
            .post('/api/v1/endpoints/U2FtcGxl/packages')
            .attach('file', fileURLToPath(new URL('../../test/assets/samples/example-motor.aasx', import.meta.url)));

        expect(response.statusCode).toBe(204);
        expect(provider.insertPackages).toHaveBeenCalled();
        expect(provider.insertPackages.mock.calls[0][0]).toBe('Sample');
    });

    it('DELETE: /api/v1/endpoints/{endpoint}/packages/{id}', async () => {
        const response = await request(app).delete(
            '/api/v1/endpoints/U2FtcGxl/packages/aHR0cDovL2N1c3RvbWVyLmNvbS9hYXMvOTE3NV83MDEzXzcwOTFfOTE2OA',
        );

        expect(response.statusCode).toBe(204);
        expect(provider.deletePackage).toHaveBeenCalledWith(
            'Sample',
            'http://customer.com/aas/9175_7013_7091_9168',
            undefined,
        );
    });
});
