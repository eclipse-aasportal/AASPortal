/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ApplicationError } from 'aas-core';
import { streamToObjectUrl } from 'aas-package';
import { ERRORS } from './errors.js';
import { ImageProcessing } from './image-processing.js';
import { ScanEndpointData, WorkerData } from './types.js';

export function parseUrl(url: string): URL {
    try {
        return new URL(url);
    } catch (error) {
        throw new ApplicationError(ERRORS.InvalidURL, {
            url,
            message: error?.message,
        });
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

export function toUint8Array<T extends object>(data: T): Uint8Array<ArrayBuffer> {
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

export async function createThumbnail(readable: NodeJS.ReadableStream | undefined): Promise<string | undefined> {
    try {
        if (!readable) {
            return undefined;
        }

        const output = await ImageProcessing.resizeAsync(readable, 40, 40);
        return await streamToObjectUrl(output);
    } catch {
        return undefined;
    }
}

export function isScanEndpointData(data: WorkerData): data is ScanEndpointData {
    return data.type === 'ScanEndpointData';
}
