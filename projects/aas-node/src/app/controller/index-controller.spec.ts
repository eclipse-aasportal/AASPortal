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
import { describe, beforeEach, it, expect, Mocked, vi, afterEach } from 'vitest';
import express, { Express, json, urlencoded } from 'express';
import request from 'supertest';
import multer from 'multer';

import { createSpyObj } from '../../test/mocks.js';
import { RegisterRoutes } from '../routes/routes.js';
import { Authentication } from './authentication.js';
import { errorHandler } from '../../test/assets/error-handler.js';
import { AAS_INDEX, AASIndex } from '../index/aas-index.js';
import { EndpointProvider } from '../provider/endpoint-provider.js';
import { COOKIE_STORE, CookieStorage } from '../cookie-storage/cookie-storage.js';

describe('IndexController', () => {
    let app: Express;
    let provider: Mocked<EndpointProvider>;
    let authentication: Mocked<Authentication>;
    let index: Mocked<AASIndex>;
    let cookieStorage: Mocked<CookieStorage>;

    beforeEach(() => {
        provider = createSpyObj<EndpointProvider>(['clearIndex']);
        index = createSpyObj<AASIndex>(['getEndpoints', 'getEndpointCount', 'getCount']);
        authentication = createSpyObj<Authentication>(['authentication']);
        authentication.authentication.mockResolvedValue({ id: 'john.doe@email.com', name: 'John Doe', role: 'editor' });
        cookieStorage = createSpyObj<CookieStorage>(['getEndpoints', 'updatesEndpoints']);

        container.registerInstance(EndpointProvider, provider);
        container.registerInstance(Authentication, authentication);
        container.registerInstance(AAS_INDEX, index);
        container.registerInstance(COOKIE_STORE, cookieStorage);

        app = express();
        app.use(json());
        app.use(urlencoded({ extended: true }));
        app.set('trust proxy', 1);
        app.use((req, res, next) => {
            req.user = { id: 'john.doe@email.com', name: 'John Doe', role: 'editor', client_id: 'client-123' };
            next();
        });

        RegisterRoutes(app, { multer: multer({ dest: os.tmpdir() }) });
        app.use(errorHandler);
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    it('DELETE: /api/v1/index/clear-index', async () => {
        provider.clearIndex.mockResolvedValue(void 0);
        const response = await request(app).delete('/api/v1/index/clear-index');
        expect(response.statusCode).toBe(204);
        expect(provider.clearIndex).toHaveBeenCalled();
    });

    it('DELETE: /api/v1/index/{name}/clear-index', async () => {
        provider.clearIndex.mockResolvedValue(void 0);
        const response = await request(app).delete('/api/v1/index/U2FtcGxlcw/clear-index');
        expect(response.statusCode).toBe(204);
        expect(provider.clearIndex).toHaveBeenCalledWith('Samples');
    });
});
