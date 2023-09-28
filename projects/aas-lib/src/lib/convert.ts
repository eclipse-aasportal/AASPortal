/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { HttpErrorResponse } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { ApplicationError, ErrorData, convertToString, stringFormat } from 'common';
import { noop, toString } from 'lodash-es';

/**
 * Converts a message to a localized text.
 * @param message The current message.
 * @param translate The translate service.
 * @returns The message as localized text.
 */
export function messageToString(message: any, translate: TranslateService): string {
    let text: string;
    if (message instanceof ApplicationError) {
        text = format(message.message, message.name, message.args);
    } else if (message instanceof Error) {
        text = message.message;
    } else if (typeof message === 'string') {
        text = message;
    } else if (message instanceof HttpErrorResponse) {
        if (isErrorData(message.error)) {
            text = format(message.error.message, message.error.name, message.error.args);
        } else {
            text = message.message ?? `${message.status} ${message.statusText}`;
        }
    } else if (isErrorData(message)) {
        text = format(message.message, message.name, message.args);
    } else {
        text = toString(message);
    }

    return text;

    function isErrorData(value: object): value is ErrorData {
        return typeof value === 'object' && 'message' in value && 'name' in value && 'type' in value;
    }

    function format(message: string, name: string, args: any[]): string {
        if (name) {
            return stringFormat(translate.instant(name), args);
        }

        return message;
    }
}

/**
 * Resolves the specified error to an displayable object.
 * @param error The error.
 * @param translate The translation service.
 * @returns 
 */
export async function resolveError(error: unknown, translate: TranslateService): Promise<string> {
    let message = error;
    if (error instanceof HttpErrorResponse) {
        if (error.error instanceof Blob) {
            if (error.error.type === 'application/json') {
                try {
                    const buffer = await error.error.arrayBuffer();
                    message = JSON.parse(new TextDecoder().decode(buffer));
                } catch (_) {
                    noop();
                }
            }
        } else {
            message = convertToString(error.error);
        }
    }

    return messageToString(message, translate);
}

/**
 * Replaces all `\` in the specified path with `/`.
 * @param path The path.
 * @returns The normalized file path.
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
 * Gets the file name of the specified file path.
 * @param path The file path.
 * @returns The file name.
 */
export function basename(path: string): string {
    let index = path.lastIndexOf('/');
    if (index < 0) {
        index = path.lastIndexOf('\\');
    }

    return index < 0 ? path : path.substring(index + 1);
}

/**
 * Gets the extension of the specified file path.
 * @param path The file path.
 * @returns The extension.
 */
export function extension(path: string): string | undefined {
    const name = basename(path);
    const index = name.lastIndexOf('.');
    return index < 0 ? undefined : name.substring(index);
}

/**
 * Encodes a string to Base64Url.
 * @param s The string to encode.
 * @returns The encoded string.
 */
export function encodeBase64Url(s: string): string {
    return window.btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Decodes a Base64Url string.
 * @param s The encoded string.
 * @returns The decoded string.
 */
export function decodeBase64Url(s: string): string {
    let data = s.replace(/-/g, '+').replace(/_/g, '/');
    const padding = s.length % 4;
    if (padding > 0) {
        data = (data + '===').slice(0, s.length + 4 - padding);
    }

    return window.atob(data);
}

/**
 * Checks if the specified string is base64 encoded
 * @param s The string to test.
 * @return true if base64 encoded
 */
export function isBase64(s: string): boolean {
    return /^[A-Za-z0-9+/]*[=]{0,2}$/.test(s);
}

/**
 * Converts a Blob to a base64 encoded string.
 * @param blob The current Blob.
 * @returns The base64 encoded string.
 */
export function convertBlobToBase64Async(blob: Blob): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64WithDataUrlPrefix = reader.result as string;
            const index = base64WithDataUrlPrefix.indexOf(';base64,');
            const base64 = base64WithDataUrlPrefix.substring(index + 8);
            resolve(base64);
        };

        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}
