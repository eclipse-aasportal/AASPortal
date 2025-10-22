/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { inject, injectable } from 'tsyringe';
import { Body, Controller, Delete, Get, Hidden, OperationId, Path, Post, Put, Route, Security, Tags } from 'tsoa';
import type { AuthResult, Cookie, Credentials, UserProfile } from 'aas-core';
import { decodeBase64Url } from 'aas-package';

import { AuthService } from '../auth/auth-service.js';

@injectable()
@Route('/api/v1')
@Tags('Authentication')
export class AuthController extends Controller {
    public constructor(@inject(AuthService) private readonly auth: AuthService) {
        super();
    }

    /**
     * @summary Login a user.
     * @param credentials The credentials of the user.
     * @returns An access token.
     */
    @Post('login')
    @OperationId('login')
    public login(@Body() credentials: Credentials): Promise<AuthResult> {
        return this.auth.login(credentials);
    }

    /**
     * @summary Registers a new user.
     * @param profile The user profile.
     * @returns An access token with read and write permissions.
     */
    @Post('register')
    @OperationId('register')
    public register(@Body() profile: UserProfile): Promise<AuthResult> {
        return this.auth.registerUser(profile);
    }

    /**
     * @summary Gets the profile of the user with the specified ID.
     * @param id The user ID.
     * @returns The user profile.
     */
    @Get('users/{id}')
    @Security('bearerAuth', ['reader', 'editor', 'admin'])
    @OperationId('getProfile')
    public getProfile(@Path() id: string): Promise<UserProfile> {
        return this.auth.getProfile(decodeBase64Url(id));
    }

    /**
     * @summary Updates the profile of the user with the specified ID.
     * @param id The user ID.
     * @param profile The updated profile.
     * @returns A new access token with read and write permissions.
     */
    @Put('users/{id}')
    @Security('bearerAuth', ['reader', 'editor', 'admin'])
    @OperationId('updateProfile')
    public updateProfile(@Path() id: string, @Body() profile: UserProfile): Promise<AuthResult> {
        return this.auth.updateProfile(decodeBase64Url(id), profile);
    }

    /**
     * @summary Resets the password for the user with the specified ID.
     * @param id The user ID.
     */
    @Hidden()
    @Delete('users/{id}/reset')
    @OperationId('resetPassword')
    public resetPassword(@Path() id: string): Promise<void> {
        return this.auth.resetPassword(decodeBase64Url(id));
    }

    /**
     * @summary Deletes the user with the specified ID.
     * @param id The user ID.
     */
    @Delete('users/{id}')
    @Security('bearerAuth', ['reader', 'editor', 'admin'])
    @OperationId('deleteUser')
    public deleteUser(@Path() id: string): Promise<void> {
        return this.auth.deleteUserAsync(decodeBase64Url(id));
    }

    /**
     * @summary Gets the cookie with the specified name.
     * @param id The user ID.
     * @param name The cookie name.
     * @returns The cookie with the specified name or `undefined`.
     */
    @Get('users/{id}/cookies/{name}')
    @Security('bearerAuth', ['reader', 'editor', 'admin'])
    @OperationId('getCookie')
    public getCookie(@Path() id: string, @Path() name: string): Promise<Cookie | undefined> {
        return this.auth.getCookie(decodeBase64Url(id), name);
    }

    /**
     * @summary Gets all cookies of the user with the specified ID.
     * @param id The user ID.
     * @returns All cookies.
     */
    @Get('users/{id}/cookies')
    @Security('bearerAuth', ['reader', 'editor', 'admin'])
    @OperationId('getCookies')
    public getCookies(@Path() id: string): Promise<Cookie[]> {
        return this.auth.getCookies(decodeBase64Url(id));
    }

    /**
     * @summary Sets a cookie.
     * @param id The user ID.
     * @param name The cookie name.
     * @param cookie The current cookie.
     */
    @Post('users/{id}/cookies/{name}')
    @Security('bearerAuth', ['reader', 'editor', 'admin'])
    @OperationId('setCookie')
    public setCookie(@Path() id: string, @Path() name: string, @Body() cookie: Cookie): Promise<void> {
        return this.auth.setCookie(decodeBase64Url(id), name, cookie.data);
    }

    /**
     * @summary Deletes the cookie with the specified name.
     * @param id The user ID.
     * @param name The cookie name.
     */
    @Delete('users/{id}/cookies/{name}')
    @Security('bearerAuth', ['reader', 'editor', 'admin'])
    @OperationId('deleteCookie')
    public deleteCookie(@Path() id: string, @Path() name: string): Promise<void> {
        return this.auth.deleteCookie(decodeBase64Url(id), name);
    }
}
