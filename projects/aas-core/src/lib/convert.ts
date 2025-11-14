/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import {
    AssetAdministrationShell,
    ConceptDescription,
    DataTypeDefXsd,
    Environment,
    LangString,
    Submodel,
    SubmodelElement,
} from './aas.js';
import * as jsonization from './aas-core/jsonization.js';
import * as types from './aas-core/types.js';

const dateTimeFormat: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
};

const invariantDecimalSeparator = '.';
const invariantGroupSeparator = ',';

const mimeTypes = new Map<string, string | string[]>([
    ['application/epub+zip', '.epub'],
    ['application/gzip', '.gz'],
    ['application/java-archive', '.jar'],
    ['application/json', '.json'],
    ['application/ld+json', '.jsonld'],
    ['application/msword', '.doc'],
    ['application/octet-stream', '.bin'],
    ['application/ogg', '.ogx'],
    ['application/pdf', '.pdf'],
    ['application/rtf', '.rtf'],
    ['application/vnd.amazon.ebook', '.azw'],
    ['application/vnd.apple.installer+xml', '.mpkg'],
    ['application/vnd.mozilla.xul+xml', '.xul'],
    ['application/vnd.ms-excel', '.xls'],
    ['application/vnd.ms-fontobject', '.eot'],
    ['application/vnd.ms-powerpoint', '.ppt'],
    ['application/vnd.oasis.opendocument.presentation', '.odp'],
    ['application/vnd.oasis.opendocument.spreadsheet', '.ods'],
    ['application/vnd.oasis.opendocument.text', '.odt'],
    ['application/vnd.openxmlformats-officedocument.presentationml.presentation', '.pptx'],
    ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '.xlsx'],
    ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.docx'],
    ['application/vnd.rar', '.rar'],
    ['application/vnd.visio', '.vsd'],
    ['application/x-7z-compressed', '.7z'],
    ['application/x-abiword', '.abw'],
    ['application/x-bzip', '.bz'],
    ['application/x-bzip2', '.bz2'],
    ['application/x-cdf', '.cda'],
    ['application/x-csh', '.csh'],
    ['application/x-freearc', '.arc'],
    ['application/x-httpd-php', '.php'],
    ['application/x-pem-file', '.pem'],
    ['application/x-sh', '.sh'],
    ['application/x-tar', '.tar'],
    ['application/xhtml+xml', '.xhtml'],
    ['application/xml', '.xml'],
    ['application/zip', '.zip'],
    ['audio/3gpp', '.3gp'],
    ['audio/3gpp2', '.3g2'],
    ['audio/aac', '.aac'],
    ['audio/midi', '.midi'],
    ['audio/mpeg', '.mp3'],
    ['audio/ogg', '.oga'],
    ['audio/opus', '.opus'],
    ['audio/wav', '.wav'],
    ['audio/webm', '.weba'],
    ['audio/x-midi', '.midi'],
    ['font/otf', '.otf'],
    ['font/ttf', '.ttf'],
    ['font/woff', '.woff'],
    ['font/woff2', '.woff2'],
    ['image/avif', '.avif'],
    ['image/bmp', '.bmp'],
    ['image/gif', '.gif'],
    ['image/jpeg', ['.jpg', '.jpeg']],
    ['image/png', '.png'],
    ['image/svg+xml', '.svg'],
    ['image/tiff', '.tiff'],
    ['image/vnd.microsoft.icon', '.ico'],
    ['text/calendar', '.ics'],
    ['text/css', '.css'],
    ['text/csv', '.csv'],
    ['text/html', '.html'],
    ['text/javascript', '.js'],
    ['text/plain', '.txt'],
    ['text/xml', '.xml'],
    ['video/3gpp', '.3gp'],
    ['video/3gpp2', '.3g2'],
    ['video/mp2t', '.ts'],
    ['video/mp4', '.mp4'],
    ['video/mpeg', '.mpeg'],
    ['video/ogg', '.ogv'],
    ['video/webm', '.webp'],
    ['video/x-msvideo', '.avi'],
]);

