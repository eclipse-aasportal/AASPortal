/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { container, inject, singleton } from 'tsyringe';
import { Request } from 'express';
import { UserRole, ApplicationError, isUserAuthorized, JWTPayload } from 'aas-core';
import jwt from 'jsonwebtoken';
import fs from 'fs';

import { AuthService } from '../auth/auth-service.js';
import { LOGGER, Logger } from '../logging/logger.js';
import { ERRORS } from '../errors.js';
import { Variable } from '../variable.js';

@singleton()
export class Authentication {
    private static instance?: Authentication;
    private readonly publicKey: string;

    public constructor(
        @inject(LOGGER) private readonly logger: Logger,
        @inject(AuthService) private readonly auth: AuthService,
        @inject(Variable) private readonly variable: Variable,
    ) {
        if (this.variable.JWT_PUBLIC_KEY) {
            this.publicKey = fs.readFileSync(this.variable.JWT_PUBLIC_KEY, 'utf8');
        } else {
            this.publicKey = this.variable.JWT_SECRET;
        }
    }

    public static async authentication(token: string | undefined, scopes: UserRole[] | undefined): Promise<JWTPayload> {
        if (!Authentication.instance) {
            Authentication.instance = container.resolve(Authentication);
        }

        return await Authentication.instance.check(token, scopes);
    }

    public async check(token: string | undefined, scopes: UserRole[] | undefined): Promise<JWTPayload> {
        if (!token || !scopes) {
            throw new ApplicationError(ERRORS.UnauthorizedAccess, undefined, 401);
        }

        const payload = jwt.verify(token, this.publicKey) as JWTPayload;
        if (!payload.role || !payload.sub) {
            throw new ApplicationError(ERRORS.UnauthorizedAccess, undefined, 401);
        }

        if (!(await this.auth.hasUser(payload.sub))) {
            throw new ApplicationError(ERRORS.UnauthorizedAccess, undefined, 401);
        }

        if (!isUserAuthorized(payload.role, scopes)) {
            throw new ApplicationError(ERRORS.UnauthorizedAccess, undefined, 401);
        }

        return payload;
    }
}

export async function expressAuthentication(req: Request, name: string, scopes: UserRole[]): Promise<JWTPayload> {
    let token: string | undefined;
    if (name === 'bearerAuth') {
        if (req.headers.authorization) {
            const items = req.headers.authorization.split(' ');
            if (items.length === 2) {
                token = items[1];
            }
        }
    } else if (name === 'api_key') {
        if (typeof req.query?.access_token === 'string') {
            token = req.query.access_token;
        }
    }

    return await Authentication.authentication(token, scopes);
}
