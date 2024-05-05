/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { AASEndpointType } from './types.js';
import {
    AssetAdministrationShell,
    Blob,
    Entity,
    Environment,
    Identifiable,
    MultiLanguageProperty,
    Property,
    Referable,
    ReferenceElement,
    RelationshipElement,
    Submodel,
    SubmodelElement,
    SubmodelElementCollection,
    SubmodelElementList,
} from './aas.js';
import { isEmpty } from 'lodash-es';

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

// eslint-disable-next-line @typescript-eslint/no-empty-function
export function noop() {}

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

/** Indicates whether the specified value if of type `Environment`. */
export function isEnvironment(value: unknown): value is Environment {
    return (
        Array.isArray((value as Environment).assetAdministrationShells) &&
        Array.isArray((value as Environment).submodels) &&
        Array.isArray((value as Environment).conceptDescriptions)
    );
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
export function isAssetAdministrationShell(referable: unknown): referable is AssetAdministrationShell {
    return (referable as Referable)?.modelType === 'AssetAdministrationShell';
}

/**
 * Determines whether the specified referable represents a `Submodel`.
 * @param value The current referable.
 * @returns `true` if the specified referable represents a `Submodel`; otherwise, `false`.
 */
export function isSubmodel(referable: unknown): referable is Submodel {
    return (referable as Referable)?.modelType === 'Submodel';
}

/**
 * Determines whether the specified referable represents a `Property`.
 * @param value The current referable.
 * @returns `true` if the specified referable represents a `Property`; otherwise, `false`.
 */
export function isProperty(referable: unknown): referable is Property {
    return (referable as Referable)?.modelType === 'Property';
}

/**
 * Determines whether the specified referable represents a `Blob`.
 * @param value The current referable.
 * @returns `true` if the specified referable represents a `Blob`; otherwise, `false`.
 */
export function isBlob(referable: unknown): referable is Blob {
    return (referable as Referable)?.modelType === 'Blob';
}

/**
 * Determines whether the specified referable represents a `MultiLanguageProperty`.
 * @param value The current referable.
 * @returns `true` if the specified referable represents a `MultiLanguageProperty`; otherwise, `false`.
 */
export function isMultiLanguageProperty(referable: unknown): referable is MultiLanguageProperty {
    return (referable as Referable)?.modelType === 'MultiLanguageProperty';
}

/**
 * Determines whether the specified referable represents a reference element.
 * @param value The current referable.
 * @returns `true` if the specified referable represents a `ReferenceElement`; otherwise, `false`.
 */
export function isReferenceElement(referable: unknown): referable is ReferenceElement {
    return (referable as Referable)?.modelType === 'ReferenceElement';
}

/**
 * Determines whether the specified referable represents a submodel element collection.
 * @param value The current referable.
 * @returns `true` if the specified referable represents a `SubmodelElementCollection`; otherwise, `false`.
 */
export function isSubmodelElementCollection(referable: unknown): referable is SubmodelElementCollection {
    return (referable as Referable)?.modelType === 'SubmodelElementCollection';
}

/**
 * Determines whether the specified referable represents a submodel element list.
 * @param value The current referable.
 * @returns `true` if the specified referable represents a `SubmodelElementList`; otherwise, `false`.
 */
export function isSubmodelElementList(referable: unknown): referable is SubmodelElementList {
    return (referable as Referable)?.modelType === 'SubmodelElementList';
}

/**
 * Determines whether the specified referable represents a relationship element.
 * @param value The current referable.
 * @returns `true` if the specified referable represents a `RelationshipElement`; otherwise, `false`.
 */
export function isRelationshipElement(referable: unknown): referable is RelationshipElement {
    return (referable as Referable)?.modelType === 'RelationshipElement';
}

/**
 * Determines whether the specified referable represents an entity.
 * @param value The current referable.
 * @returns `true` if the specified referable represents a `Entity`; otherwise, `false`.
 */
export function isEntity(referable: unknown): referable is Entity {
    return (referable as Referable)?.modelType === 'Entity';
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
        const names = pathname.split('/').filter(item => !isEmpty(item));
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
            const pathname = url.pathname;
            return pathname && pathname !== '/' ? 'WebDAV' : 'AASServer';
        }
        case 'opc.tcp:':
            return 'OpcuaServer';
        default:
            throw new Error(`Protocol "${url.protocol}" is not supported.`);
    }
}

/**
 * Creates an immutable object.
 * @param obj The current object.
 * @returns The immutable object.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function deepFreeze(obj: any): any {
    Object.keys(obj).forEach(property => {
        if (typeof obj[property] === 'object' && !Object.isFrozen(obj[property])) {
            deepFreeze(obj[property]);
        }
    });

    return Object.freeze(obj);
}
