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
import request from 'supertest';
import multer from 'multer';
import { encodeBase64Url, LOGGER, Logger } from 'aas-package';

import { Variable } from '../variable.js';
import { RegisterRoutes } from '../routes/routes.js';
import { errorHandler } from '../error-handler.js';
import { Authentication } from './authentication.js';
import { createSpyObj } from '../../test/mocks.js';
import { Discovery } from '../discovery.js';

describe('DiscoveryController', () => {
    let app: Express;
    let logger: Logger;
    let variable: Mocked<Variable>;
    let authentication: Mocked<Authentication>;
    let discovery: Mocked<Discovery>;

    beforeEach(() => {
        logger = createSpyObj<Logger>(['error', 'warning', 'info']);
        variable = createSpyObj<Variable>({}, {});
        discovery = createSpyObj<Discovery>(['getAASIdsByAssetLink']);

        authentication = createSpyObj<Authentication>(['expressAuthentication']);
        authentication.expressAuthentication.mockResolvedValue({ label: 'test-user' });

        container.registerInstance(LOGGER, logger);
        container.registerInstance(Variable, variable);
        container.registerInstance(Authentication, authentication);
        container.registerInstance(Discovery, discovery);

        app = express();
        app.use(json());
        app.use(urlencoded({ extended: true }));
        app.set('trust proxy', 1);

        RegisterRoutes(app, { multer: multer({ dest: os.tmpdir() }) });
        app.use(errorHandler);
    });

    it('GET: /lookup/shells', async () => {
        discovery.getAASIdsByAssetLink.mockResolvedValue({ result: [], paging_metadata: {} });
        const cursor = encodeBase64Url(JSON.stringify({ previous: null, next: null }));
        const response = await request(app)
            .get('/api/v3/lookup/shells')
            .query({ assetIds: [encodeBase64Url('AssetLink1')], limit: 123, cursor })
            .set('x-api-key', 'this-is-an-api-key');

        expect(response.statusCode).toBe(200);
        expect(discovery.getAASIdsByAssetLink).toHaveBeenCalledWith(['AssetLink1'], 123, cursor);
        expect(response.body).toEqual({ result: [], paging_metadata: {} });
    });
});