export type DefaultType = string | number | boolean | bigint;

export type StandardType = string | number | boolean | object;

/**
 * Assigns a XSD data type to a corresponding JS data type.
 * @param type The current XSD data type.
 * @returns The corresponding JS data type.
 */
export function baseType(type: DataTypeDefXsd): 'string' | 'number' | 'boolean' | 'bigint' | 'Date' {
    switch (type) {
        case 'xs:anyURI':
            return 'string';
        case 'xs:base64Binary':
            return 'string';
        case 'xs:boolean':
            return 'boolean';
        case 'xs:byte':
            return 'number';
        case 'xs:date':
            return 'Date';
        case 'xs:dateTime':
            return 'Date';
        case 'xs:decimal':
            return 'number';
        case 'xs:double':
            return 'number';
        case 'xs:duration':
            return 'Date';
        case 'xs:float':
            return 'number';
        case 'xs:gDay':
            return 'Date';
        case 'xs:gMonth':
            return 'Date';
        case 'xs:gMonthDay':
            return 'Date';
        case 'xs:gYear':
            return 'Date';
        case 'xs:gYearMonth':
            return 'Date';
        case 'xs:hexBinary':
            return 'string';
        case 'xs:int':
            return 'number';
        case 'xs:integer':
            return 'number';
        case 'xs:long':
            return 'bigint';
        case 'xs:negativeInteger':
            return 'number';
        case 'xs:nonNegativeInteger':
            return 'number';
        case 'xs:nonPositiveInteger':
            return 'number';
        case 'xs:positiveInteger':
            return 'number';
        case 'xs:short':
            return 'number';
        case 'xs:string':
            return 'string';
        case 'xs:time':
            return 'Date';
        case 'xs:unsignedByte':
            return 'number';
        case 'xs:unsignedInt':
            return 'number';
        case 'xs:unsignedLong':
            return 'bigint';
        case 'xs:unsignedShort':
            return 'number';
    }
}

/**
 * Converts a value into an other data type.
 * @param value The current value.
 * @param type The destination data type.
 * @param localId The locale identifier.
 * @returns The converted value.
 */
export function changeType(value: unknown, type: DataTypeDefXsd, localId?: string): DefaultType | undefined {
    switch (type) {
        case 'xs:boolean':
            return toBoolean(value);
        case 'xs:anyURI':
            return convertToString(value);
        case 'xs:double':
        case 'xs:float':
        case 'xs:decimal':
            return toDouble(value, localId);
        case 'xs:integer':
        case 'xs:int':
        case 'xs:byte':
        case 'xs:short':
        case 'xs:unsignedByte':
        case 'xs:unsignedInt':
        case 'xs:unsignedShort':
        case 'xs:negativeInteger':
        case 'xs:nonNegativeInteger':
        case 'xs:nonPositiveInteger':
        case 'xs:positiveInteger':
            return toInteger(value);
        case 'xs:long':
        case 'xs:unsignedLong':
            return toBigInt(value);
        case 'xs:date':
        case 'xs:dateTime':
        case 'xs:time':
            return toDate(value, localId);
        case 'xs:string':
            return convertToString(value, localId);
        default:
            return undefined;
    }
}

/**
 * Converts a value to an equivalent string expression.
 * @param value The current value.
 * @param localeId The locale identifier.
 * @returns A string expression that represents the specified value.
 */
export function convertToString(value: unknown, localeId?: string): string {
    if (value === undefined || value === null) {
        return '';
    }

    if (typeof value === 'string') {
        return value;
    }

    if (typeof value === 'boolean') {
        return value ? 'true' : 'false';
    }

    if (typeof value === 'number') {
        return localeId ? value.toLocaleString(localeId) : value.toString();
    }

    if (value instanceof Date) {
        return localeId ? value.toLocaleString(localeId, dateTimeFormat) : value.toString();
    }

    if (typeof value === 'bigint') {
        return localeId ? value.toLocaleString(localeId) : value.toString();
    }

    if (Array.isArray(value)) {
        return `[${getItems(value).join(', ')}]`;
    }

    if (typeof value === 'object') {
        return JSON.stringify(value, undefined, 2);
    }

    return '';

    function getItems(array: unknown[]): string[] {
        return array.map(item => convertToString(item, localeId));
    }
}

