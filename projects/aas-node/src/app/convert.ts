/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ApplicationError } from 'aas-core';
import { ERRORS } from './errors.js';

export function decodeBase64Url(data: string): string {
    return Buffer.from(data, 'base64url').toString('ascii');
}

export function encodeBase64Url(data: string): string {
    return Buffer.from(data).toString('base64url');
}

export function parseUrl(url: string): URL {
    try {
        return new URL(url);
    } catch (error) {
        throw new ApplicationError(
            `"${url}" is an invalid URL: ${error?.message}`,
            ERRORS.InvalidURL,
            url,
            error?.message,
        );
    }
}

export function urlToString(url: URL | string | undefined): string {
    if (url === undefined) {
        return '';
    }

    const temp = new URL(url);
    temp.password = '';
    temp.username = '';
    return temp.toString();
}

export function toUint8Array<T extends object>(data: T): Uint8Array {
    return Uint8Array.from(Buffer.from(JSON.stringify(data)));
}

export function join(...args: string[]): string {
    let path = '';
    for (const arg of args.map(item => item.trim()).filter(item => item)) {
        if (arg === '/') {
            path += arg;
        } else if (arg.endsWith('/')) {
            path += arg.startsWith('/') ? arg.substring(1) : arg;
        } else if (path) {
            path += arg.startsWith('/') ? arg : '/' + arg;
        } else {
            path = arg;
        }
    }

    return path;
}

export function slash(path: string): string {
    const isExtendedLengthPath = path.startsWith('\\\\?\\');
    if (isExtendedLengthPath) {
        return path;
    }

    return path.replace(/\\/g, '/');
}
