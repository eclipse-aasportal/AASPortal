/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { container } from 'tsyringe';
import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import express, { Express, json, urlencoded } from 'express';
import morgan from 'morgan';
import request from 'supertest';
import { TemplateDescriptor, aas } from 'common';

import { Logger } from '../../app/logging/logger.js';
import { AuthService } from '../../app/auth/auth-service.js';
import { createSpyObj } from '../utils.js';
import { Variable } from '../../app/variable.js';
import { getToken, guestPayload } from '../assets/json-web-token.js';
import { RegisterRoutes } from '../../app/routes/routes.js';
import { Authentication } from '../../app/controller/authentication.js';
import { errorHandler } from '../assets/error-handler.js';
import { TemplateStorage } from '../../app/template/template-storage.js';

describe('TemplateController', () => {
    let app: Express;
    let logger: Logger;
    let auth: jest.Mocked<AuthService>;
    let templateStorage: jest.Mocked<TemplateStorage>;
    let variable: jest.Mocked<Variable>;
    let authentication: jest.Mocked<Authentication>;

    beforeEach(() => {
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

        templateStorage = createSpyObj<TemplateStorage>(['readTemplatesAsync', 'readTemplateAsync']);
        authentication = createSpyObj<Authentication>(['checkAsync']);
        authentication.checkAsync.mockResolvedValue(guestPayload);

        container.registerInstance(AuthService, auth);
        container.registerInstance('Logger', logger);
        container.registerInstance(Variable, variable);
        container.registerInstance(TemplateStorage, templateStorage);
        container.registerInstance(Authentication, authentication);

        app = express();
        app.use(json());
        app.use(urlencoded({ extended: true }));
        app.use(morgan('dev'));
        app.set('trust proxy', 1);

        RegisterRoutes(app);
        app.use(errorHandler);
    });

    it('getTemplates: /api/v1/templates', async () => {
        const templates: TemplateDescriptor[] = [
            { idShort: 'TestTemplate', id: 'http://localhost:1234/a/b/c', modelType: 'Submodel' },
        ];

        templateStorage.readTemplatesAsync.mockResolvedValue(templates);
        const response = await request(app).get('/api/v1/templates').set('Authorization', `Bearer ${getToken()}`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual(templates);
        expect(templateStorage.readTemplatesAsync).toHaveBeenCalled();
    });

    it('getTemplate: /api/v1/templates/{path}', async () => {
        const template: aas.Submodel = {
            modelType: 'Submodel',
            id: 'http://localhost:1234/a/b/c',
            idShort: 'TestSubmodel',
        };

        templateStorage.readTemplateAsync.mockResolvedValue(template);
        const response = await request(app)
            .get('/api/v1/templates/cGF0aC90by9UZXN0U3VibW9kZWwuanNvbg')
            .set('Authorization', `Bearer ${getToken()}`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual(template);
        expect(templateStorage.readTemplateAsync).toHaveBeenCalledWith('path/to/TestSubmodel.json');
    });
});
