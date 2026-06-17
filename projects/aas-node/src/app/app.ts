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
import swaggerUi, { JsonObject } from 'swagger-ui-express';
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
    private swaggerDoc?: JsonObject;

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
        this.app.use(['/swagger', '/docs'], swaggerUi.serve, async () => {
            return swaggerUi.setup(await this.getSwaggerDoc());
        });

        this.app.get('/api/me', async (req, res) => {
            res.json(req.user ?? null);
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

        this.app.get(/^\/(?!api|assets|media).*/, (req, res, next) => {
            const acceptsHtml = (req.headers.accept ?? '').includes('text/html');

            if (!acceptsHtml) {
                return next();
            }

            if (req.originalUrl.includes(';')) {
                this.logger.info(
                    `[SPA] Matrix params detected for ${req.method} ${req.originalUrl} (path: ${req.path})`,
                );
                return this.getIndex(req, res);
            }

            if (spaRoutes.some(route => req.path.startsWith(route))) {
                return this.getIndex(req, res);
            }

            return next();
        });

        this.app.use(errorHandler);
        this.app.use((req: Request, res: Response) => {
            if (req.method === 'GET' && req.accepts('html')) {
                res.sendFile(this.variable.WEB_ROOT + '/index.html');
            } else {
                res.status(404).send({ message: 'Not Found' });
            }
        });
    }

    private async getSwaggerDoc(): Promise<JsonObject> {
        if (this.swaggerDoc === undefined) {
            this.swaggerDoc = JSON.parse(
                (await fs.promises.readFile(path.join(this.variable.ASSETS, 'swagger.json'))).toString(),
            ) as JsonObject;
        }

        return this.swaggerDoc;
    }
}
