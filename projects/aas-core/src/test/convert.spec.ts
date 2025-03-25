/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
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
    isValidDate,
} from '../lib/convert.js';

describe('Convert', () => {
    describe('convertFromString', () => {
        it('converts "true", "false" to xs:boolean', () => {
            expect(convertFromString('false', 'xs:boolean')).toBeFalsy();
            expect(convertFromString('true', 'xs:boolean')).toBeTruthy();
        });

        it('to number', () => {
            expect(convertFromString('-128', 'xs:byte')).toEqual(-128);
            expect(convertFromString('0xff', 'xs:byte')).toEqual(-1);
            expect(convertFromString('-1', 'xs:unsignedByte')).toBeUndefined();
            expect(convertFromString('0xff', 'xs:unsignedByte')).toEqual(255);
        });

        it('localized to number', () => {
            expect(convertFromString('1.234', 'xs:double', 'en-us')).toEqual(1.234);
            expect(convertFromString('1,234', 'xs:double', 'de-de')).toEqual(1.234);
        });

        it('returns undefined when try to convert "abc" to int', () => {
            expect(convertFromString('abc', 'xs:int')).toBeUndefined();
        });

        it('returns undefined when try to convert null to int', () => {
            expect(convertFromString(null, 'xs:int')).toBeUndefined();
        });

        it('returns undefined when try to convert undefined to int', () => {
            expect(convertFromString(undefined, 'xs:int')).toBeUndefined();
        });
    });

    describe('convertToString', () => {
        it('converts "Hello World!" to "Hello World!"', () => {
            expect(convertToString('Hello World!')).toEqual('Hello World!');
        });

        it('converts true to "true"', () => {
            expect(convertToString(true)).toEqual('true');
        });

        it('converts false to "false"', () => {
            expect(convertToString(false)).toEqual('false');
        });

        it('converts 42 to "42"', () => {
            expect(convertToString(42)).toEqual('42');
        });

        it('converts 42n to "42"', () => {
            expect(convertToString(42n)).toEqual('42');
        });

        it('converts 42.123 to "42,123" (de-de)', () => {
            expect(convertToString(42.123, 'de-de')).toEqual('42,123');
        });

        it('converts 42.123 to "42.123" (en-us)', () => {
            expect(convertToString(42.123, 'en-us')).toEqual('42.123');
        });

        it('converts new Date(123456) to "1.1.1970, 01:02:03" (de-de)', () => {
            expect(convertToString(new Date('1/1/1970, 1:02:03 AM'), 'de-de')).toEqual('1.1.1970, 01:02:03');
        });

        it('converts new Date(123456) to "1/1/1970, 1:02:03 AM" (en-us)', () => {
            expect(convertToString(new Date('1/1/1970, 1:02:03 AM'), 'en-us')).toEqual('1/1/1970, 1:02:03 AM');
        });

        it('converts an array', () => {
            expect(convertToString([1, 2])).toEqual('[1, 2]');
        });

        it('converts an object', () => {
            expect(convertToString({ text: 'Hello world!', number: 42 })).toEqual(
                JSON.stringify({ text: 'Hello world!', number: 42 }, undefined, 2),
            );
        });
    });

    describe('changeType', () => {
        it('leaves number as number', () => {
            expect(changeType(1.23, 'xs:double')).toEqual(1.23);
        });

        it('leaves boolean as boolean', () => {
            expect(changeType(true, 'xs:boolean')).toEqual(true);
        });

        it('leaves string as string', () => {
            expect(changeType('Hello World!', 'xs:string')).toEqual('Hello World!');
        });

        it('leaves Date as Date', () => {
            const date = new Date();
            expect(changeType(date, 'xs:dateTime')).toEqual(date.getTime());
        });

        it('converts string to boolean', () => {
            expect(changeType('true', 'xs:boolean')).toEqual(true);
            expect(changeType('false', 'xs:boolean')).toEqual(false);
            expect(changeType('', 'xs:boolean')).toEqual(false);
            expect(changeType('0', 'xs:boolean')).toEqual(false);
            expect(changeType('Hello World!', 'xs:boolean')).toEqual(true);
        });

        it('converts number to boolean', () => {
            expect(changeType(0.0, 'xs:boolean')).toEqual(false);
            expect(changeType(1.0, 'xs:boolean')).toEqual(true);
            expect(changeType(-1, 'xs:boolean')).toEqual(true);
        });

        it('converts string to double', () => {
            expect(changeType('1.0', 'xs:double')).toEqual(1.0);
        });

        it('converts de-de string to double', () => {
            expect(changeType('1,123', 'xs:double', 'de-de')).toEqual(1.123);
        });

        it('converts boolean to double', () => {
            expect(changeType(true, 'xs:double')).toEqual(1.0);
            expect(changeType(false, 'xs:double')).toEqual(0.0);
        });
    });

    describe('determineType', () => {
        it('recognize as boolean', () => {
            expect(determineType('true')).toEqual('xs:boolean');
            expect(determineType('false')).toEqual('xs:boolean');
            expect(determineType('TRUE')).toEqual('xs:boolean');
            expect(determineType('FALSE')).toEqual('xs:boolean');
        });

        it('recognizes "1.23" as double', () => {
            expect(determineType('1.23')).toEqual('xs:double');
        });

        it('recognizes "42" as int', () => {
            expect(determineType('42')).toEqual('xs:int');
        });

        it('recognizes as dateTime', () => {
            expect(determineType(new Date().toString())).toEqual('xs:dateTime');
        });

        it('recognizes "Hello World!" as string', () => {
            expect(determineType('Hello World!')).toEqual('xs:string');
            expect(determineType('')).toEqual('xs:string');
        });

        it('recognizes as undefined', () => {
            expect(determineType(null)).toBeUndefined;
            expect(determineType(undefined)).toBeUndefined;
        });

        it('returns 42 as int', () => {
            expect(determineType(42)).toEqual('xs:int');
        });

        it('returns 42.123 as double', () => {
            expect(determineType(42.123)).toEqual('xs:double');
        });

        it('returns true as boolean', () => {
            expect(determineType(true)).toEqual('xs:boolean');
        });

        it('returns 281474976710656n as long', () => {
            expect(determineType(281474976710656n)).toEqual('xs:long');
        });

        it('returns new Date() as dateTime', () => {
            expect(determineType(new Date())).toEqual('xs:dateTime');
        });
    });

    describe('getLocaleValue', () => {
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

        it('gets "Hello World!" for en-us', () => {
            expect(getLocaleValue(localizable, 'en-us')).toEqual('Hello World!');
        });

        it('gets "Hallo Welt!" for de-de', () => {
            expect(getLocaleValue(localizable, 'de-de')).toEqual('Hallo Deutschland!');
        });

        it('gets "Hallo Welt!" for de', () => {
            expect(getLocaleValue(localizable, 'de')).toEqual('Hallo Welt!');
        });

        it('gets "Hallo Welt!" for de-ch', () => {
            expect(getLocaleValue(localizable, 'de-lu')).toEqual('Hallo Luxembourg!');
        });

        it('gets first entry for unknown language', () => {
            expect(getLocaleValue(localizable, 'fr-fr')).toEqual('Hello World!');
        });
    });

    describe('getDefaultValue', () => {
        it('returns "false" for boolean data types', () => {
            expect(getDefaultValue('xs:boolean')).toBeFalsy();
        });

        it('returns "0" for number data types', () => {
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

        it('returns "0n" for bigint data types', () => {
            expect(getDefaultValue('xs:long')).toEqual(0n);
            expect(getDefaultValue('xs:unsignedLong')).toEqual(0n);
        });

        it(`returns "${new Date(0)}" for time date data types`, () => {
            expect(getDefaultValue('xs:date')).toEqual(new Date(0).getTime());
            expect(getDefaultValue('xs:dateTime')).toEqual(new Date(0).getTime());
            expect(getDefaultValue('xs:time')).toEqual(new Date(0).getTime());
        });

        it('returns "" for string data types', () => {
            expect(getDefaultValue('xs:string')).toEqual('');
        });
    });

    describe('isBooleanType', () => {
        it('indicates that "xs:int" is not a boolean', () => {
            expect(isBooleanType('xs:int')).toBeFalsy();
        });

        it('indicates that "xs:boolean" is a boolean', () => {
            expect(isBooleanType('xs:boolean')).toBeTruthy();
        });
    });

    describe('parseNumber', () => {
        it('parses invariant 1,234.567', () => {
            expect(parseNumber('1,234.567')).toEqual(1234.567);
        });

        it('parses invariant 1234.567', () => {
            expect(parseNumber('1234.567')).toEqual(1234.567);
        });

        it('parses "en" 1,234.567', () => {
            expect(parseNumber('1,234.567', 'en')).toEqual(1234.567);
        });

        it('parses "de" 1.234,567', () => {
            expect(parseNumber('1.234,567', 'de')).toEqual(1234.567);
        });
    });

    describe('parseDate', () => {
        it('converts en-us date "02/27/2023"', () => {
            expect(parseDate('02/27/2023', 'en-us')).toEqual(new Date(2023, 1, 27));
        });

        it('converts en-us date and time "02/27/2023, 1:14 PM"', () => {
            expect(parseDate('02/27/2023, 1:14 PM', 'en-us')).toEqual(new Date(2023, 1, 27, 13, 14));
        });

        it('converts de-de date "27.02.2023"', () => {
            expect(parseDate('27.02.2023', 'de-de')).toEqual(new Date(2023, 1, 27));
        });

        it('converts de-de date and time "27.02.2023, 13:14"', () => {
            expect(parseDate('27.02.2023, 13:14', 'de-de')).toEqual(new Date(2023, 1, 27, 13, 14));
        });

        it('converts date "11/2020"', () => {
            expect(parseDate('11/2020')).toEqual(new Date(2020, 10));
        });

        it('converts date "new Date(2023, 1, 27, 13, 14, 15, 16)"', () => {
            const date = new Date(2023, 1, 27, 13, 14, 15).toString();
            expect(parseDate(date)).toEqual(new Date(2023, 1, 27, 13, 14, 15));
        });

        it('converts "2023-03-22"', () => {
            expect(parseDate('2023-03-22')).toEqual(new Date('2023-03-22'));
        });
    });

    describe('isValidDate', () => {
        it('indicates that IEC 61984 is invalid', () => {
            expect(isValidDate(new Date('IEC 61984'))).toEqual(false);
        });

        it('indicates that 2023-03-22 is valid', () => {
            expect(isValidDate(new Date('2023-03-22'))).toEqual(true);
        });
    });

    describe('toLocale', () => {
        it('converts 1234.56 to "de" 1.234,56', () => {
            expect(toLocale('1234.56', 'xs:double', 'de')).toEqual('1.234,56');
        });

        it('converts 1234.56 to "en" 1,234.56', () => {
            expect(toLocale('1234.56', 'xs:double', 'en')).toEqual('1,234.56');
        });

        it('converts double undefined to undefined', () => {
            expect(toLocale(undefined, 'xs:double', 'en')).toBeUndefined;
        });

        it('converts double "invalid" to undefined', () => {
            expect(toLocale(undefined, 'xs:double', 'en')).toBeUndefined;
        });
    });

    describe('toInvariant', () => {
        it('converts "de" 1.234,56 to 1234.56', () => {
            expect(toInvariant('1.234,56', 'xs:double', 'de')).toEqual('1234.56');
        });

        it('converts "en" 1,234.56 to 1234.56', () => {
            expect(toInvariant('1,234.56', 'xs:double', 'en')).toEqual('1234.56');
        });

        it('converts double undefined to undefined', () => {
            expect(toInvariant(undefined, 'xs:double', 'en')).toBeUndefined;
        });

        it('converts double "invalid" to undefined', () => {
            expect(toInvariant(undefined, 'xs:double', 'en')).toBeUndefined;
        });
    });

    describe('toBoolean', () => {
        it('converts undefined to false', () => {
            expect(toBoolean(undefined)).toBeFalsy();
        });

        it('converts null to false', () => {
            expect(toBoolean(null)).toBeFalsy();
        });

        it('converts 0 to false', () => {
            expect(toBoolean(0)).toBeFalsy();
        });

        it('converts 1 to true', () => {
            expect(toBoolean(1)).toBeTruthy();
        });

        it('converts "true" to true', () => {
            expect(toBoolean('true')).toBeTruthy();
        });

        it('converts "false" to false', () => {
            expect(toBoolean('false')).toBeFalsy();
        });
    });

    describe('mimeTypeToExtension', () => {
        it('return ".png" for "image/png"', () => {
            expect(mimeTypeToExtension('image/png')).toEqual('.png');
        });

        it('return undefined for an unknown MIME type', () => {
            expect(mimeTypeToExtension('unknown')).toBeUndefined();
        });
    });

    describe('extensionToMimeType', () => {
        it('return "image/png" for ".png"', () => {
            expect(extensionToMimeType('.png')).toEqual('image/png');
        });

        it('return undefined for an unknown MIME type', () => {
            expect(extensionToMimeType('unknown')).toBeUndefined();
        });
    });
});