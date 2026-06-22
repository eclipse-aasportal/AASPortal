/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import path from 'path';
import fs from 'fs';
import os from 'os';
import { inject, singleton } from 'tsyringe';
import express, { Express, Request, Response, json, urlencoded } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import compression from 'compression';
import multer from 'multer';
import cookieParser from 'cookie-parser';
import session from 'express-session';

import { LOGGER, Logger } from 'aas-package';

import { RegisterRoutes } from './routes/routes.js';
import { Variable } from './variable.js';
import { errorHandler } from './error-handler.js';
import { IDENTITY_PROVIDER, IdentityProviderClient } from './auth/identity-provider-client.js';

@singleton()
export class App {
    private swaggerHtml?: string;

    public constructor(
        @inject(LOGGER) private readonly logger: Logger,
        @inject(Variable) private readonly variable: Variable,
        @inject(IDENTITY_PROVIDER) private readonly identityProvider: IdentityProviderClient,
    ) {
        this.app = express();
        this.setup();
    }

    public readonly app: Express;

    private setup(): void {
        process.on('uncaughtException', (error: Error) => {
            this.logger.error(`Uncaught exception: ${error?.message} Stack: ${error?.stack}`);
        });

        process.on('unhandledRejection', (reason, promise) => {
            this.logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
        });

        this.app.set('trust proxy', true);

        this.app.use(
            cors({
                origin: this.variable.CORS_ORIGIN,
                allowedHeaders: ['Origin', 'Content-Type', 'Authorization'],
                credentials: true,
                maxAge: 86400,
            }),
        );

        this.app.use(cookieParser());
        this.app.use(
            session({
                saveUninitialized: false,
                secret: this.variable.SESSION_SECRET,
                resave: true,
            }),
        );

        this.app.use(this.identityProvider.middleware());
        this.app.use(compression());
        this.app.use(json());
        this.app.use(urlencoded({ extended: true }));
        this.app.use(morgan('dev'));
        this.app.use(
            ['/api/swagger', '/api/docs'],
            swaggerUi.serve,
            async (_req: express.Request, res: express.Response) => {
                res.send(await this.getSwaggerHtml());
            },
        );

        this.app.get('/api/me', async (req, res) => {
            await this.identityProvider.me(req, res);
        });

        this.app.get('/api/login', async (req, res) => {
            await this.identityProvider.login(req, res);
        });

        this.app.use('/api/callback', async (req, res) => {
            await this.identityProvider.callback(req, res);
        });

        this.app.post('/api/logout', async (req, res) => {
            await this.identityProvider.logout(req, res);
        });

        this.app.post('/api/accounts', async (req, res) => {
            await this.identityProvider.createAccount(req, res);
        });

        RegisterRoutes(this.app, { multer: multer({ dest: os.tmpdir() }) });

        this.app.use(express.static(this.variable.WEB_ROOT));
        this.app.use(errorHandler);
        this.app.use((req: Request, res: Response) => {
            if (req.method === 'GET' && req.accepts('html')) {
                const file = path.join(this.variable.WEB_ROOT, 'index.html');
                if (fs.existsSync(file)) {
                    return res.sendFile(file);
                }
            }

            return res.status(404).send({ name: 'ApplicationError', message: 'Not Found' });
        });
    }

    private async getSwaggerHtml(): Promise<string> {
        if (this.swaggerHtml === undefined) {
            this.swaggerHtml = swaggerUi.generateHTML(
                JSON.parse((await fs.promises.readFile(path.join(this.variable.ASSETS, 'swagger.json'))).toString()),
            );
        }

        return this.swaggerHtml;
    }
}
