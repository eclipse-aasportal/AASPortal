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
import multer from 'multer';
import { inject, singleton } from 'tsyringe';
import express, { Express, Request, Response, json, urlencoded } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import swaggerUi, { JsonObject } from 'swagger-ui-express';
import cookieParser from 'cookie-parser';

import { Variable } from './variable.js';
import { LOGGER, Logger } from './logging/logger.js';
import { RegisterRoutes } from './routes/routes.js';
import { errorHandler } from './error-handler.js';
import axios from 'axios';
import { generateCodeChallenge, generateRandomString } from './utilities.js';

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

        // 1. Redirect to Keycloak login page
        this.app.get('/login', async (req, res) => {
            const state = generateRandomString(24);
            const code_verifier = generateRandomString(43);
            const code_challenge = await generateCodeChallenge(code_verifier);
            this.verifiers.set(state, code_verifier);
            const authUrl = new URL(this.variable.KEYCLOAK_AUTHORIZATION_URL);
            authUrl.searchParams.set('response_type', 'code');
            authUrl.searchParams.set('client_id', this.variable.CLIENT_ID);
            authUrl.searchParams.set('redirect_uri', this.variable.REDIRECT_URI);
            authUrl.searchParams.set('state', state);
            authUrl.searchParams.set('scope', 'openid');
            authUrl.searchParams.set('code_challenge_method', 'S256');
            authUrl.searchParams.set('code_challenge', code_challenge);
            res.redirect(authUrl.href);
        });

        // 2. Callback after successful login
        this.app.get('/callback', async (req, res) => {
            const { code, state } = req.query;
            if (typeof code !== 'string' || typeof state !== 'string') {
                res.status(400).send('Invalid callback request');
                return;
            }

            const code_verifier = this.verifiers.get(state);
            if (!code_verifier) {
                res.status(400).send('Invalid callback request');
                return;
            }

            this.verifiers.delete(state);

            // Exchange the authorization code for tokens
            const tokenResponse = await axios.post(
                this.variable.KEYCLOAK_TOKEN_URL,
                new URLSearchParams({
                    grant_type: 'authorization_code',
                    code: code,
                    redirect_uri: this.variable.REDIRECT_URI,
                    client_id: this.variable.CLIENT_ID,
                    code_verifier: code_verifier,
                }),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                },
            );

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { access_token, id_token, refresh_token } = tokenResponse.data;

            // Store tokens in cookies or session
            res.cookie('access_token', access_token, { httpOnly: true, secure: true });
            res.cookie('id_token', id_token, { httpOnly: true, secure: true });

            // Redirect to a protected page after successful login
            res.redirect('/profile');
        });

        RegisterRoutes(this.app, { multer: multer({ dest: os.tmpdir() }) });

        this.app.get('/', this.getIndex);
        if (this.variable.ENABLE_STATIC_FILES) {
            this.app.use(express.static(this.variable.WEB_ROOT));
        }

        this.app.use(errorHandler);
        this.app.use(this.notFoundHandler);
    }

    private getIndex = (req: Request, res: Response) => {
        res.sendFile(this.variable.WEB_ROOT + '/index.html');
    };

    private notFoundHandler = (_req: Request, res: Response) => {
        res.status(404).send({
            message: 'Not Found',
        });
    };
}
