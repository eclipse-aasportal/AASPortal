/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, injectable } from 'tsyringe';
import { Body, Controller, Delete, Get, OperationId, Path, Post, Route, Request, Security, Tags } from 'tsoa';
import express from 'express';
import { ApplicationError, type Cookie } from 'aas-core';

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
    @Security('oauth2', ['reader', 'editor', 'admin'])
    @OperationId('getCookie')
    public async getCookie(@Request() request: express.Request, @Path() name: string): Promise<Cookie | undefined> {
        const user = request.user;
        if (!user) {
            throw new ApplicationError(ERRORS.BAD_REQUEST, {}, 400);
        }

        return await this.storage.getCookie(user.id, name);
    }

    /**
     * @summary Sets a cookie for the current authenticated user.
     * @param name The cookie name.
     * @param cookie The current cookie.
     */
    @Post('{name}')
    @Security('oauth2', ['reader', 'editor', 'admin'])
    @OperationId('setCookie')
    public async setCookie(
        @Request() request: express.Request,
        @Path() name: string,
        @Body() cookie: Cookie,
    ): Promise<void> {
        const user = request.user;
        if (!user) {
            throw new ApplicationError(ERRORS.BAD_REQUEST, {}, 400);
        }

        await this.storage.setCookie(user.id, name, cookie.data);
    }

    /**
     * @summary Deletes the cookie with the specified name for the current authenticated user.
     * @param name The cookie name.
     */
    @Delete('{name}')
    @Security('oauth2', ['reader', 'editor', 'admin'])
    @OperationId('deleteCookie')
    public async deleteCookie(@Request() request: express.Request, @Path() name: string): Promise<void> {
        const user = request.user;
        if (!user) {
            throw new ApplicationError(ERRORS.BAD_REQUEST, {}, 400);
        }

        await this.storage.deleteCookie(user.id, name);
    }
}
