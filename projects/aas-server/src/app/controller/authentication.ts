/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
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
import { Logger } from '../logging/logger.js';
import { ERRORS } from '../errors.js';
import { Variable } from '../variable.js';

@singleton()
export class Authentication {
    private static instance?: Authentication;
    private readonly publicKey: string;

    public constructor(
        @inject('Logger') private readonly logger: Logger,
        @inject(AuthService) private readonly auth: AuthService,
        @inject(Variable) private readonly variable: Variable,
    ) {
        if (this.variable.JWT_PUBLIC_KEY) {
            this.publicKey = fs.readFileSync(this.variable.JWT_PUBLIC_KEY, 'utf8');
        } else {
            this.publicKey = this.variable.JWT_SECRET;
        }
    }

    public static authentication(token: string, role: UserRole): Promise<JWTPayload> {
        if (!Authentication.instance) {
            Authentication.instance = container.resolve(Authentication);
        }

        return Authentication.instance.checkAsync(token, role);
    }

    public async checkAsync(token: string, role: UserRole): Promise<JWTPayload> {
        const payload = jwt.verify(token, this.publicKey) as JWTPayload;
        if (!payload.role) {
            throw new ApplicationError('Unauthorized access.', ERRORS.UnauthorizedAccess);
        }

        if (payload.role === 'admin' || payload.role === 'editor') {
            if (!payload.sub || !(await this.auth.hasUserAsync(payload.sub))) {
                throw new ApplicationError('Unauthorized access.', ERRORS.UnauthorizedAccess);
            }
        } else if (payload.role !== 'guest') {
            throw new ApplicationError('Unauthorized access.', ERRORS.UnauthorizedAccess);
        }

        if (!isUserAuthorized(payload.role, role)) {
            throw new ApplicationError('Unauthorized access.', ERRORS.UnauthorizedAccess);
        }

        return payload;
    }
}

export async function expressAuthentication(req: Request, name: string, scopes?: string[]): Promise<JWTPayload> {
    if (name === 'bearerAuth') {
        if (scopes && scopes.length === 1) {
            if (req.headers.authorization) {
                const items = req.headers.authorization.split(' ');
                if (items.length === 2) {
                    return Authentication.authentication(items[1], scopes[0] as UserRole);
                }
            }
        }
    } else if (name === 'api_key') {
        if (req.query && req.query.access_token) {
            return Authentication.authentication(req.query.access_token as string, 'guest');
        }
    }

    throw new ApplicationError('Unauthorized access.', ERRORS.UnauthorizedAccess);
}
