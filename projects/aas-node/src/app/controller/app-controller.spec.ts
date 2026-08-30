/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { container } from 'tsyringe';
import express, { Express, json, urlencoded } from 'express';
import request from 'supertest';
import { LOGGER, Logger } from 'aas-package';
import { AppInfo } from 'aas-core';
import { describe, beforeEach, it, expect, Mocked } from 'vitest';

import { ApplicationInfo } from '../application-info.js';
import { createSpyObj } from '../../test/mocks.js';
import { Variable } from '../variable.js';
import { RegisterRoutes } from '../routes/routes.js';
import { Authentication } from './authentication.js';
import { errorHandler } from '../../test/assets/error-handler.js';

describe('AppController', () => {
    let app: Express;
    let logger: Logger;
    let applicationInfo: Mocked<ApplicationInfo>;
    let variable: Mocked<Variable>;
    let authentication: Mocked<Authentication>;

    beforeEach(() => {
        logger = createSpyObj<Logger>(['error', 'warning', 'info']);
        variable = createSpyObj<Variable>({}, {});

        applicationInfo = createSpyObj<ApplicationInfo>(['getAsync']);

        authentication = createSpyObj<Authentication>(['authentication']);
        authentication.authentication.mockResolvedValue({ id: 'john.doe@email.com', name: 'John Doe', role: 'user' });

        container.registerInstance(LOGGER, logger);
        container.registerInstance(Variable, variable);
        container.registerInstance(ApplicationInfo, applicationInfo);
        container.registerInstance(Authentication, authentication);

        app = express();
        app.use(json());
        app.use(urlencoded({ extended: true }));
        app.set('trust proxy', 1);

        RegisterRoutes(app);
        app.use(errorHandler);
    });

    it('getInfo: /api/v1/app/info', async () => {
        const data: AppInfo = {
            name: 'aas-portal-project',
            version: '2.0.0',
            description: 'Web-based visualization and control of asset administration shells.',
            author: 'Fraunhofer IOSB-INA e.V.',
            homepage: 'https://www.iosb-ina.fraunhofer.de/',
            license: 'Apache-2.0',
            libraries: [
                {
                    name: 'Library',
                    version: '1.0',
                    description: 'A library.',
                    license: 'MIT',
                    licenseText: 'License text...',
                    homepage: 'https://www.iosb-ina.fraunhofer.de/',
                },
            ],
        };

        applicationInfo.getAsync.mockReturnValue(new Promise<AppInfo>(resolve => resolve(data)));
        const response = await request(app).get('/api/v1/app/info');
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual(data);
    });
});
