/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { describe, it, expect } from '@jest/globals'
import { getUserNameFromEMail, isUserAuthorized } from "../lib/authentication.js";

describe('authentication', function () {
    describe('getUserNameFromEMail', function () {
        it('gets John Doe from john.doe@email.com', function () {
            expect(getUserNameFromEMail('john.doe@email.com')).toEqual('John Doe');
        });

        it('gets John Doe from john-doe@email.com', function () {
            expect(getUserNameFromEMail('john-doe@email.com')).toEqual('John Doe');
        });

        it('gets Johndoe from johndoe@email.com', function () {
            expect(getUserNameFromEMail('johndoe@email.com')).toEqual('Johndoe');
        });

        it('gets "" from empty e-mail', function () {
            expect(getUserNameFromEMail('')).toEqual('');
        });
    });

    describe('isUserAuthorized', function () {
        it('true for actual: guest, expected: guest', function () {
            expect(isUserAuthorized('guest', 'guest')).toBeTruthy();
        });

        it('false for actual: guest, expected: editor', function () {
            expect(isUserAuthorized('guest', 'editor')).toBeFalsy();
        });

        it('false for actual: guest, expected: admin', function () {
            expect(isUserAuthorized('guest', 'admin')).toBeFalsy();
        });

        it('true for actual: editor, expected: guest', function () {
            expect(isUserAuthorized('editor', 'guest')).toBeTruthy();
        });

        it('true for actual: editor, expected: editor', function () {
            expect(isUserAuthorized('editor', 'editor')).toBeTruthy();
        });

        it('false for actual: editor, expected: admin', function () {
            expect(isUserAuthorized('editor', 'admin')).toBeFalsy();
        });
        
        it('true for actual: admin, expected: guest', function () {
            expect(isUserAuthorized('admin', 'guest')).toBeTruthy();
        });

        it('true for actual: admin, expected: editor', function () {
            expect(isUserAuthorized('admin', 'editor')).toBeTruthy();
        });

        it('true for actual: admin, expected: admin', function () {
            expect(isUserAuthorized('admin', 'admin')).toBeTruthy();
        });
    });
});