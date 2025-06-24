/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import 'reflect-metadata';
import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import { ApplicationError, UserProfile } from 'aas-core';

import { AuthService } from '../../app/auth/auth-service.js';
import { ERRORS } from '../../app/errors.js';
import { Mailer } from '../../app/mailer.js';
import { UserStorage } from '../../app/auth/user-storage.js';
import { UserData } from '../../app/auth/user-data.js';
import { createSpyObj } from 'fhg-jest';
import { Variable } from '../../app/variable.js';

describe('AuthService', function () {
    let mailer: Mailer;
    let auth: AuthService;
    let userStorage: jest.Mocked<UserStorage>;
    let variable: jest.Mocked<Variable>;
    let johnDoeData: UserData;

    beforeEach(function () {
        mailer = createSpyObj<Mailer>(['sendPassword', 'sendNewPassword']);
        userStorage = createSpyObj<UserStorage>([
            'exist',
            'read',
            'write',
            'delete',
            'checkCookie',
            'getCookie',
            'setCookie',
            'deleteCookie',
        ]);

        variable = createSpyObj<Variable>({}, { JWT_SECRET: 'SecretSecretSecret', JWT_EXPIRES_IN: 60 });
        auth = new AuthService(mailer, userStorage, variable);

        johnDoeData = {
            id: 'john.doe@email.com',
            name: 'John',
            role: 'editor',
            password: '$2a$10$6qZT2ZM5jUVU/pLLQUjCvuXplG.GwPnoz48C1Eg/dKqjIrGE8jm0a',
            created: new Date('2020-11-02T10:22:56.328Z'),
            lastLoggedIn: new Date(0),
        };
    });

    it('should be created', function () {
        expect(auth).toBeTruthy();
    });

    describe('loginAsync', function () {
        it('returns a user token.', async function () {
            userStorage.read.mockReturnValue(new Promise<UserData>(result => result(johnDoeData)));
            const result = await auth.login({ id: 'john.doe@email.com', password: '6iu3hbcc' });
            expect(result?.token).toBeDefined();
        });

        it('returns a guest token.', async function () {
            userStorage.read.mockReturnValue(new Promise<UserData>(result => result(johnDoeData)));
            const result = await auth.login();
            expect(result?.token).toBeDefined();
        });

        it('throws an UnknownUser error.', async function () {
            try {
                userStorage.read.mockReturnValue(new Promise<undefined>(result => result(undefined)));
                await auth.login({ id: 'unknown@iosb-ina.fraunhofer.de', password: '6iu3hbcc' });
            } catch (error) {
                expect(error instanceof ApplicationError).toBeTruthy();
                expect(error.name).toEqual(ERRORS.UnknownUser);
            }
        });

        it('throws an InvalidPassword error.', async function () {
            try {
                userStorage.read.mockReturnValue(new Promise<UserData>(result => result(johnDoeData)));
                await auth.login({ id: 'john.doe@email.com', password: 'invalid' });
            } catch (error) {
                expect(error instanceof ApplicationError).toBeTruthy();
                expect(error.name).toEqual(ERRORS.InvalidPassword);
            }
        });
    });

    describe('updateProfileAsync', function () {
        let profile: UserProfile;

        beforeEach(function () {
            profile = {
                id: 'monika.mustermann@email.com',
                name: 'Monika',
                password: '12345678',
            };
        });

        it('updates the profile of a registered user', async function () {
            const monikaData: UserData = {
                id: 'monika.mustermann@email.com',
                name: 'Monika',
                role: 'editor',
                password: '$2a$10$6qZT2ZM5jUVU/pLLQUjCvuXplG.GwPnoz48C1Eg/dKqjIrGE8jm0a',
                created: new Date('2020-11-02T10:22:56.328Z'),
                lastLoggedIn: new Date(0),
            };

            userStorage.read.mockReturnValue(new Promise<UserData>(result => result(monikaData)));
            const result = await auth.updateProfile('monika.mustermann@email.com', profile);
            expect(result.token).toBeDefined();
        });

        it('throws an error if user is unknown or not authenticated', async function () {
            userStorage.read.mockReturnValue(new Promise<UserData | undefined>(result => result(undefined)));
            await expect(auth.updateProfile('unknown', profile)).rejects.toThrow();
        });
    });

    describe('registerUserAsync', function () {
        let johnDoeProfile: UserProfile;

        beforeEach(function () {
            johnDoeProfile = {
                id: 'john.doe@email.com',
                name: 'John Doe',
                password: '12345678',
            };
        });

        it('registers a new user', async function () {
            userStorage.exist.mockReturnValue(new Promise<boolean>(result => result(false)));
            await expect(auth.registerUser(johnDoeProfile)).resolves.toBeDefined();
        });

        // it('registers a new user, password is send via e-mail', async function () {
        //     userStorage.existAsync.mockReturnValue(new Promise<boolean>(result => result(false)));
        //     mailer.sendPassword = jest.fn();
        //     const result = await auth.registerUserAsync({
        //         id: 'john.doe@email.com',
        //         name: 'John Doe',
        //         password: '',
        //     });

        //     expect(result.token).toBeDefined();
        //     expect(mailer.sendPassword).toHaveBeenCalled();
        // });

        it('throws an error if e-mail already registered', async function () {
            userStorage.exist.mockReturnValue(new Promise<boolean>(result => result(true)));
            await expect(auth.registerUser(johnDoeProfile)).rejects.toThrow();
        });

        it('throws an error if e-mail is invalid', async function () {
            userStorage.exist.mockReturnValue(new Promise<boolean>(result => result(false)));
            await expect(
                auth.registerUser({
                    id: 'invalid',
                    name: 'John Doe',
                    password: '12345678',
                }),
            ).rejects.toThrow();
        });

        it('throws an error if password is invalid', async function () {
            userStorage.exist.mockReturnValue(new Promise<boolean>(result => result(false)));
            await expect(
                auth.registerUser({
                    id: 'john.doe@email.com',
                    name: 'John Doe',
                    password: '1',
                }),
            ).rejects.toThrow();
        });
    });

    describe('resetPasswordAsync', function () {
        it('sends a new password via e-mail', async function () {
            userStorage.read.mockReturnValue(new Promise<UserData>(result => result(johnDoeData)));
            mailer.sendNewPassword = jest.fn();
            await expect(auth.resetPassword('john.doe@email.com')).resolves.toBeUndefined();
            expect(mailer.sendNewPassword).toHaveBeenCalled();
        });
    });

    describe('deleteUserAsync', function () {
        it('deletes the account of a registered user', async function () {
            userStorage.delete.mockReturnValue(new Promise<boolean>(result => result(true)));
            await expect(auth.deleteUserAsync('john.doe@email.com')).resolves.toBeUndefined();
        });

        it('throws an error if user is unknown', async function () {
            userStorage.delete.mockReturnValue(new Promise<boolean>(result => result(false)));
            await expect(auth.deleteUserAsync('john.doe@email.com')).rejects.toThrow();
        });
    });

    describe('hasUserAsync', function () {
        it('authorizes John Doe', async function () {
            userStorage.exist.mockReturnValue(new Promise<boolean>(result => result(true)));
            await expect(auth.hasUser('john.doe@email.com')).resolves.toBe(true);
        });

        it('does not authorize a guest', async function () {
            userStorage.exist.mockReturnValue(new Promise<boolean>(result => result(false)));
            await expect(auth.hasUser('unknown')).resolves.toBe(false);
        });
    });
});
