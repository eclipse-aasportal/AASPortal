/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { container } from 'tsyringe';
import express, { Express, json, urlencoded } from 'express';
import morgan from 'morgan';
import request from 'supertest';
import { Logger } from '../../app/logging/logger.js';
import { Message, AppInfo } from 'aas-core';
import { describe, beforeEach, it, expect, jest } from '@jest/globals';

import { ApplicationInfo } from '../../app/application-info.js';
import { AuthService } from '../../app/auth/auth-service.js';
import { createSpyObj } from 'fhg-jest';
import { Variable } from '../../app/variable.js';
import { getToken, guestPayload } from '../assets/json-web-token.js';
import { RegisterRoutes } from '../../app/routes/routes.js';
import { Authentication } from '../../app/controller/authentication.js';
import { errorHandler } from '../assets/error-handler.js';

describe('AppController', function () {
    let app: Express;
    let logger: Logger;
    let auth: jest.Mocked<AuthService>;
    let applicationInfo: jest.Mocked<ApplicationInfo>;
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

        applicationInfo = createSpyObj<ApplicationInfo>(['getAsync', 'getMessages']);

        authentication = createSpyObj<Authentication>(['checkAsync']);
        authentication.checkAsync.mockResolvedValue(guestPayload);

        container.registerInstance(AuthService, auth);
        container.registerInstance('Logger', logger);
        container.registerInstance(Variable, variable);
        container.registerInstance(ApplicationInfo, applicationInfo);
        container.registerInstance(Authentication, authentication);

        app = express();
        app.use(json());
        app.use(urlencoded({ extended: true }));
        app.use(morgan('dev'));
        app.set('trust proxy', 1);

        RegisterRoutes(app);
        app.use(errorHandler);
    });

    it('getInfo: /api/v1/app/info', async function () {
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
        const response = await request(app).get('/api/v1/app/info').set('Authorization', `Bearer ${getToken()}`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual(data);
    });

    it('getMessages: /api/v1/app/messages', async function () {
        const messages: Message[] = [
            { type: 'Info', text: 'An information.', timestamp: 0 },
            { type: 'Error', text: 'An error.', timestamp: 1 },
        ];

        applicationInfo.getMessages.mockReturnValue(messages);
        const response = await request(app).get('/api/v1/app/messages').set('Authorization', `Bearer ${getToken()}`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual(messages);
    });
});