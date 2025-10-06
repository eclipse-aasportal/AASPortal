/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Readable } from 'stream';
import path from 'path';
import { aas, jsonization, types } from 'aas-core';
import { Cursor, ExtentModifier, LevelModifier } from './types.js';
import { ApplicationError } from './application-error.js';
import { ERROR } from './error.js';

const dateTimeFormat: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
};

const mimeTypes = [
    ['audio/aac', '.aac'],
    ['application/x-abiword', '.abw'],
    ['application/x-freearc', '.arc'],
    ['image/avif', '.avif'],
    ['video/x-msvideo', '.avi'],
    ['application/vnd.amazon.ebook', '.azw'],
    ['application/octet-stream', '.bin'],
    ['.bmp', 'image/bmp'],
    ['application/x-bzip', '.bz'],
    ['application/x-bzip2', '.bz2'],
    ['application/x-cdf', '.cda'],
    ['application/x-csh', '.csh'],
    ['text/css', '.css'],
    ['text/csv', '.csv'],
    ['application/msword', '.doc'],
    ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.docx'],
    ['application/vnd.ms-fontobject', '.eot'],
    ['application/epub+zip', '.epub'],
    ['application/gzip', '.gz'],
    ['image/gif', '.gif'],
    ['text/html', '.html'],
    ['image/vnd.microsoft.icon', '.ico'],
    ['text/calendar', '.ics'],
    ['application/java-archive', '.jar'],
    ['image/jpeg', '.jpeg'],
    ['image/jpeg', '.jpg'],
    ['text/javascript', '.js'],
    ['application/json', '.json'],
    ['application/ld+json', '.jsonld'],
    ['audio/midi', '.midi'],
    ['audio/x-midi', '.midi'],
    ['audio/mpeg', '.mp3'],
    ['video/mp4', '.mp4'],
    ['video/mpeg', '.mpeg'],
    ['application/vnd.apple.installer+xml', '.mpkg'],
    ['application/vnd.oasis.opendocument.presentation', '.odp'],
    ['application/vnd.oasis.opendocument.spreadsheet', '.ods'],
    ['application/vnd.oasis.opendocument.text', '.odt'],
    ['audio/ogg', '.oga'],
    ['video/ogg', '.ogv'],
    ['application/ogg', '.ogx'],
    ['audio/opus', '.opus'],
    ['font/otf', '.otf'],
    ['image/png', '.png'],
    ['application/pdf', '.pdf'],
    ['application/x-httpd-php', '.php'],
    ['application/vnd.ms-powerpoint', '.ppt'],
    ['application/vnd.openxmlformats-officedocument.presentationml.presentation', '.pptx'],
    ['application/vnd.rar', '.rar'],
    ['application/rtf', '.rtf'],
    ['application/x-sh', '.sh'],
    ['image/svg+xml', '.svg'],
    ['application/x-tar', '.tar'],
    ['image/tiff', '.tiff'],
    ['video/mp2t', '.ts'],
    ['font/ttf', '.ttf'],
    ['text/plain', '.txt'],
    ['application/vnd.visio', '.vsd'],
    ['audio/wav', '.wav'],
    ['audio/webm', '.weba'],
    ['video/webm', '.webp'],
    ['font/woff', '.woff'],
    ['font/woff2', '.woff2'],
    ['application/xhtml+xml', '.xhtml'],
    ['application/vnd.ms-excel', '.xls'],
    ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '.xlsx'],
    ['application/xml', '.xml'],
    ['text/xml', '.xml'],
    ['application/vnd.mozilla.xul+xml', '.xul'],
    ['application/x-pem-file', '.pem'],
    ['application/zip', '.zip'],
    ['video/3gpp', '.3gp'],
    ['audio/3gpp', '.3gp'],
    ['video/3gpp2', '.3g2'],
    ['audio/3gpp2', '.3g2'],
    ['application/x-7z-compressed', '.7z'],
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function noop(...args: unknown[]) {}

export function decodeBase64Url(data: string): string {
    return Buffer.from(data, 'base64url').toString('ascii');
}

