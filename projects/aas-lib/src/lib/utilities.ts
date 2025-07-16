/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { HttpErrorResponse } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import {
    aas,
    ApplicationError,
    ErrorData,
    convertToString,
    stringFormat,
    noop,
    getLocaleValue,
    getPreferredName,
    AASDocument,
    getIdShortPath,
    isSubmodelElementCollection,
    getReferable,
    isProperty,
    isSubmodel,
    isMultiLanguageProperty,
    getIEC61360Content,
    toLocale,
    isFile,
    isSubmodelElementList,
} from 'aas-core';

import { DataSheetItem } from './types';

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
 * Determines the display name for the specified Referable.
 * @param referable The current Referable.
 * @param env The Environment of the Referable.
 * @param currentLang The current language to get the display name for.
 * @returns The display name.
 */
export function getDisplayName(referable: aas.Referable, env?: aas.Environment | null, currentLang?: string): string {
    if (referable.displayName) {
        const value = getLocaleValue(referable.displayName, currentLang);
        if (value) {
            return value;
        }
    }

    if (env) {
        const values = getPreferredName(env, referable);
        if (values) {
            const value = getLocaleValue(values, currentLang);
            if (value) {
                return value;
            }
        }
    }

    return toDisplayName(referable.idShort);
}

/**
 * Computes a has code of the specified string value.
 * @param value The current value.
 * @returns The has code of the specified value.
 */
export function hashCode(value: string): number {
    let hash = 0;
    if (value.length === 0) {
        return hash;
    }

    for (let i = 0; i < value.length; i++) {
        const char = value.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0;
    }

    return hash >= 0 ? hash : 4294967296 + hash;
}

export function referenceToString(value: aas.Reference): string {
    return value.keys.map(key => key.value).join('.');
}

export function isLangString(value: unknown): value is aas.LangString[] {
    if (!Array.isArray(value) || value.length === 0) {
        return false;
    }

    const langString = value[0] as aas.LangString;

    return typeof langString.language === 'string' && typeof langString.text === 'string';
}

export function getUrl(document: AASDocument, submodel: aas.Submodel, file: aas.File | undefined): string {
    if (file === undefined || file.value === undefined) {
        return '';
    }

    const smId = encodeBase64Url(submodel.id);
    const path = getIdShortPath(file);
    const name = encodeBase64Url(document.endpoint);
    const id = encodeBase64Url(document.id);
    return `/api/v1/endpoints/${name}/documents/${id}/submodels/${smId}/submodel-elements/${path}/value`;
}

/**
 *
 * @param element
 * @param env
 * @param lang
 * @returns
 */
export function createDataSheetItem(
    element: aas.SubmodelElement,
    env: aas.Environment | undefined,
    lang: string | undefined,
    url?: string,
): DataSheetItem | undefined {
    let value = getValue(element);
    if (!value) {
        return undefined;
    }

    let dataSpecification: aas.DataSpecificationIec61360 | undefined;
    if (env) {
        dataSpecification = getIEC61360Content(env, element);
    }

    let displayName: string | undefined;
    if (element.displayName) {
        displayName = getLocaleValue(element.displayName, lang);
    }

    if (!displayName && dataSpecification?.preferredName) {
        displayName = getLocaleValue(dataSpecification.preferredName);
    }

    if (!displayName) {
        displayName = toDisplayName(element.idShort);
    }

    let description: string | undefined;
    if (element.description) {
        description = getLocaleValue(element.description, lang);
    }

    if (!description && dataSpecification?.definition) {
        description = getLocaleValue(dataSpecification.definition);
    }

    const unit = dataSpecification?.unit;
    if (unit) {
        value = value + ' ' + unit;
    }

    const item: DataSheetItem = {
        idShort: element.idShort,
        displayName,
        value,
    };

    if (description) {
        item.description = description;
    }

    if (url) {
        item.url = url;
    }

    return item;

    function getValue(element: aas.SubmodelElement): string | string[] | undefined {
        if (isProperty(element)) {
            return lang ? toLocale(element.value, element.valueType, lang) : element.value;
        }

        if (isMultiLanguageProperty(element)) {
            return getLocaleValue(element.value, lang);
        }

        if (isFile(element)) {
            return element.value;
        }

        if (isSubmodelElementList(element)) {
            if (!element.value) {
                return undefined;
            }

            const values: string[] = [];
            for (const item of element.value) {
                const v = getValue(item);
                if (!v) {
                    continue;
                }

                if (typeof v === 'string') {
                    values.push(v);
                } else {
                    values.push(v.join('; '));
                }
            }
            return values
        }

        return undefined;
    }
}

/**
 * Converts a name to a more readable display name.
 * @param name The current name.
 * @returns A display name.
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
