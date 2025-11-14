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
            expect(isUserAuthorized('editor', ['reader', 'editor', 'admin'])).toBeTruthy();
        });

        it('false for actual: guest, expected: editor', () => {
            expect(isUserAuthorized('editor', ['reader', 'admin'])).toBeFalsy();
        });

        it('false for actual: guest, expected: admin', () => {
            expect(isUserAuthorized('reader', [])).toBeFalsy();
        });
    });
});