/**
 * Converts a string expression to an equivalent value of the specified type.
 * @param s The string expression.
 * @param valueType The value type.
 * @param localeId The locale identifier.
 * @returns A value of the specified type.
 */
export function convertFromString(
    s: string | null | undefined,
    valueType: DataTypeDefXsd,
    localeId?: string,
): DefaultType | undefined {
    if (!s) {
        return undefined;
    }

    switch (valueType) {
        case 'xs:boolean':
            return stringToBoolean(s);
        case 'xs:anyURI':
            return s;
        case 'xs:unsignedByte':
            return stringToByte(s);
        case 'xs:byte':
            return stringToSByte(s);
        case 'xs:double':
        case 'xs:float':
        case 'xs:decimal':
            return toDouble(s, localeId);
        case 'xs:integer':
        case 'xs:int':
        case 'xs:short':
        case 'xs:unsignedInt':
        case 'xs:unsignedShort':
            return toInteger(s);
        case 'xs:long':
        case 'xs:unsignedLong':
            return toBigInt(s);
        case 'xs:date':
        case 'xs:dateTime':
        case 'xs:time':
            return parseDate(s, localeId)?.getTime();
        case 'xs:string':
            return s;
        default:
            throw new Error('Not implemented.');
    }
}

/**
 * Converts a string expression to a number.
 * @param s The string expression.
 * @param localeId The locale identifier.
 * @returns A number.
 */
export function parseNumber(s: string | undefined, localeId?: string): number {
    if (!s) {
        return NaN;
    }

    let decimalSeparator: string;
    let groupSeparator: string;
    if (localeId) {
        const parts = Intl.NumberFormat(localeId).formatToParts(1234.56789);
        decimalSeparator = parts.find(part => part.type === 'decimal')!.value;
        groupSeparator = parts.find(part => part.type === 'group')!.value;
    } else {
        decimalSeparator = invariantDecimalSeparator;
        groupSeparator = invariantGroupSeparator;
    }

    const items = s.split(decimalSeparator);
    if (items.length > 2) {
        return NaN;
    }

    const groups = items[0].split(groupSeparator);
    if (
        groups.length > 1 &&
        groups.some((group, i) => (i === 0 && group.length > 3) || (i > 0 && group.length !== 3))
    ) {
        return NaN;
    }

    s = groups.join('');
    if (items.length > 1) {
        s += invariantDecimalSeparator + items[1];
    }

    return Number(s);
}

/**
 * Parses a localized string expression into a Date.
 * @param s The string expression that represents a date and time.
 * @param localeId The locale identifier.
 */
