/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import isEmpty from 'lodash-es/isEmpty.js';
import { AASEndpointType } from './types.js';
import {
    AnnotatedRelationshipElement,
    AssetAdministrationShell,
    Blob,
    DataElement,
    Entity,
    Environment,
    File,
    HasSemantics,
    Identifiable,
    MultiLanguageProperty,
    Operation,
    Property,
    Range,
    Referable,
    Reference,
    ReferenceElement,
    RelationshipElement,
    Submodel,
    SubmodelElement,
    SubmodelElementCollection,
    SubmodelElementList,
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

// eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
export function noop(...args: unknown[]) {}

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
 * Determines whether the specified value is of type `Referable`.
 * @param value The current value.
 * @returns `true` if the specified value is of type `Referable`; otherwise, `false`.
 */
export function isReferable(value: unknown): value is Referable {
    const referable = value as Referable;
    return typeof referable.modelType === 'string' && typeof referable.idShort === 'string';
}

/**
 * Determines whether the specified value is of type `HasSemantics`.
 * @param value The current value.
 * @returns `true` if the specified value is of type `HasSemantics`; otherwise, `false`.
 */
export function isReference(value: unknown): value is Reference {
    if (!value || typeof value !== 'object') {
        return false;
    }

    return typeof (value as Reference).type === 'string' && Array.isArray((value as Reference).keys);
}

/**
 * Determines whether the specified value is of type `HasSemantics`.
 * @param value The current value.
 * @returns `true` if the specified value is of type `HasSemantics`; otherwise, `false`.
 */
export function isHasSemantics(value: unknown): value is HasSemantics {
    if (!value || typeof value !== 'object') {
        return false;
    }

    return (
        isReference((value as HasSemantics).semanticId) ||
        Array.isArray((value as HasSemantics).supplementalSemanticIds)
    );
}

/**
 * Gets the semantic identifier of the specified AAS element.
 * @param value The AAS element.
 * @returns The semantic identifier or `undefined`.
 */
export function getSemanticId(value: HasSemantics | Reference): string | undefined {
    let semanticId: string | undefined;
    if (value) {
        if (isReference(value)) {
            if (value.keys.length > 0) {
                return value.keys[0].value;
            }
        } else {
            if (value.semanticId?.keys != null && value.semanticId.keys.length > 0) {
                return value.semanticId.keys[0].value;
            }
        }
    }

    return semanticId;
}

/**
 * Determines whether the specified value represents a submodel element.
 * @param value The current value.
 * @returns `true` if the specified value represents a submodel element; otherwise, `false`.
 */
export function isSubmodelElement(value: unknown): value is SubmodelElement {
    if (value && (value as Referable).modelType) {
        switch ((value as Referable).modelType) {
            case 'AnnotatedRelationshipElement':
            case 'BasicEventElement':
            case 'Blob':
            case 'Capability':
            case 'Entity':
            case 'File':
            case 'MultiLanguageProperty':
            case 'Operation':
            case 'Property':
            case 'Range':
            case 'ReferenceElement':
            case 'RelationshipElement':
            case 'SubmodelElementCollection':
            case 'SubmodelElementList':
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
export function isIdentifiable(referable: Referable | undefined | null): referable is Identifiable {
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
 * Indicates whether the specified referable if of type `DataElement`.
 * @param referable The referable.
 * @returns `true` if the specified referable is of type `DataElement`.
 */
export function isDataElement(referable: Referable | undefined): referable is DataElement {
    switch (referable?.modelType) {
        case 'Blob':
        case 'File':
        case 'MultiLanguageProperty':
        case 'Property':
        case 'Range':
        case 'ReferenceElement':
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
 * Determines whether the specified referable represents a `File`.
 * @param value The current referable.
 * @returns `true` if the specified referable represents a `File`; otherwise, `false`.
 */
export function isFile(referable: unknown): referable is File {
    return (referable as Referable)?.modelType === 'File';
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
 * Determines whether the specified referable represents an annotated relationship element.
 * @param value The current referable.
 * @returns `true` if the specified referable represents a `AnnotatedRelationshipElement`; otherwise, `false`.
 */
export function isAnnotatedRelationshipElement(referable: unknown): referable is AnnotatedRelationshipElement {
    return (referable as AnnotatedRelationshipElement)?.modelType === 'AnnotatedRelationshipElement';
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
 * Determines whether the specified referable represents an operation.
 * @param value The current referable.
 * @returns `true` if the specified referable represents an `Operation`; otherwise, `false`.
 */
export function isOperation(referable: unknown): referable is Operation {
    return (referable as Referable)?.modelType === 'Operation';
}

/**
 * Determines whether the specified referable represents a range.
 * @param value The current referable.
 * @returns `true` if the specified referable represents a `Range`; otherwise, `false`.
 */
export function isRange(referable: unknown): referable is Range {
    return (referable as Range)?.modelType === 'Range';
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
            const param = url.searchParams.get('type');
            if (!param) {
                return 'AAS_API';
            }

            switch (param.toLowerCase()) {
                case 'aas_api':
                case 'aas-api':
                    return 'AAS_API';
                case 'webdav':
                    return 'WebDAV';
                case 'opc-ua':
                case 'opcua':
                case 'opc_ua':
                    return 'OPC_UA';
            }

            throw new Error(`Endpoint type "${param}" is not supported.`);
        }
        case 'opc.tcp:':
            return 'OPC_UA';
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
