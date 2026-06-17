/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { container, singleton } from 'tsyringe';
import { Request } from 'express';
import { UserRole, ApplicationError, isUserAuthorized, User } from 'aas-core';

import { ERRORS } from '../errors.js';

@singleton()
export class Authentication {
    private static instance?: Authentication;

    public static async authentication(req: Request, name: string, scopes: UserRole[]): Promise<User> {
        if (!Authentication.instance) {
            Authentication.instance = container.resolve(Authentication);
        }

        return await Authentication.instance.authentication(req, name, scopes);
    }

    public async authentication(req: Request, name: string, scopes: UserRole[]): Promise<User> {
        const user = req.user;
        if (!user) {
            throw new ApplicationError(ERRORS.UNAUTHORIZED, undefined, 401);
        }

        if (name === 'oauth2' && !isUserAuthorized(user.role, scopes)) {
            throw new ApplicationError(ERRORS.UNAUTHORIZED, undefined, 401);
        }

        return user;
    }
}

export async function expressAuthentication(req: Request, name: string, scopes: UserRole[]): Promise<User> {
    return await Authentication.authentication(req, name, scopes);
}