export function parseDate(s: string | undefined, localeId?: string): Date | undefined {
    const format = new Intl.DateTimeFormat(localeId, dateTimeFormat);
    const now = new Date();
    const parts = format.formatToParts(now);
    const tuple = getFormatInfo(parts);

    s = s?.trim();
    if (!s) {
        return undefined;
    }

    let date: Date | undefined;
    if (localeId) {
        let dateItems: string[] | undefined;
        let timeTuple: { items: string[]; timePeriod?: string } | undefined;
        const dateTime = splitDateTime(s);
        if (dateTime.length === 1) {
            if (s.indexOf(tuple.dateDelimiter) >= 0) {
                dateItems = s.split(tuple.dateDelimiter);
                const day = getDay(dateItems);
                date = day
                    ? new Date(getYear(dateItems), getMonth(dateItems), getDay(dateItems))
                    : new Date(getYear(dateItems), getMonth(dateItems));
            } else {
                timeTuple = splitTime(s);
                date = new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    now.getDate(),
                    getHours(timeTuple?.items, timeTuple?.timePeriod),
                    getMinutes(timeTuple?.items),
                    getSeconds(timeTuple?.items),
                );
            }
        } else if (dateTime.length === 2) {
            dateItems = dateTime[0].split(tuple.dateDelimiter);
            timeTuple = splitTime(dateTime[1]);
            date = new Date(
                getYear(dateItems),
                getMonth(dateItems),
                getDay(dateItems),
                getHours(timeTuple?.items, timeTuple?.timePeriod),
                getMinutes(timeTuple?.items),
                getSeconds(timeTuple?.items),
            );
        } else {
            date = new Date(0);
        }
    } else {
        date = new Date(s);
        if (date.toString() === 'Invalid Date') {
            date = parseDate(s, 'en');
        }
    }

    return date;

    function splitDateTime(s: string): string[] {
        let index = s.indexOf(',');
        if (index < 0) {
            index = s.indexOf(' ');
        }

        if (index < 0) {
            return [s];
        }

        return [s.substring(0, index).trimEnd(), s.substring(index + 1).trimStart()];
    }

    function getFormatInfo(parts: Intl.DateTimeFormatPart[]): {
        dateDelimiter: string;
        timeDelimiter: string;
        indexOfYear: number;
        indexOfMonth: number;
        indexOfDay: number;
        hours24: boolean;
    } {
        const items = ['year', 'month', 'day'].sort(
            (a, b) => parts.findIndex(item => item.type === a) - parts.findIndex(item => item.type === b),
        );

        return {
            dateDelimiter: parts[3].value,
            timeDelimiter: parts[9].value,
            indexOfDay: items.indexOf('day'),
            indexOfMonth: items.indexOf('month'),
            indexOfYear: items.indexOf('year'),
            hours24: parts.findIndex(part => part.type === 'dayPeriod') < 0,
        };
    }

    function splitTime(exp: string): { items: string[]; timePeriod?: string } {
        if (exp.toLowerCase().endsWith('am')) {
            return { items: exp.substring(0, exp.length - 2).split(tuple.timeDelimiter), timePeriod: 'am' };
        }

        if (exp.toLowerCase().endsWith('pm')) {
            return { items: exp.substring(0, exp.length - 2).split(tuple.timeDelimiter), timePeriod: 'pm' };
        }

        return { items: exp.split(tuple.timeDelimiter) };
    }

    function getYear(items?: string[]): number {
        if (items) {
            if (items.length >= 3) {
                return Number(items[tuple.indexOfYear].trim());
            }

            if (items.length === 1) {
                return Number(items[0].trim());
            }

            if (items.length === 2) {
                return tuple.indexOfMonth < tuple.indexOfYear ? Number(items[1].trim()) : Number(items[0].trim());
            }
        }

        return 0;
    }

    function getMonth(items?: string[]): number {
        if (items) {
            if (items.length >= 3) {
                return Number(items[tuple.indexOfMonth].trim()) - 1;
            }

            if (items.length === 2) {
                return (tuple.indexOfMonth < tuple.indexOfYear ? Number(items[0].trim()) : Number(items[1].trim())) - 1;
            }
        }

        return 0;
    }

    function getDay(items?: string[]): number | undefined {
        return items && items.length >= 3 ? Number(items[tuple.indexOfDay].trim()) : undefined;
    }

    function getHours(items?: string[], timePeriod?: string): number {
        if (items && items.length > 0) {
            return Number(items[0].trim()) + (timePeriod === 'pm' ? 12 : 0);
        }

        return now.getDate();
    }

    function getMinutes(items?: string[]): number {
        return items && items.length > 1 ? Number(items[1].trim()) : 0;
    }

    function getSeconds(items?: string[]): number {
        return items && items.length > 2 ? Number(items[2].trim()) : 0;
    }
}

/**
 * Indicates whether the specified date is valid.
 * @param value The date value.
 * @returns `true` if the date value is valid; otherwise, `false`.
 */
