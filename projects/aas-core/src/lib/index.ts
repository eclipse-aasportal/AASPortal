/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { AASEndpointType, ErrorData } from './types.js';
import {
    common,
    constants,
    jsonization,
    stringification,
    types,
    verification,
} from '@aas-core-works/aas-core3.0-typescript';

export * from './document.js';
export * from './types.js';
export * from './authentication.js';
export * from './convert.js';
export * as aas from './aas.js';
export * from './multi-key-map.js';
export * from './keyed-list.js';
export * from './crc32.js';
export * from './query-parser.js';
export * from './cache.js';

export { common, constants, jsonization, stringification, types, verification };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function noop(...args: unknown[]): void {}

/**
 * Determines whether the specified value represents a valid e-mail.
 * @param value The value
 * @returns `true` if the specified value represents a valid e-mail; otherwise, `false`.
 */
export function isValidEMail(value: string | undefined): boolean {
    return typeof value === 'string' && value.length >= 5 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);
}

/**
 * Determines whether the specified value represents a valid password.
 * @param value A text expression.
 * @returns `true` if the specified value represents a valid password; otherwise, `false`.
 */
export function isValidPassword(value: string | undefined): boolean {
    return (
        typeof value === 'string' &&
        /^[\S]+$/.test(value) &&
        value.length >= 8 &&
        value.length <= 20 &&
        /^[a-zA-Z0-9-+_$%!§?#*~.,;:/]+$/.test(value)
    );
}

/**
 * Converts the value of objects to strings based on the formats specified and inserts them into another string.
 * @param format A composite format string.
 * @param args An object array that contains zero or more objects to format.
 * @returns A copy of format in which the format items have been replaced by the string representation of the corresponding objects in args.
 */
export function stringFormat(format: string, ...args: unknown[]): string {
    try {
        return format.replace(/{(\d+)}/g, (match, index) => {
            index = Number(index);
            const arg: unknown = index >= 0 && index < args.length ? args[index] : undefined;
            if (typeof arg === 'undefined') {
                return '<undefined>';
            } else if (arg === null) {
                return '<null>';
            } else if (typeof arg === 'string') {
                return arg;
            } else if (typeof arg === 'number') {
                return arg.toString();
            } else if (typeof arg === 'boolean') {
                return arg ? 'true' : 'false';
            } else if ((arg as { toString: () => string }).toString) {
                return arg.toString();
            } else {
                return match;
            }
        });
    } catch {
        return format;
    }
}

/**
 * Compares two URls for equality.
 * @param url1 The first URL.
 * @param url2 The seconde URL.
 * @returns `true` if both URLs are equal; otherwise, `false`.
 */
export function equalUrls(url1: string, url2: string): boolean {
    try {
        return url1 === url2 || equals(new URL(url1), new URL(url2));
    } catch {
        return false;
    }

    function equals(a: URL, b: URL): boolean {
        return a.protocol === b.protocol && a.host === b.host && a.pathname === b.pathname;
    }
}

/** Compares two arrays for equality. */
export function equalArray<T>(a: T[], b: T[]): boolean {
    if (a === b) return true;
    if (a.length !== b.length) return false;
    return a.every((_, i) => a[i] === b[i]);
}

/**
 * Checks if the specified string is url-safe-base64 encoded
 * @param s The string to test.
 * @return true if url-safe-base64 encoded
 */
export function isUrlSafeBase64(s: string): boolean {
    return /^[A-Za-z0-9_-]*[.=]{0,2}$/.test(s);
}

/**
 * Gets the endpoint name from the specified URL.
 * @param url The endpoint URL.
 * @returns The name.
 */
export function getEndpointName(url: string | URL): string {
    if (typeof url === 'string') {
        url = new URL(url);
    }

    const name = url.searchParams.get('name');
    if (name) {
        return name;
    }

    const pathname = url.pathname;
    if (pathname) {
        const names = pathname.split('/').filter(item => !!item);
        if (names.length > 0) {
            return names[names.length - 1];
        }
    }

    return url.href.split('?')[0];
}

/**
 * Gets the endpoint type from the specified URL.
 * @param url The URL.
 * @returns The endpoint type.
 */
export function getEndpointType(url: string | URL): AASEndpointType {
    if (typeof url === 'string') {
        url = new URL(url);
    }

    switch (url.protocol) {
        case 'file:':
            return 'FileSystem';
        case 'http:':
        case 'https:': {
            const param = url.searchParams.get('type');
            if (!param) {
                return 'AAS_API';
            }

            switch (param.toLowerCase()) {
                case 'aas_api':
                case 'aas-api':
                    return 'AAS_API';
                case 'webdav':
                    return 'WebDAV';
                case 'opc-ua':
                case 'opcua':
                case 'opc_ua':
                    return 'OPC_UA';
            }

            throw new Error(`Endpoint type "${param}" is not supported.`);
        }
        case 'opc.tcp:':
            return 'OPC_UA';
        default:
            throw new Error(`Protocol "${url.protocol}" is not supported.`);
    }
}

/**
 * Type guard that determines whether a given value conforms to the ErrorData shape.
 *
 * Checks for the presence of the required properties used to identify an ErrorData:
 * - message
 * - name
 * - type
 *
 * @param value - The value to inspect.
 * @returns `true` if the value appears to be an ErrorData; otherwise `false`.
 */
export function isErrorData(value: unknown): value is ErrorData {
    if (!value) {
        return false;
    }

    const errorData = value as ErrorData;
    return errorData.message !== undefined && errorData.name !== undefined && errorData.type !== undefined;
}