export function encodeBase64Url(data: string): string {
    return Buffer.from(data).toString('base64url');
}

export function generateRandomString(length: number): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
}

export async function generateCodeChallenge(codeVerifier: string): Promise<string> {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(codeVerifier));
    return encodeBase64Url(String.fromCharCode(...new Uint8Array(digest)));
}

/**
 * Converts a readable stream to a buffer.
 * @param stream The readable stream.
 * @returns The buffer.
 */
export async function streamToBuffer(readableStream: Readable): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
        const chunks: Uint8Array[] = [];
        readableStream.on('data', data => {
            if (typeof data === 'string') {
                chunks.push(Buffer.from(data, 'utf-8'));
            } else if (data instanceof Buffer) {
                chunks.push(data);
            } else {
                const jsonData = JSON.stringify(data);
                chunks.push(Buffer.from(jsonData, 'utf-8'));
            }
        });

        readableStream.on('end', () => {
            resolve(Buffer.concat(chunks));
        });

        readableStream.on('error', reject);
    });
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

/** Returns the MIME type that corresponds to the specified file extension. */
export function extensionToMimeType(extension: string): string | undefined {
    extension = extension?.toLowerCase();
    for (const tuple of mimeTypes) {
        if (tuple[1] === extension) {
            return tuple[0];
        }
    }

    return undefined;
}

/** Returns the MIME type that corresponds to the specified file. */
export function mimeType(file: string): string {
    const extension = path.extname(file).toLowerCase();
    for (const [mimeType, ext] of mimeTypes) {
        if (ext === extension) {
            return mimeType;
        }
    }

    return '';
}

/**
 * Determines the data type from the specified string expression.
 * @param value The value or a string expression.
 * @returns The data type.
 */
