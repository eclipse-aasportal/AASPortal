/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it, Mocked } from 'vitest';
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
    validateEndpointUrl,
} from './utilities';
import { createSpyObj } from '../test/mocks';

describe('utilities', () => {
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
        let translate: Mocked<TranslateService>;

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
            translate.instant.mockReturnValue('Hello World!');
            const error = new ApplicationError('HELLO_WORLD', { arg: 'World' });
            expect(messageToString(error, translate)).toEqual('Hello World!');
        });
    });

    describe('encodeBase64Url', () => {
        it('converts an URL to Base64Url string', () => {
            const b64url = encodeBase64Url('https://iosb-ina.fraunhofer.de/ids/aas/5174_7001_0122_9237');
            expect(b64url).toEqual('aHR0cHM6Ly9pb3NiLWluYS5mcmF1bmhvZmVyLmRlL2lkcy9hYXMvNTE3NF83MDAxXzAxMjJfOTIzNw');
        });

        it('converts ÄÖÜäöüß to Base64Url string', () => {
            const b64url = encodeBase64Url('ÄÖÜäöüß');
            expect(b64url).toEqual('w4TDlsOcw6TDtsO8w58');
        });
    });

    describe('decodeBase64Url', () => {
        it('converts a Base64Url string to an URL', () => {
            const url = decodeBase64Url(
                'aHR0cHM6Ly9pb3NiLWluYS5mcmF1bmhvZmVyLmRlL2lkcy9hYXMvNTE3NF83MDAxXzAxMjJfOTIzNw',
            );
            expect(url).toEqual('https://iosb-ina.fraunhofer.de/ids/aas/5174_7001_0122_9237');
        });

        it('converts Base64Url string of ÄÖÜäöüß to normal string', () => {
            const str = decodeBase64Url('w4TDlsOcw6TDtsO8w58');
            expect(str).toEqual('ÄÖÜäöüß');
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

    describe('validateEndpointUrl', () => {
        it('validates a valid HTTP URL for AAS_API endpoint type', () => {
            expect(validateEndpointUrl('https://example.com/aas', 'AAS_API')).toBe(true);
        });

        it('invalidates an invalid HTTP URL for AAS_API endpoint type', () => {
            expect(validateEndpointUrl('invalid-url', 'AAS_API')).toBe(false);
        });

        it('validates a valid OPC UA URL for OPC_UA endpoint type', () => {
            expect(validateEndpointUrl('opc.tcp://example.com:4840', 'OPC_UA')).toBe(true);
        });

        it('invalidates an invalid OPC UA URL for OPC_UA endpoint type', () => {
            expect(validateEndpointUrl('invalid-url', 'OPC_UA')).toBe(false);
        });

        it('validates a valid WebDAV URL for WebDAV endpoint type', () => {
            expect(validateEndpointUrl('https://example.com/webdav', 'WebDAV')).toBe(true);
        });

        it('invalidates an invalid WebDAV URL for WebDAV endpoint type', () => {
            expect(validateEndpointUrl('invalid-url', 'WebDAV')).toBe(false);
        });

        it('validates a valid file path for FileSystem endpoint type', () => {
            expect(validateEndpointUrl('file://C:/example/path', 'FileSystem')).toBe(true);
        });

        it('invalidates an invalid file path for FileSystem endpoint type', () => {
            expect(validateEndpointUrl('invalid-path', 'FileSystem')).toBe(false);
        });

        it('invalidates an HTTP URL with invalid version', () => {
            expect(validateEndpointUrl('https://example.com/aas?version=invalid', 'AAS_API')).toBe(false);
        });
    });
});
