/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import path from 'path';
import fs from 'fs';
import { inject, singleton } from 'tsyringe';
import express, { Express, Request, Response, json, urlencoded } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import swaggerUi, { JsonObject } from 'swagger-ui-express';
import { ApplicationError } from 'aas-core';
import { ValidateError } from 'tsoa';

import { RegisterRoutes } from './routes/routes.js';
import { ERRORS } from './errors.js';
import { Variable } from './variable.js';
import { Logger } from './logging/logger.js';

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

        RegisterRoutes(this.app);
        // RegisterRoutes(this.app, { multer: multer({ dest: os.tempDir() }) });

        this.app.get('/', this.getIndex);
        this.app.use(express.static(this.variable.WEB_ROOT));
        this.app.use(this.notFoundHandler);
        this.app.use(this.errorHandler);
    }

    private errorHandler = (err: Error, _: Request, res: Response) => {
        if (err instanceof ValidateError) {
            res.status(422).json({
                message: 'Validation Failed',
                details: err?.fields,
            });
        } else if (err instanceof ApplicationError) {
            if (err.name === ERRORS.UnauthorizedAccess) {
                res.status(401).json({
                    message: 'Unauthorized',
                });
            } else {
                res.status(500).json({
                    message: err.message,
                });
            }
        } else {
            res.status(500).json({
                message: err.message,
            });
        }
    };

    private notFoundHandler = (_req: Request, res: Response) => {
        res.status(404).send({
            message: 'Not Found',
        });
    };

    private getIndex = (req: Request, res: Response) => {
        res.sendFile(this.variable.WEB_ROOT + '/index.html');
    };
}