export function isValidDate(value: Date | undefined): boolean {
    if (value === undefined) {
        return false;
    }

    const year = value.getFullYear();
    if (year < 1970 || year > 3000) {
        return false;
    }

    const month = value.getMonth();
    if (month < 0 || month > 11) {
        return false;
    }

    const day = value.getDay();
    if (day < 1 || day > 31) {
        return false;
    }

    const hours = value.getHours();
    if (hours < 0 || hours > 23) {
        return false;
    }

    const minutes = value.getMinutes();
    if (minutes < 0 || minutes > 59) {
        return false;
    }

    const seconds = value.getSeconds();
    if (seconds < 0 || seconds > 59) {
        return false;
    }

    const ms = value.getMilliseconds();
    if (ms < 0 || ms > 999) {
        return false;
    }

    return true;
}

/**
 * Determines the data type from the specified string expression.
 * @param value The value or a string expression.
 * @returns The data type.
 */
export function determineType(value: unknown): DataTypeDefXsd | undefined {
    if (typeof value === 'string') {
        const s = value.trim();
        if (s) {
            const d = Number(s);
            if (!Number.isNaN(d)) {
                return Number.isInteger(d) ? 'xs:int' : 'xs:double';
            }

            if (s.toLocaleLowerCase() === 'true' || s.toLocaleLowerCase() === 'false') {
                return 'xs:boolean';
            }

            if (!Number.isNaN(Date.parse(s))) {
                return 'xs:dateTime';
            }

            // ToDo: How to check if expression is bigint?
        }

        return 'xs:string';
    } else if (typeof value === 'number') {
        return Number.isInteger(value) ? 'xs:int' : 'xs:double';
    } else if (typeof value === 'boolean') {
        return 'xs:boolean';
    } else if (typeof value === 'bigint') {
        return 'xs:long';
    } else if (value instanceof Date) {
        return 'xs:dateTime';
    }

    return undefined;
}

/**
 * Gets a default value for the specified data type.
 * @param type The data type.
 * @returns A default value.
 */
export function getDefaultValue(type: DataTypeDefXsd): DefaultType {
    switch (type) {
        case 'xs:boolean':
            return false;
        case 'xs:anyURI':
            return '';
        case 'xs:byte':
        case 'xs:double':
        case 'xs:float':
        case 'xs:decimal':
        case 'xs:integer':
        case 'xs:int':
        case 'xs:short':
        case 'xs:unsignedByte':
        case 'xs:unsignedInt':
        case 'xs:unsignedShort':
            return 0;
        case 'xs:long':
        case 'xs:unsignedLong':
            return BigInt(0);
        case 'xs:date':
        case 'xs:dateTime':
        case 'xs:time':
            return 0;
        case 'xs:string':
            return '';
        default:
            throw new Error(`Data type "${type}" is not supported.`);
    }
}

/**
 * Returns the value for the specified language.
 * @param value The localizable string.
 * @param localeId The locale identifier.
 * @returns The locale value.
 */
export function getLocaleValue(value?: LangString[], localeId?: string): string | undefined {
    if (value === undefined) {
        return undefined;
    }

    let localeValue: string | undefined;
    if (localeId) {
        const language = getLanguage(localeId);
        for (const item of value) {
            const lcid = item.language.toLowerCase();
            if (lcid === localeId || lcid === language) {
                localeValue = item.text;
                break;
            } else if (!localeValue && getLanguage(item.language) === language) {
                localeValue = item.text;
            }
        }
    }

    return localeValue ?? value.at(0)?.text;

    function getLanguage(value: string): string {
        return value.split('-')[0].toLowerCase();
    }
}

/**
 * Indicates whether the specified data type corresponds to `boolean`.
 * @param type The data type.
 */
export function isBooleanType(type: DataTypeDefXsd): boolean {
    return type === 'xs:boolean';
}

/**
 * Converts a culture invariant value expression to a locale string.
 * @param value The value expression.
 * @param valueType The value type.
 * @param localeId The target language.
 * @param unit The physical unit.
 * @returns The locale string or `undefined`.
 */
