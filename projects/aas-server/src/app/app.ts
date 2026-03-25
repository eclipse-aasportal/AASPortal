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
import multer from 'multer';
import { inject, singleton } from 'tsyringe';
import express, { Express, Request, Response, json, urlencoded } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import swaggerUi, { JsonObject } from 'swagger-ui-express';
import cookieParser from 'cookie-parser';
import compression from 'compression';

import { Variable } from './variable.js';
import { LOGGER, Logger } from './logging/logger.js';
import { RegisterRoutes } from './routes/routes.js';
import { errorHandler } from './error-handler.js';

const shutdownTime = 15000;

@singleton()
export class App {
    private swaggerDoc?: JsonObject;
    private verifiers = new Map<string, string>();

    private get swaggerDocument(): JsonObject {
        if (this.swaggerDoc === undefined) {
            this.swaggerDoc = JSON.parse(
                fs.readFileSync(path.join(this.variable.ASSETS, 'swagger.json')).toString(),
            ) as JsonObject;
        }

        return this.swaggerDoc;
    }

    public constructor(
        @inject(LOGGER) private readonly logger: Logger,
        @inject(Variable) private readonly variable: Variable,
    ) {
        this.app = express();
        this.setup();
    }

    public online = true;

    public readonly app: Express;

    private setup(): void {
        process.on('uncaughtException', (error: Error) => {
            this.logger.error(`Uncaught exception: ${error?.message} Stack: ${error?.stack}`);
        });

        process.on('unhandledRejection', (reason, promise) => {
            this.logger.error(`Unhandled rejection at: ${promise}, reason: ${reason}`);
        });

        this.app.use(
            cors({
                origin: this.variable.CORS_ORIGIN,
                credentials: true,
            }),
        );

        this.app.use(compression());
        this.app.use(cookieParser());
        this.app.use(json());
        this.app.use(urlencoded({ extended: true }));
        this.app.use(morgan('dev'));
        this.app.use(['/docs', '/swagger'], swaggerUi.serve, swaggerUi.setup(this.swaggerDocument));
        this.app.use('/health-check', (req, res) => {
            if (this.online) {
                res.send('OK');
            } else {
                res.status(503).send('Server shutting down');
            }
        });

        this.app.use('/long-response', (req, res) => {
            setTimeout(() => res.send('Finally! OK'), shutdownTime);
        });

        RegisterRoutes(this.app, { multer: multer({ dest: os.tmpdir() }) });

        if (this.variable.ENABLE_STATIC_FILES) {
            this.app.use(express.static(this.variable.WEB_ROOT));
        }

        this.app.use(errorHandler);
        this.app.use(this.notFoundHandler);
    }

    private notFoundHandler = (_req: Request, res: Response): void => {
        res.status(404).send({
            message: 'Not Found',
        });
    };
}
