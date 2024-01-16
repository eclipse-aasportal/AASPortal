/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ApplicationError } from 'common';
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

export function toUint8Array<T extends object>(data: T): Uint8Array {
    return Uint8Array.from(Buffer.from(JSON.stringify(data)));
}