export function toDisplayValue(
    value: string | undefined,
    valueType: DataTypeDefXsd,
    localeId?: string,
    unit?: string,
): string | undefined {
    if (!value) {
        return value;
    }

    let s: string | undefined = value;
    if (localeId) {
        switch (valueType) {
            case 'xs:float':
            case 'xs:double':
            case 'xs:decimal':
            case 'xs:integer':
            case 'xs:int':
            case 'xs:unsignedInt':
            case 'xs:unsignedShort': {
                const d = parseNumber(value);
                if (isNaN(d)) {
                    return undefined;
                }

                s = d.toLocaleString(localeId);
                break;
            }
            case 'xs:date':
                s = parseDate(value)?.toLocaleDateString(localeId);
                break;
            case 'xs:dateTime':
                s = parseDate(value)?.toLocaleString(localeId, dateTimeFormat);
                break;
            case 'xs:time':
                s = parseDate(value)?.toLocaleTimeString(localeId);
                break;
            case 'xs:long':
            case 'xs:unsignedLong':
                s = BigInt(value).toLocaleString(localeId);
                break;
        }
    } else {
        s = value;
    }

    if (s && unit) {
        s += ' ' + unit;
    }

    return s;
}

/**
 * Converts a localized value into its invariant equivalent.
 * @param value The localized value.
 * @param valueType The value type.
 * @param localeId The source language.
 */
export function toInvariant(
    value: string | undefined,
    valueType: DataTypeDefXsd,
    localeId: string,
): string | undefined {
    if (!value) {
        return value;
    }

    switch (valueType) {
        case 'xs:float':
        case 'xs:double':
        case 'xs:decimal': {
            const d = parseNumber(value, localeId);
            return Number.isNaN(d) ? undefined : d.toString();
        }
        case 'xs:integer':
        case 'xs:int':
        case 'xs:short':
        case 'xs:unsignedInt':
        case 'xs:unsignedShort': {
            const i = parseNumber(value, localeId);
            return Number.isNaN(i) ? undefined : i.toString();
        }
        case 'xs:date':
        case 'xs:dateTime':
        case 'xs:time':
            return parseDate(value, localeId)!.toUTCString();
        default:
            return value;
    }
}

/**
 * Indicates wether the specified value type represents a number.
 * @param valueType The current value type.
 * @returns `true` if the specified value type represents a number; otherwise, `false`.
 */
export function isNumberType(valueType: DataTypeDefXsd): boolean {
    switch (valueType) {
        case 'xs:double':
        case 'xs:float':
        case 'xs:int':
        case 'xs:integer':
        case 'xs:short':
        case 'xs:unsignedInt':
        case 'xs:unsignedShort':
            return true;
        default:
            return false;
    }
}

/**
 * Converts the specified value to an equivalent boolean.
 * @param value The current value.
 * @returns A boolean value.
 */
export function toBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') {
        return value;
    }

    if (!value) {
        return false;
    }

    if (typeof value === 'string') {
        value = value.toLocaleLowerCase();
        if (value === 'false') {
            return false;
        }

        if (value === 'true') {
            return true;
        }

        return Number(value) !== 0 ? true : false;
    }

    if (typeof value === 'number') {
        return value !== 0.0;
    }

    return false;
}

/** Returns the file extension that corresponds to the specified MIME type. */
export function mimeTypeToExtension(mimeType: string): string | undefined {
    const value = mimeTypes.get(mimeType);
    if (!value) {
        return undefined;
    }

    return Array.isArray(value) ? value[0] : value;
}

/** Returns the MIME type that corresponds ti the specified file extension */
export function extensionToMimeType(filename: string): string | undefined {
    const index = filename.lastIndexOf('.');
    if (index < 0) {
        return undefined;
    }

    const extension = filename.substring(index).toLowerCase();
    for (const [mimeType, ext] of mimeTypes) {
        if (Array.isArray(ext)) {
            if (ext.some(item => item === extension)) {
                return mimeType;
            }
        } else if (ext === extension) {
            return mimeType;
        }
    }

    return undefined;
}

/** Converts the specified value. */
export function toJsonValue(value: unknown): jsonization.JsonValue {
    return value as jsonization.JsonValue;
}
export function toEnvironment(value: types.Environment): Environment {
    return jsonization.toJsonable(value) as Environment;
}

