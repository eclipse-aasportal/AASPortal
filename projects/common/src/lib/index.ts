/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import {
    AssetAdministrationShell,
    Blob,
    Identifiable,
    MultiLanguageProperty,
    Property,
    Referable,
    ReferenceElement,
    Submodel,
    SubmodelElement,
    SubmodelElementCollection
} from './aas.js';

export * from './document.js';
export * from './types.js';
export * from './authentication.js';
export * from './convert.js';
export * from './server-message.js';
export * as aas from './aas.js';
export * from './application-error.js';
export * from './multi-key-map.js';
export * from './keyed-list.js';
export * from './crc32.js';
export * from './query-parser.js';

/**
 * Determines whether the specified value represents a valid e-mail.
 * @param value The value
 * @returns `true` if the specified value represents a valid e-mail; otherwise, `false`.
 */
export function isValidEMail(value: string | undefined): boolean {
    return typeof value === 'string' &&
        value.length >= 5 &&
        /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);
}

/**
 * Determines whether the specified value represents a valid password.
 * @param value A text expression.
 * @returns `true` if the specified value represents a valid password; otherwise, `false`.
 */
export function isValidPassword(value: string | undefined): boolean {
    return typeof value === 'string' &&
        /^[\S]+$/.test(value) &&
        value.length >= 8 &&
        value.length <= 20 &&
        /^[a-zA-Z0-9-+_$%!§?#*~.,;:/]+$/.test(value);
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
    } catch (error) {
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
    } catch (_) {
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
 * Determines whether the specified value represents a submodel element.
 * @param value The current value.
 * @returns `true` if the specified value represents a submodel element; otherwise, `false`.
 */
export function isSubmodelElement(value: unknown): value is SubmodelElement {
    if (value && (value as Referable).modelType) {
        switch ((value as Referable).modelType) {
            case 'ReferenceElement':
            case 'Property':
            case 'MultiLanguageProperty':
            case 'Range':
            case 'Blob':
            case 'File':
            case 'RelationshipElement':
            case 'Capability':
            case 'SubmodelElementCollection':
            case 'SubmodelElementList':
            case 'Operation':
            case 'BasicEventElement':
            case 'Entity':
            case 'AnnotatedRelationshipElement':
                return true;
            default:
                return false;
        }
    }

    return false;
}

/**
 * Indicates whether the specified referable if of type Identifiable.
 * @param referable The referable.
 * @returns `true` if the specified referable is of type Identifiable.
 */
export function isIdentifiable(referable?: Referable | null): referable is Identifiable {
    switch (referable?.modelType) {
        case 'AssetAdministrationShell':
        case 'Submodel':
        case 'ConceptDescription':
            return true;
        default:
            return false;
    }
}

/**
 * Determines whether the specified referable represents a `AssetAdministrationShell`.
 * @param value The current referable.
 * @returns `true` if the specified referable represents a `AssetAdministrationShell`; otherwise, `false`.
 */
export function isAssetAdministrationShell(referable?: Referable | null): referable is AssetAdministrationShell {
    return referable?.modelType === 'AssetAdministrationShell';
}

/**
 * Determines whether the specified referable represents a `Submodel`.
 * @param value The current referable.
 * @returns `true` if the specified referable represents a `Submodel`; otherwise, `false`.
 */
export function isSubmodel(referable?: Referable | null): referable is Submodel {
    return referable?.modelType === 'Submodel';
}

/**
 * Determines whether the specified referable represents a `Property`.
 * @param value The current referable.
 * @returns `true` if the specified referable represents a `Property`; otherwise, `false`.
 */
export function isProperty(referable?: Referable | null): referable is Property {
    return referable?.modelType === 'Property';
}

/**
 * Determines whether the specified referable represents a `Blob`.
 * @param value The current referable.
 * @returns `true` if the specified referable represents a `Blob`; otherwise, `false`.
 */
export function isBlob(referable?: Referable | null): referable is Blob {
    return referable?.modelType === 'Blob';
}

/**
 * Determines whether the specified referable represents a `MultiLanguageProperty`.
 * @param value The current referable.
 * @returns `true` if the specified referable represents a `MultiLanguageProperty`; otherwise, `false`.
 */
export function isMultiLanguageProperty(referable?: Referable | null): referable is MultiLanguageProperty {
    return referable?.modelType === 'MultiLanguageProperty';
}

/**
 * Determines whether the specified referable represents a reference element.
 * @param value The current referable.
 * @returns `true` if the specified referable represents a `ReferenceElement`; otherwise, `false`.
 */
export function isReferenceElement(referable?: Referable | null): referable is ReferenceElement {
    return referable?.modelType === 'ReferenceElement';
}

/**
 * Determines whether the specified referable represents a reference element.
 * @param value The current referable.
 * @returns `true` if the specified referable represents a `SubmodelElementCollection`; otherwise, `false`.
 */
export function isSubmodelElementCollection(referable?: Referable | null): referable is SubmodelElementCollection {
    return referable?.modelType === 'SubmodelElementCollection';
}

/**
 * Checks if the specified string is url-safe-base64 encoded
 * @param s The string to test.
 * @return true if url-safe-base64 encoded
 */
export function isUrlSafeBase64(s: string): boolean {
    return /^[A-Za-z0-9_-]*[.=]{0,2}$/.test(s);
}