export function determineType(value: unknown): aas.DataTypeDefXsd | undefined {
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
 * Converts a value to an equivalent string expression.
 * @param value The current value.
 * @param localeId The locale identifier.
 * @returns A string expression that represents the specified value.
 */
export function convertToString(value: unknown, localeId?: string): string {
    let s = '';
    if (value != null) {
        if (typeof value === 'string') {
            s = value;
        } else if (typeof value === 'boolean') {
            s = value ? 'true' : 'false';
        } else if (typeof value === 'number') {
            s = localeId ? value.toLocaleString(localeId) : value.toString();
        } else if (value instanceof Date) {
            s = localeId ? value.toLocaleString(localeId, dateTimeFormat) : value.toString();
        } else if (typeof value === 'bigint') {
            s = localeId ? value.toLocaleString(localeId) : value.toString();
        } else if (Array.isArray(value)) {
            s = `[${getItems(value).join(', ')}]`;
        } else if (typeof value === 'object') {
            s = JSON.stringify(value, undefined, 2);
        }
    }

    return s;

    function getItems(array: unknown[]): string[] {
        return array.map(item => convertToString(item, localeId));
    }
}

/** Converts the specified value. */
export function toJsonValue(value: unknown): jsonization.JsonValue {
    return value as jsonization.JsonValue;
}

export function toEnvironment(value: types.Environment): aas.Environment {
    return jsonization.toJsonable(value) as aas.Environment;
}

export function toAssetAdministrationShell(value: types.AssetAdministrationShell): aas.AssetAdministrationShell {
    return jsonization.toJsonable(value) as unknown as aas.AssetAdministrationShell;
}

export function toSubmodel(value: types.Submodel): aas.Submodel {
    return jsonization.toJsonable(value) as unknown as aas.Submodel;
}

export function toConceptDescription(value: types.ConceptDescription): aas.ConceptDescription {
    return jsonization.toJsonable(value) as unknown as aas.ConceptDescription;
}

export function toSubmodelElement(value: types.ISubmodelElement): aas.SubmodelElement {
    return jsonization.toJsonable(value) as unknown as aas.SubmodelElement;
}

export function toCursor(value: string | undefined): Cursor {
    if (value === undefined) {
        return {};
    }

    return JSON.parse(decodeBase64Url(value));
}

export function referenceToString(value: types.Reference): string {
    return value.keys.map(key => key.value).join('.');
}

/**
 * Selects the Submodel Element at the specified path within the specified Submodel.
 * @param submodel The current Submodel.
 * @param idShortPath The path to the Submodel Element.
 * @returns The Submodel Element or `undefined`.
 */
export function selectSubmodelElement(submodel: aas.Submodel, idShortPath: string): aas.SubmodelElement | undefined {
    let current: aas.SubmodelElement | undefined = submodel;
    const items = idShortPath.split('.').reverse();
    while (items.length > 0) {
        const idShort = items.pop()!;
        switch (current.modelType) {
            case 'Submodel':
                current = (current as aas.Submodel).submodelElements?.find(element => element.idShort === idShort);
                break;
            case 'SubmodelElementCollection':
                current = (current as aas.SubmodelElementCollection).value?.find(
                    element => element.idShort === idShort,
                );
                break;
            case 'SubmodelElementList':
                current = (current as aas.SubmodelElementList).value?.find(element => element.idShort === idShort);
                break;
            case 'AnnotatedRelationshipElement':
                current = (current as aas.AnnotatedRelationshipElement).annotations?.find(
                    element => element.idShort === idShort,
                );
                break;
        }

        if (current === undefined) {
            return undefined;
        }
    }

    return current;
}

/**
 * Selects the Submodel Element at the specified path within the specified Submodel.
 * @param submodel The current Submodel.
 * @param idShortPath The path to the Submodel Element.
 * @returns The Submodel Element or `undefined`.
 */
export function selectISubmodelElement(
    submodel: types.Submodel,
    idShortPath: string,
): types.ISubmodelElement | undefined {
    let current: types.ISubmodelElement | undefined = submodel;
    const items = idShortPath.split('.').reverse();
    while (items.length > 0) {
        const idShort = items.pop()!;
        switch (current.modelType()) {
            case types.ModelType.Submodel:
                current = (current as types.Submodel).submodelElements?.find(element => element.idShort === idShort);
                break;
            case types.ModelType.SubmodelElementCollection:
                current = (current as types.SubmodelElementCollection).value?.find(
                    element => element.idShort === idShort,
                );
                break;
            case types.ModelType.SubmodelElementList:
                current = (current as types.SubmodelElementList).value?.find(element => element.idShort === idShort);
                break;
            case types.ModelType.AnnotatedRelationshipElement:
                current = (current as types.AnnotatedRelationshipElement).annotations?.find(
                    element => element.idShort === idShort,
                );
                break;
        }

        if (current === undefined) {
            return undefined;
        }
    }

    return current;
}

/**
 * Determines whether the specified value if of type `File`;
 * @param value The current value.
 * @returns `true` if the specified value is of type `File`; otherwise, `false`.
 */
export function isFile(value: unknown): value is aas.File {
    return (value as aas.Referable)?.modelType === 'File';
}

export function isSubmodel(value: unknown): value is aas.Submodel {
    return (value as aas.Referable)?.modelType === 'Submodel';
}

export function isSubmodelElementCollection(value: unknown): value is aas.SubmodelElementCollection {
    return (value as aas.Referable)?.modelType === 'SubmodelElementCollection';
}

export function isSubmodelElementList(value: unknown): value is aas.SubmodelElementList {
    return (value as aas.Referable)?.modelType === 'SubmodelElementList';
}

export function isAnnotatedRelationshipElement(value: unknown): value is aas.AnnotatedRelationshipElement {
    return (value as aas.Referable)?.modelType === 'AnnotatedRelationshipElement';
}

export function isEntity(value: unknown): value is aas.Entity {
    return (value as aas.Referable)?.modelType === 'Entity';
}

/**
 * Checks wether the Submodel with the specified identifier is referenced by the current Asset Administration Shell.
 * @param aas The current Asset Administration Shell.
 * @param smId The identifier of the Submodel.
 */
export function isSubmodelReferenced(aas: aas.AssetAdministrationShell, smId: string): boolean {
    if (!aas.submodels) {
        return false;
    }

    return aas.submodels
        .flatMap(reference => reference.keys)
        .some(key => key.type === 'Submodel' && key.value === smId);
}

/**
 * Checks wether the Submodel with the specified identifier is referenced by the current Asset Administration Shell.
 * @param aas The current Asset Administration Shell.
 * @param smId The identifier of the Submodel.
 */
export function checkSubmodelIsReferenced(aas: aas.AssetAdministrationShell, smId: string): never | void {
    if (
        !aas.submodels ||
        !aas.submodels.flatMap(reference => reference.keys).some(key => key.type === 'Submodel' && key.value === smId)
    ) {
        throw new ApplicationError(
            `The AAS "${aas.id}" does not reference the Submodel "${smId}".`,
            ERROR.SUBMODEL_NOT_REFERENCED,
        );
    }
}

/**
 * Checks wether the Submodel with the specified identifier is contained in the AAS environment.
 * @param aas The current AAS environment.
 * @param id The identifier of the Submodel.
 */
export function hasSubmodel(env: types.Environment, id: string): boolean {
    if (!env.submodels) {
        return false;
    }

    return env.submodels.some(submodel => submodel.id === id);
}

/**
 * Replaces `\` by `/` and removes leading `/` and `./`.
 * @param path The current path expression.
 * @returns The normalized path expression.
 */
export function normalize(path: string | undefined | null): string {
    if (!path) {
        return '';
    }

    path = path.replace(/\\/g, '/');
    if (path.charAt(0) === '/') {
        path = path.slice(1);
    } else if (path.startsWith('./')) {
        path = path.slice(2);
    }

    return path;
}

export function processSerializationModifier(
    referable: aas.Referable,
    level: LevelModifier,
    extent: ExtentModifier,
): void {
    if (level === 'core') {
        if (isSubmodel(referable)) {
            coreLevel(referable.submodelElements);
        } else if (isSubmodelElementList(referable)) {
            coreLevel(referable.value);
        } else if (isSubmodelElementCollection(referable)) {
            coreLevel(referable.value);
        } else if (isAnnotatedRelationshipElement(referable)) {
            coreLevel(referable.annotations);
        } else if (isEntity(referable)) {
            coreLevel(referable.statements);
        }
    }

    if (extent === 'withoutBlobValue') {
        extentLevel(referable);
    }

    function coreLevel(submodelElements: aas.SubmodelElement[] | undefined): void {
        if (!submodelElements) {
            return;
        }

        for (const submodelElement of submodelElements) {
            if (isSubmodelElementList(submodelElement)) {
                delete submodelElement.value;
            } else if (isSubmodelElementCollection(submodelElement)) {
                delete submodelElement.value;
            } else if (isAnnotatedRelationshipElement(submodelElement)) {
                delete submodelElement.annotations;
            } else if (isEntity(submodelElement)) {
                delete submodelElement.statements;
            }
        }
    }

    function extentLevel(referable: aas.Referable): void {
        if (referable instanceof types.Blob) {
            referable.value = null;
        } else if (isSubmodel(referable)) {
            referable.submodelElements?.forEach(child => extentLevel(child));
        } else if (isSubmodelElementList(referable)) {
            referable.value?.forEach(child => extentLevel(child));
        } else if (isSubmodelElementCollection(referable)) {
            referable.value?.forEach(child => extentLevel(child));
        } else if (isAnnotatedRelationshipElement(referable)) {
            referable.annotations?.forEach(child => extentLevel(child));
        } else if (isEntity(referable)) {
            referable.statements?.forEach(child => extentLevel(child));
        }
    }
}

/**
 * Converts the value of objects to strings based on the formats specified and inserts them into another string.
 * @param format A composite format string.
 * @param args An object array that contains zero or more objects to format.
 * @returns A copy of format in which the format items have been replaced by the string representation of the corresponding objects in args.
 */
export function stringFormat(format: string, ...args: unknown[]) {
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
