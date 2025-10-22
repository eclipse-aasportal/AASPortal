/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { TranslateService } from '@ngx-translate/core';
import { ApplicationError } from 'aas-core';
import {
    encodeBase64Url,
    basename,
    messageToString,
    decodeBase64Url,
    isBase64,
    extension,
    convertBlobToBase64Async,
} from '../lib/utilities';
import { createSpyObj } from './mocks';

describe('convert', () => {
    describe('basename', () => {
        it('gets the file name of a file path', () => {
            expect(basename('A:/hello/world/john.doe')).toEqual('john.doe');
        });
    });

    describe('extension', () => {
        it('gets the extension of a file path', () => {
            expect(extension('A:/hello/world/john.doe')).toEqual('.doe');
        });

        it('gets "undefined" of no extension exits', () => {
            expect(extension('A:/hello/world/john-doe')).toBeUndefined();
        });
    });

    describe('messageToString', () => {
        let translate: jest.Mocked<TranslateService>;

        beforeEach(() => {
            translate = createSpyObj<TranslateService>(['instant', 'getCurrentLang'], {
                currentLang: 'en-us',
            });

            translate.getCurrentLang.mockImplementation(() => 'en-us');
        });

        it('converts a message of type string', () => {
            expect(messageToString('Hello World!', translate)).toEqual('Hello World!');
        });

        it('converts an ApplicationError', () => {
            translate.instant.mockReturnValue('Hello {0}!');
            const error = new ApplicationError('Hello World!', 'HELLO_WORLD', 'World');
            expect(messageToString(error, translate)).toEqual('Hello World!');
        });
    });

    describe('encodeBase64Url', () => {
        it('converts an URL to Base64Url string', () => {
            const b64url = encodeBase64Url('https://iosb-ina.fraunhofer.de/ids/aas/5174_7001_0122_9237');
            expect(b64url).toEqual('aHR0cHM6Ly9pb3NiLWluYS5mcmF1bmhvZmVyLmRlL2lkcy9hYXMvNTE3NF83MDAxXzAxMjJfOTIzNw');
        });
    });

    describe('decodeBase64Url', () => {
        it('converts a Base64Url string to an URL', () => {
            const url = decodeBase64Url(
                'aHR0cHM6Ly9pb3NiLWluYS5mcmF1bmhvZmVyLmRlL2lkcy9hYXMvNTE3NF83MDAxXzAxMjJfOTIzNw',
            );
            expect(url).toEqual('https://iosb-ina.fraunhofer.de/ids/aas/5174_7001_0122_9237');
        });
    });

    describe('isBase64', () => {
        it('indicates that "The quick brown fox jumps over the lazy dog." is not base64 encoded', () => {
            expect(isBase64('The quick brown fox jumps over the lazy dog.')).toBe(false);
        });

        it('indicates that "VGhlIHF1aWNrIGJyb3duIGZveCBqdW1wcyBvdmVyIHRoZSBsYXp5IGRvZy4=" is base64 encoded', () => {
            expect(isBase64('VGhlIHF1aWNrIGJyb3duIGZveCBqdW1wcyBvdmVyIHRoZSBsYXp5IGRvZy4=')).toBe(true);
        });
    });

    describe('convertBlobToBase64Async', () => {
        it('converts the Blob content to a base64 encoded string', async () => {
            const blob = new Blob(['Hello World!']);
            await expect(convertBlobToBase64Async(blob)).resolves.toEqual('SGVsbG8gV29ybGQh');
        });
    });
});
