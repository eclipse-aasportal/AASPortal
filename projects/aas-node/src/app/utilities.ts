/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { streamToObjectUrl } from 'aas-package';
import { ImageProcessing } from './image-processing.js';
import { ApplicationError } from 'aas-core';

/**
 * Converts a URL object or string to a sanitized string representation.
 * @param url The URL
 * @returns A sanitized URL string
 */
export function urlToString(url: URL | string | undefined): string {
    if (url === undefined) {
        return '';
    }

    const temp = new URL(url);
    temp.password = '';
    temp.username = '';
    return temp.href;
}

/**
 * Converts an object to a Uint8Array.
 * Serializes the object to JSON and encodes it as a Uint8Array.
 * @param data The data to convert.
 * @returns A Uint8Array.
 */
export function toUint8Array<T extends object>(data: T): Uint8Array<ArrayBuffer> {
    return Uint8Array.from(Buffer.from(JSON.stringify(data)));
}

/**
 * Convert a readable stream containing image data to an object URL.
 * The image data is resized to 40x40 pixels before conversion.
 * @param readable The readable stream containing the image data
 * @returns A string representing the object URL of the resized image, or undefined if conversion fails
 */
export async function thumbnailToObjectUrl(readable: NodeJS.ReadableStream | undefined): Promise<string | undefined> {
    try {
        if (!readable) {
            return undefined;
        }

        const output = await ImageProcessing.resize(readable, { h: 40 });
        return await streamToObjectUrl(output);
    } catch {
        return undefined;
    }
}

/**
 * Checks if a value is defined (not undefined or null).
 * Throws an ApplicationError if the value is not defined.
 * @param value The value to check.
 * @returns The value if it is defined.
 */
export function checkIsDefined<T>(value: T | undefined | null, name: string): T {
    if (value === undefined || value === null) {
        throw new ApplicationError(`Value for "${name}" is not defined.`);
    }

    return value;
}
