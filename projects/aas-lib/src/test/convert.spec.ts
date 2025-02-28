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
    normalize,
    decodeBase64Url,
    isBase64,
    extension,
    convertBlobToBase64Async,
} from '../lib/utilities';

describe('convert', function () {
    describe('basename', function () {
        it('gets the file name of a file path', function () {
            expect(basename('A:/hello/world/john.doe')).toEqual('john.doe');
        });
    });

    describe('extension', function () {
        it('gets the extension of a file path', function () {
            expect(extension('A:/hello/world/john.doe')).toEqual('.doe');
        });

        it('gets "undefined" of no extension exits', function () {
            expect(extension('A:/hello/world/john-doe')).toBeUndefined();
        });
    });

    describe('normalize', function () {
        it('replaces all "\\" with "/"', function () {
            expect(normalize('A:\\hello/world\\john.doe')).toEqual('A:/hello/world/john.doe');
        });
    });

    describe('messageToString', function () {
        let translate: jasmine.SpyObj<TranslateService>;

        beforeEach(function () {
            translate = jasmine.createSpyObj<TranslateService>('TranslateService', ['instant'], {
                currentLang: 'en-us',
            });
        });

        it('converts a message of type string', function () {
            expect(messageToString('Hello World!', translate)).toEqual('Hello World!');
        });

        it('converts an ApplicationError', function () {
            translate.instant.and.returnValue('Hello {0}!');
            const error = new ApplicationError('Hello World!', 'HELLO_WORLD', 'World');
            expect(messageToString(error, translate)).toEqual('Hello World!');
        });
    });

    describe('encodeBase64Url', function () {
        it('converts an URL to Base64Url string', function () {
            const b64url = encodeBase64Url('https://iosb-ina.fraunhofer.de/ids/aas/5174_7001_0122_9237');
            expect(b64url).toEqual('aHR0cHM6Ly9pb3NiLWluYS5mcmF1bmhvZmVyLmRlL2lkcy9hYXMvNTE3NF83MDAxXzAxMjJfOTIzNw');
        });
    });

    describe('decodeBase64Url', function () {
        it('converts a Base64Url string to an URL', function () {
            const url = decodeBase64Url(
                'aHR0cHM6Ly9pb3NiLWluYS5mcmF1bmhvZmVyLmRlL2lkcy9hYXMvNTE3NF83MDAxXzAxMjJfOTIzNw',
            );
            expect(url).toEqual('https://iosb-ina.fraunhofer.de/ids/aas/5174_7001_0122_9237');
        });
    });

    describe('isBase64', function () {
        it('indicates that "The quick brown fox jumps over the lazy dog." is not base64 encoded', function () {
            expect(isBase64('The quick brown fox jumps over the lazy dog.')).toBeFalse();
        });

        it('indicates that "VGhlIHF1aWNrIGJyb3duIGZveCBqdW1wcyBvdmVyIHRoZSBsYXp5IGRvZy4=" is base64 encoded', function () {
            expect(isBase64('VGhlIHF1aWNrIGJyb3duIGZveCBqdW1wcyBvdmVyIHRoZSBsYXp5IGRvZy4=')).toBeTrue();
        });
    });

    describe('convertBlobToBase64Async', function () {
        it('converts the Blob content to a base64 encoded string', async function () {
            const blob = new Blob(['Hello World!']);
            await expectAsync(convertBlobToBase64Async(blob)).toBeResolvedTo('SGVsbG8gV29ybGQh');
        });
    });
});