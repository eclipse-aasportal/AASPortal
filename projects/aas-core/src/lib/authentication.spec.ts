/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { describe, it, expect } from 'vitest';
import { getUserNameFromEMail, isCredentials, isUserAuthorized, isUserProfile } from './authentication.js';

describe('authentication', () => {
    describe('getUserNameFromEMail', () => {
        it('gets John Doe from john.doe@email.com', () => {
            expect(getUserNameFromEMail('john.doe@email.com')).toEqual('John Doe');
        });

        it('gets John Doe from john-doe@email.com', () => {
            expect(getUserNameFromEMail('john-doe@email.com')).toEqual('John Doe');
        });

        it('gets Johndoe from johndoe@email.com', () => {
            expect(getUserNameFromEMail('johndoe@email.com')).toEqual('Johndoe');
        });

        it('gets "" from empty e-mail', () => {
            expect(getUserNameFromEMail('')).toEqual('');
        });
    });

    describe('isUserAuthorized', () => {
        it('true for actual: undefined, minimalRequired: undefined', () => {
            expect(isUserAuthorized(undefined, undefined)).toBeTruthy();
        });

        it('false for actual: undefined, minimalRequired: "user"', () => {
            expect(isUserAuthorized(undefined, undefined)).toBeTruthy();
        });

        it('true for actual: "user", minimalRequired: "user"', () => {
            expect(isUserAuthorized('user', 'user')).toBeTruthy();
        });

        it('false for actual: "user", minimalRequired: "admin"', () => {
            expect(isUserAuthorized('user', 'admin')).toBeFalsy();
        });

        it('true for actual: "admin", minimalRequired: "admin"', () => {
            expect(isUserAuthorized('user', 'admin')).toBeFalsy();
        });
    });

    describe('isCredentials', () => {
        it('true for valid credentials', () => {
            expect(
                isCredentials({
                    id: 'john.doe@email.com',
                    name: 'John Doe',
                    password: 'password',
                }),
            ).toBeTruthy();
        });

        it('false for missing id', () => {
            expect(
                isCredentials({
                    name: 'John Doe',
                    password: 'password',
                }),
            ).toBeFalsy();
        });

        it('false for missing password', () => {
            expect(
                isCredentials({
                    id: 'john.doe@email.com',
                    name: 'John Doe',
                }),
            ).toBeFalsy();
        });

        it('false for non-string id', () => {
            expect(
                isCredentials({
                    id: 123,
                    name: 'John Doe',
                    password: 'password',
                }),
            ).toBeFalsy();
        });
    });

    describe('isUserProfile', () => {
        it('true for valid user profile', () => {
            expect(
                isUserProfile({
                    id: 'john.doe@email.com',
                    name: 'John Doe',
                    password: 'password',
                    newPassword: 'newpassword',
                }),
            ).toBeTruthy();
        });

        it('false for missing id', () => {
            expect(
                isUserProfile({
                    name: 'John Doe',
                    password: 'password',
                    newPassword: 'newpassword',
                }),
            ).toBeFalsy();
        });

        it('false for missing name', () => {
            expect(
                isUserProfile({
                    id: 'john.doe@email.com',
                    password: 'password',
                    newPassword: 'newpassword',
                }),
            ).toBeFalsy();
        });

        it('false for non-string id', () => {
            expect(
                isUserProfile({
                    id: 123,
                    name: 'John Doe',
                    password: 'password',
                    newPassword: 'newpassword',
                }),
            ).toBeFalsy();
        });
    });
});
