/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { HttpErrorResponse } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { ApplicationError, ErrorData, convertToString, stringFormat, noop } from 'aas-core';

/**
 * Converts a message to a localized text.
 * @param message The current message.
 * @param translate The translate service.
 * @returns The message as localized text.
 */
export function messageToString(message: unknown, translate: TranslateService): string {
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
        text = convertToString(message);
    }

    return text;

    function isErrorData(value: unknown): value is ErrorData {
        const errorData = value as ErrorData;
        return errorData.message !== undefined && errorData.name !== undefined && errorData.type !== undefined;
    }

    function format(message: string, name: string, args: unknown[]): string {
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
                } catch {
                    noop();
                }
            }
        } else {
            message = `${error.message}: ${convertToString(error.error)}`;
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

/**
 * Converts a camel case name to a display name.
 * @param name The current name.
 * @returns The display name.
 */
export function toDisplayName(name: string): string {
    const LOWER = 0;
    const UPPER = 1;
    const words: string[] = [];
    let currentCase = LOWER;
    let word = '';
    for (let i = 0, n = name.length; i < n; i++) {
        const c = name.charAt(i);
        const charCase = getCharCase(c);
        if (c === '_') {
            if (word.length > 0) {
                words.push(word);
                word = '';
            }

            continue;
        }

        if (i === 0) {
            currentCase = charCase;
            word += c;
        } else {
            if (currentCase === charCase) {
                if (currentCase === UPPER && i < n - 1) {
                    const next = name.charAt(i + 1);
                    if (getCharCase(next) === LOWER) {
                        words.push(word);
                        word = c;
                    } else {
                        word += c;
                    }
                } else {
                    word += c;
                }
            } else {
                if (charCase === UPPER) {
                    words.push(word);
                    word = c;
                } else {
                    word += c;
                }

                currentCase = charCase;
            }
        }
    }

    if (word.length > 0) {
        words.push(word);
    }

    return words.map((word, i) => (i > 0 && hasAnyLowerCase(word) ? word.toLowerCase() : word)).join(' ');

    function getCharCase(c: string): number {
        return c === c.toUpperCase() ? UPPER : LOWER;
    }

    function hasAnyLowerCase(s: string): boolean {
        for (let i = 0, n = s.length; i < n; i++) {
            if (s.charAt(i) === s.charAt(i).toLowerCase()) {
                return true;
            }
        }

        return false;
    }
}
