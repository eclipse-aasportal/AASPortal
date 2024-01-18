/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { describe, it, expect } from '@jest/globals';
import { LangString } from '../lib/aas.js';
import {
    changeType,
    determineType,
    convertFromString,
    getLocaleValue,
    getDefaultValue,
    convertToString,
    isBooleanType,
    parseDate,
    toLocale,
    toInvariant,
    parseNumber,
    toBoolean,
    mimeTypeToExtension,
    extensionToMimeType,
} from '../lib/convert.js';

describe('Convert', function () {
    describe('convertFromString', function () {
        it('converts "true", "false" to xs:boolean', function () {
            expect(convertFromString('false', 'xs:boolean')).toBeFalsy();
            expect(convertFromString('true', 'xs:boolean')).toBeTruthy();
        });

        it('to number', function () {
            expect(convertFromString('-128', 'xs:byte')).toEqual(-128);
            expect(convertFromString('0xff', 'xs:byte')).toEqual(-1);
            expect(convertFromString('-1', 'xs:unsignedByte')).toBeUndefined();
            expect(convertFromString('0xff', 'xs:unsignedByte')).toEqual(255);
        });

        it('localized to number', function () {
            expect(convertFromString('1.234', 'xs:double', 'en-us')).toEqual(1.234);
            expect(convertFromString('1,234', 'xs:double', 'de-de')).toEqual(1.234);
        });

        it('returns undefined when try to convert "abc" to int', function () {
            expect(convertFromString('abc', 'xs:int')).toBeUndefined();
        });

        it('returns undefined when try to convert null to int', function () {
            expect(convertFromString(null, 'xs:int')).toBeUndefined();
        });

        it('returns undefined when try to convert undefined to int', function () {
            expect(convertFromString(undefined, 'xs:int')).toBeUndefined();
        });
    });

    describe('convertToString', function () {
        it('converts "Hello World!" to "Hello World!"', function () {
            expect(convertToString('Hello World!')).toEqual('Hello World!');
        });

        it('converts true to "true"', function () {
            expect(convertToString(true)).toEqual('true');
        });

        it('converts false to "false"', function () {
            expect(convertToString(false)).toEqual('false');
        });

        it('converts 42 to "42"', function () {
            expect(convertToString(42)).toEqual('42');
        });

        it('converts 42n to "42"', function () {
            expect(convertToString(42n)).toEqual('42');
        });

        it('converts 42.123 to "42,123" (de-de)', function () {
            expect(convertToString(42.123, 'de-de')).toEqual('42,123');
        });

        it('converts 42.123 to "42.123" (en-us)', function () {
            expect(convertToString(42.123, 'en-us')).toEqual('42.123');
        });

        it('converts new Date(123456) to "1.1.1970, 01:02:03" (de-de)', function () {
            expect(convertToString(new Date('1/1/1970, 1:02:03 AM'), 'de-de')).toEqual('1.1.1970, 01:02:03');
        });

        it('converts new Date(123456) to "1/1/1970, 1:02:03 AM" (en-us)', function () {
            expect(convertToString(new Date('1/1/1970, 1:02:03 AM'), 'en-us')).toEqual('1/1/1970, 1:02:03 AM');
        });

        it('converts an array', function () {
            expect(convertToString([1, 2])).toEqual('[1, 2]');
        });

        it('converts an object', function () {
            expect(convertToString({ text: 'Hello world!', number: 42 })).toEqual(
                JSON.stringify({ text: 'Hello world!', number: 42 }, undefined, 2),
            );
        });
    });

    describe('changeType', function () {
        it('leaves number as number', function () {
            expect(changeType(1.23, 'xs:double')).toEqual(1.23);
        });

        it('leaves boolean as boolean', function () {
            expect(changeType(true, 'xs:boolean')).toEqual(true);
        });

        it('leaves string as string', function () {
            expect(changeType('Hello World!', 'xs:string')).toEqual('Hello World!');
        });

        it('leaves Date as Date', function () {
            const date = new Date();
            expect(changeType(date, 'xs:dateTime')).toEqual(date.getTime());
        });

        it('converts string to boolean', function () {
            expect(changeType('true', 'xs:boolean')).toEqual(true);
            expect(changeType('false', 'xs:boolean')).toEqual(false);
            expect(changeType('', 'xs:boolean')).toEqual(false);
            expect(changeType('0', 'xs:boolean')).toEqual(false);
            expect(changeType('Hello World!', 'xs:boolean')).toEqual(true);
        });

        it('converts number to boolean', function () {
            expect(changeType(0.0, 'xs:boolean')).toEqual(false);
            expect(changeType(1.0, 'xs:boolean')).toEqual(true);
            expect(changeType(-1, 'xs:boolean')).toEqual(true);
        });

        it('converts string to double', function () {
            expect(changeType('1.0', 'xs:double')).toEqual(1.0);
        });

        it('converts de-de string to double', function () {
            expect(changeType('1,123', 'xs:double', 'de-de')).toEqual(1.123);
        });

        it('converts boolean to double', function () {
            expect(changeType(true, 'xs:double')).toEqual(1.0);
            expect(changeType(false, 'xs:double')).toEqual(0.0);
        });
    });

    describe('determineType', function () {
        it('recognize as boolean', function () {
            expect(determineType('true')).toEqual('xs:boolean');
            expect(determineType('false')).toEqual('xs:boolean');
            expect(determineType('TRUE')).toEqual('xs:boolean');
            expect(determineType('FALSE')).toEqual('xs:boolean');
        });

        it('recognizes "1.23" as double', function () {
            expect(determineType('1.23')).toEqual('xs:double');
        });

        it('recognizes "42" as int', function () {
            expect(determineType('42')).toEqual('xs:int');
        });

        it('recognizes as dateTime', function () {
            expect(determineType(new Date().toString())).toEqual('xs:dateTime');
        });

        it('recognizes "Hello World!" as string', function () {
            expect(determineType('Hello World!')).toEqual('xs:string');
            expect(determineType('')).toEqual('xs:string');
        });

        it('recognizes as undefined', function () {
            expect(determineType(null)).toBeUndefined;
            expect(determineType(undefined)).toBeUndefined;
        });

        it('returns 42 as int', function () {
            expect(determineType(42)).toEqual('xs:int');
        });

        it('returns 42.123 as double', function () {
            expect(determineType(42.123)).toEqual('xs:double');
        });

        it('returns true as boolean', function () {
            expect(determineType(true)).toEqual('xs:boolean');
        });

        it('returns 281474976710656n as long', function () {
            expect(determineType(281474976710656n)).toEqual('xs:long');
        });

        it('returns new Date() as dateTime', function () {
            expect(determineType(new Date())).toEqual('xs:dateTime');
        });
    });

    describe('getLocaleValue', function () {
        let localizable: LangString[];

        beforeEach(() => {
            localizable = [
                {
                    language: 'en-us',
                    text: 'Hello World!',
                },
                {
                    language: 'de-de',
                    text: 'Hallo Deutschland!',
                },
                {
                    language: 'de-LU',
                    text: 'Hallo Luxembourg!',
                },
                {
                    language: 'de',
                    text: 'Hallo Welt!',
                },
            ];
        });

        it('gets "Hello World!" for en-us', function () {
            expect(getLocaleValue(localizable, 'en-us')).toEqual('Hello World!');
        });

        it('gets "Hallo Welt!" for de-de', function () {
            expect(getLocaleValue(localizable, 'de-de')).toEqual('Hallo Deutschland!');
        });

        it('gets "Hallo Welt!" for de', function () {
            expect(getLocaleValue(localizable, 'de')).toEqual('Hallo Welt!');
        });

        it('gets "Hallo Welt!" for de-ch', function () {
            expect(getLocaleValue(localizable, 'de-lu')).toEqual('Hallo Luxembourg!');
        });

        it('gets first entry for unknown language', function () {
            expect(getLocaleValue(localizable, 'fr-fr')).toEqual('Hello World!');
        });
    });

    describe('getDefaultValue', function () {
        it('returns "false" for boolean data types', function () {
            expect(getDefaultValue('xs:boolean')).toBeFalsy();
        });

        it('returns "0" for number data types', function () {
            expect(getDefaultValue('xs:byte')).toEqual(0);
            expect(getDefaultValue('xs:decimal')).toEqual(0);
            expect(getDefaultValue('xs:double')).toEqual(0);
            expect(getDefaultValue('xs:float')).toEqual(0);
            expect(getDefaultValue('xs:int')).toEqual(0);
            expect(getDefaultValue('xs:integer')).toEqual(0);
            expect(getDefaultValue('xs:short')).toEqual(0);
            expect(getDefaultValue('xs:unsignedByte')).toEqual(0);
            expect(getDefaultValue('xs:unsignedInt')).toEqual(0);
            expect(getDefaultValue('xs:unsignedShort')).toEqual(0);
        });

        it('returns "0n" for bigint data types', function () {
            expect(getDefaultValue('xs:long')).toEqual(0n);
            expect(getDefaultValue('xs:unsignedLong')).toEqual(0n);
        });

        it(`returns "${new Date(0)}" for time date data types`, function () {
            expect(getDefaultValue('xs:date')).toEqual(new Date(0).getTime());
            expect(getDefaultValue('xs:dateTime')).toEqual(new Date(0).getTime());
            expect(getDefaultValue('xs:time')).toEqual(new Date(0).getTime());
        });

        it('returns "" for string data types', function () {
            expect(getDefaultValue('xs:string')).toEqual('');
        });
    });

    describe('isBooleanType', function () {
        it('indicates that "xs:int" is not a boolean', function () {
            expect(isBooleanType('xs:int')).toBeFalsy();
        });

        it('indicates that "xs:boolean" is a boolean', function () {
            expect(isBooleanType('xs:boolean')).toBeTruthy();
        });
    });

    describe('parseNumber', function () {
        it('parses invariant 1,234.567', function () {
            expect(parseNumber('1,234.567')).toEqual(1234.567);
        });

        it('parses invariant 1234.567', function () {
            expect(parseNumber('1234.567')).toEqual(1234.567);
        });

        it('parses "en" 1,234.567', function () {
            expect(parseNumber('1,234.567', 'en')).toEqual(1234.567);
        });

        it('parses "de" 1.234,567', function () {
            expect(parseNumber('1.234,567', 'de')).toEqual(1234.567);
        });
    });

    describe('parseDate', function () {
        it('converts en-us date "02/27/2023"', function () {
            expect(parseDate('02/27/2023', 'en-us')).toEqual(new Date(2023, 1, 27));
        });

        it('converts en-us date and time "02/27/2023, 1:14 PM"', function () {
            expect(parseDate('02/27/2023, 1:14 PM', 'en-us')).toEqual(new Date(2023, 1, 27, 13, 14));
        });

        it('converts de-de date "27.02.2023"', function () {
            expect(parseDate('27.02.2023', 'de-de')).toEqual(new Date(2023, 1, 27));
        });

        it('converts de-de date and time "27.02.2023, 13:14"', function () {
            expect(parseDate('27.02.2023, 13:14', 'de-de')).toEqual(new Date(2023, 1, 27, 13, 14));
        });

        it('converts date "11/2020"', function () {
            expect(parseDate('11/2020')).toEqual(new Date(2020, 10));
        });

        it('converts date "new Date(2023, 1, 27, 13, 14, 15, 16)"', function () {
            const date = new Date(2023, 1, 27, 13, 14, 15).toString();
            expect(parseDate(date)).toEqual(new Date(2023, 1, 27, 13, 14, 15));
        });
    });

    describe('toLocale', function () {
        it('converts 1234.56 to "de" 1.234,56', function () {
            expect(toLocale('1234.56', 'xs:double', 'de')).toEqual('1.234,56');
        });

        it('converts 1234.56 to "en" 1,234.56', function () {
            expect(toLocale('1234.56', 'xs:double', 'en')).toEqual('1,234.56');
        });

        it('converts double undefined to undefined', function () {
            expect(toLocale(undefined, 'xs:double', 'en')).toBeUndefined;
        });

        it('converts double "invalid" to undefined', function () {
            expect(toLocale(undefined, 'xs:double', 'en')).toBeUndefined;
        });
    });

    describe('toInvariant', function () {
        it('converts "de" 1.234,56 to 1234.56', function () {
            expect(toInvariant('1.234,56', 'xs:double', 'de')).toEqual('1234.56');
        });

        it('converts "en" 1,234.56 to 1234.56', function () {
            expect(toInvariant('1,234.56', 'xs:double', 'en')).toEqual('1234.56');
        });

        it('converts double undefined to undefined', function () {
            expect(toInvariant(undefined, 'xs:double', 'en')).toBeUndefined;
        });

        it('converts double "invalid" to undefined', function () {
            expect(toInvariant(undefined, 'xs:double', 'en')).toBeUndefined;
        });
    });

    describe('toBoolean', function () {
        it('converts undefined to false', function () {
            expect(toBoolean(undefined)).toBeFalsy();
        });

        it('converts null to false', function () {
            expect(toBoolean(null)).toBeFalsy();
        });

        it('converts 0 to false', function () {
            expect(toBoolean(0)).toBeFalsy();
        });

        it('converts 1 to true', function () {
            expect(toBoolean(1)).toBeTruthy();
        });

        it('converts "true" to true', function () {
            expect(toBoolean('true')).toBeTruthy();
        });

        it('converts "false" to false', function () {
            expect(toBoolean('false')).toBeFalsy();
        });
    });

    describe('mimeTypeToExtension', function () {
        it('return ".png" for "image/png"', function () {
            expect(mimeTypeToExtension('image/png')).toEqual('.png');
        });

        it('return undefined for an unknown MIME type', function () {
            expect(mimeTypeToExtension('unknown')).toBeUndefined();
        });
    });

    describe('extensionToMimeType', function () {
        it('return "image/png" for ".png"', function () {
            expect(extensionToMimeType('.png')).toEqual('image/png');
        });

        it('return undefined for an unknown MIME type', function () {
            expect(extensionToMimeType('unknown')).toBeUndefined();
        });
    });
});
