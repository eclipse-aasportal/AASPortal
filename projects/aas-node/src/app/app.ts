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

import { RegisterRoutes } from './routes/routes.js';
import { Variable } from './variable.js';
import { LOGGER, Logger } from './logging/logger.js';
import { errorHandler } from './error-handler.js';

@singleton()
export class App {
    private _swaggerDoc?: JsonObject;

    private get swaggerDoc(): JsonObject {
        if (this._swaggerDoc === undefined) {
            this._swaggerDoc = JSON.parse(
                fs.readFileSync(path.join(this.variable.ASSETS, 'swagger.json')).toString(),
            ) as JsonObject;
        }

        return this._swaggerDoc;
    }

    public constructor(
        @inject(LOGGER) private readonly logger: Logger,
        @inject(Variable) private readonly variable: Variable,
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

        this.app.use(
            cors({
                origin: this.variable.CORS_ORIGIN,
                credentials: true,
            }),
        );

        this.app.use(compression());
        this.app.use(json());
        this.app.use(urlencoded({ extended: true }));
        this.app.use(morgan('dev'));
        this.app.use(['/swagger', '/docs'], swaggerUi.serve, swaggerUi.setup(this.swaggerDoc));

        RegisterRoutes(this.app, { multer: multer({ dest: os.tmpdir() }) });

        const spaRoutes = [
            '/',
            '/start',
            '/shells',
            '/aas',
            '/views',
            '/dashboard',
            '/about',
            '/views/CustomerFeedback',
            '/views/Nameplate',
            '/views/DigitalProductPassport',
            '/views/HandoverDocumentation',
            '/views/Browser',
            '/views/Laser',
        ];

        this.app.get(spaRoutes, this.getIndex);

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
        this.app.use(this.notFoundHandler);
    }

    private notFoundHandler = (req: Request, res: Response): void => {
        this.logger.warning(
            `[NotFound] ${req.method} ${req.originalUrl} (path: ${req.path}) (accept: ${req.headers.accept ?? 'n/a'})`,
        );
        res.status(404).send({
            message: 'Not Found',
        });
    };

    private getIndex = (req: Request, res: Response): void => {
        this.logger.info(`[SPA] Serving index.html for ${req.method} ${req.originalUrl} (path: ${req.path})`);
        res.sendFile(this.variable.WEB_ROOT + '/index.html');
    };
}