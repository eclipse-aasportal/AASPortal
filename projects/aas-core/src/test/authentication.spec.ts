/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { describe, it, expect } from '@jest/globals';
import { getUserNameFromEMail, isUserAuthorized } from '../lib/authentication.js';

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
        it('true for actual: guest, expected: guest', () => {
            expect(isUserAuthorized('guest', 'guest')).toBeTruthy();
        });

        it('false for actual: guest, expected: editor', () => {
            expect(isUserAuthorized('guest', 'editor')).toBeFalsy();
        });

        it('false for actual: guest, expected: admin', () => {
            expect(isUserAuthorized('guest', 'admin')).toBeFalsy();
        });

        it('true for actual: editor, expected: guest', () => {
            expect(isUserAuthorized('editor', 'guest')).toBeTruthy();
        });

        it('true for actual: editor, expected: editor', () => {
            expect(isUserAuthorized('editor', 'editor')).toBeTruthy();
        });

        it('false for actual: editor, expected: admin', () => {
            expect(isUserAuthorized('editor', 'admin')).toBeFalsy();
        });

        it('true for actual: admin, expected: guest', () => {
            expect(isUserAuthorized('admin', 'guest')).toBeTruthy();
        });

        it('true for actual: admin, expected: editor', () => {
            expect(isUserAuthorized('admin', 'editor')).toBeTruthy();
        });

        it('true for actual: admin, expected: admin', () => {
            expect(isUserAuthorized('admin', 'admin')).toBeTruthy();
        });
    });
});