export function toAssetAdministrationShell(value: types.AssetAdministrationShell): AssetAdministrationShell {
    return jsonization.toJsonable(value) as unknown as AssetAdministrationShell;
}

export function toSubmodel(value: types.Submodel): Submodel {
    return jsonization.toJsonable(value) as unknown as Submodel;
}

export function toConceptDescription(value: types.ConceptDescription): ConceptDescription {
    return jsonization.toJsonable(value) as unknown as ConceptDescription;
}

export function toSubmodelElement(value: types.ISubmodelElement): SubmodelElement {
    return jsonization.toJsonable(value) as unknown as SubmodelElement;
}

/**
 * Checks wether the Submodel with the specified identifier is referenced by the current Asset Administration Shell.
 * @param aas The current Asset Administration Shell.
 * @param smId The identifier of the Submodel.
 */
export function isSubmodelReferenced(aas: AssetAdministrationShell, smId: string): boolean {
    if (!aas.submodels) {
        return false;
    }

    return aas.submodels
        .flatMap(reference => reference.keys)
        .some(key => key.type === 'Submodel' && key.value === smId);
}

/**
 * Normalizes a file path by replacing backslashes with forward slashes.
 * It removes any leading directory indicators (like '/') and './' at the start of the path.
 * This ensures that the returned path is consistent and suitable for further processing.
 *
 * @param path The input file path to normalize.
 * @returns The normalized file path as a string.
 */
export function normalize(path: string): string {
    path = path.replace(/\\/g, '/');
    if (path.charAt(0) === '/') {
        path = path.slice(1);
    } else if (path.startsWith('./')) {
        path = path.slice(2);
    }

    return path;
}

/**
 * Converts a string representation of a boolean value into a boolean.
 * This function checks if the input string, when converted to lower case,
 * is equal to 'true'. If it is, the function returns `true`; otherwise, it returns `false`.
 * @param value The string representation of a boolean.
 * @returns The boolean value corresponding to the string.
 */
function stringToBoolean(value: string): boolean {
    return value?.toLocaleLowerCase() === 'true';
}

function stringToSByte(value: string): number | undefined {
    const b = Number(value);
    if (Number.isNaN(b) || b < -256) {
        return undefined;
    }

    return b < 128 ? b : b - 256;
}

function stringToByte(value: string): number | undefined {
    const b = Number(value);
    if (Number.isNaN(b) || b < 0) {
        return undefined;
    }

    return b;
}

function toDouble(value: unknown, localeId?: string): number | undefined {
    if (typeof value === 'number') {
        return value;
    }

    if (typeof value === 'string') {
        if (localeId) {
            const decimalPart = Intl.NumberFormat(localeId)
                .formatToParts(1.23)
                .find(part => part.type === 'decimal');
            if (decimalPart) {
                value = value.replace(decimalPart.value, '.');
            }
        }

        const d = Number(value);
        if (!Number.isNaN(d)) {
            return d;
        }
    }

    if (typeof value === 'boolean') {
        return value ? 1 : 0;
    }

    if (value instanceof Date) {
        return value.getTime();
    }

    return undefined;
}

function toInteger(value: unknown): number | undefined {
    if (typeof value === 'number') {
        return value;
    }

    if (typeof value === 'string') {
        const d = Number.parseInt(value);
        if (!Number.isNaN(d)) {
            return d;
        }
    }

    if (typeof value === 'boolean') {
        return value ? 0 : 1;
    }

    if (value instanceof Date) {
        return value.getTime();
    }

    return undefined;
}

function toDate(value: unknown, localeId?: string): number | undefined {
    if (value instanceof Date) {
        return value.getTime();
    }

    if (typeof value === 'number') {
        return value;
    }

    if (typeof value === 'string') {
        parseDate(value, localeId)?.getTime();
    }

    return undefined;
}

function toBigInt(value: unknown): bigint | undefined {
    if (typeof value === 'bigint') {
        return value;
    }

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        try {
            return BigInt(value);
        } catch {
            return undefined;
        }
    }

    return undefined;
}
