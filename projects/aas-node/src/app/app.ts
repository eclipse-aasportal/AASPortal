/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
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

import { RegisterRoutes } from './routes/routes.js';
import { Variable } from './variable.js';
import { Logger } from './logging/logger.js';
import multer from 'multer';
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
        @inject('Logger') private readonly logger: Logger,
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

        this.app.use(json());
        this.app.use(urlencoded({ extended: true }));
        this.app.use(morgan('dev'));
        this.app.use('/docs', swaggerUi.serve, swaggerUi.setup(this.swaggerDoc));

        RegisterRoutes(this.app, { multer: multer({ dest: os.tmpdir() }) });

        this.app.get('/', this.getIndex);
        this.app.use(express.static(this.variable.WEB_ROOT));
        this.app.use(errorHandler);
        this.app.use(this.notFoundHandler);
    }

    private notFoundHandler = (_req: Request, res: Response) => {
        res.status(404).send({
            message: 'Not Found',
        });
    };

    private getIndex = (req: Request, res: Response) => {
        res.sendFile(this.variable.WEB_ROOT + '/index.html');
    };
}
