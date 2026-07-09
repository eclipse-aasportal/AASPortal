/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, injectable } from 'tsyringe';
import { Body, Controller, Delete, Get, OperationId, Path, Post, Route, Request, Tags } from 'tsoa';
import express from 'express';
import { ApplicationError } from 'aas-core';

import { COOKIE_STORAGE, type CookieStorage } from '../cookie-storage/cookie-storage.js';
import { ERRORS } from '../errors.js';

@injectable()
@Route('/api/v1/cookies')
@Tags('Cookies')
export class CookiesController extends Controller {
    public constructor(@inject(COOKIE_STORAGE) private readonly storage: CookieStorage) {
        super();
    }

    /**
     * @summary Gets the cookie with the specified name for the current authenticated user.
     * @param name The cookie name.
     * @returns The cookie with the specified name or `undefined`.
     */
    @Get('{name}')
    @OperationId('getCookie')
    public async getCookie(@Path() name: string, @Request() req: express.Request): Promise<string | undefined> {
        const user = req.user;
        if (!user) {
            throw new ApplicationError(ERRORS.UNAUTHORIZED, {}, 401);
        }

        return await this.storage.getCookie(user.id, name);
    }

    /**
     * @summary Sets a cookie for the current authenticated user.
     * @param name The cookie name.
     * @param data The cookie data.
     */
    @Post('{name}')
    @OperationId('setCookie')
    public async setCookie(@Request() req: express.Request, @Path() name: string, @Body() data: string): Promise<void> {
        const user = req.user;
        if (!user) {
            throw new ApplicationError(ERRORS.UNAUTHORIZED, {}, 401);
        }

        await this.storage.setCookie(user.id, name, data);
    }

    /**
     * @summary Deletes the cookie with the specified name for the current authenticated user.
     * @param name The cookie name.
     */
    @Delete('{name}')
    @OperationId('deleteCookie')
    public async deleteCookie(@Path() name: string, @Request() request: express.Request): Promise<void> {
        const user = request.user;
        if (!user) {
            throw new ApplicationError(ERRORS.UNAUTHORIZED, {}, 401);
        }

        await this.storage.deleteCookie(user.id, name);
    }
}
