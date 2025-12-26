/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Readable } from 'stream';
import {
    aas,
    ApplicationError,
    deserializeValue,
    isAnnotatedRelationshipElement,
    isBasicEventElement,
    isBlob,
    isEntity,
    isFile,
    isMultiLanguageProperty,
    isProperty,
    isRange,
    isReferenceElement,
    isRelationshipElement,
    isSubmodel,
    isSubmodelElementCollection,
    isSubmodelElementList,
    jsonization,
    splitIdShortPath,
    types,
} from 'aas-core';

import { Cursor, ExtentModifier, LevelModifier } from './types.js';
import { ERROR } from './error.js';

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
 * Checks wether the Submodel with the specified identifier is referenced by the current Asset Administration Shell.
 * @param aas The current Asset Administration Shell.
 * @param smId The identifier of the Submodel.
 */
export function checkSubmodelIsReferenced(aas: aas.AssetAdministrationShell, smId: string): never | void {
    if (
        !aas.submodels ||
        !aas.submodels.flatMap(reference => reference.keys).some(key => key.type === 'Submodel' && key.value === smId)
    ) {
        throw new ApplicationError(ERROR.SUBMODEL_NOT_REFERENCED, { id: aas.id, submodelId: smId });
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
 * Selects the Submodel Element at the specified path within the specified Submodel.
 * @param submodel The current Submodel.
 * @param idShortPath The path to the Submodel Element.
 * @returns The Submodel Element or `undefined`.
 */
export function selectSubmodelElement(submodel: aas.Submodel, idShortPath: string): aas.SubmodelElement | undefined {
    let current: aas.SubmodelElement | undefined = submodel;
    const items = splitIdShortPath(idShortPath).reverse();
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
            case 'SubmodelElementList': {
                const value = (current as aas.SubmodelElementList).value ?? [];
                const index = parseInt(idShort, 10);
                if (index >= 0) {
                    current = value[index];
                    if (current) {
                        break;
                    }
                }

                current = (current as aas.SubmodelElementList).value?.find(element => element.idShort === idShort);
                break;
            }
            case 'AnnotatedRelationshipElement':
                current = (current as aas.AnnotatedRelationshipElement).annotations?.find(
                    element => element.idShort === idShort,
                );
                break;
            case 'Entity':
                current = (current as aas.Entity).statements?.find(element => element.idShort === idShort);
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
    const items = splitIdShortPath(idShortPath).reverse();
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
            case types.ModelType.SubmodelElementList: {
                const value = (current as types.SubmodelElementList).value ?? [];
                const index = parseInt(idShort, 10);
                if (index >= 0) {
                    current = value[index];
                    if (current) {
                        break;
                    }
                }

                current = (current as types.SubmodelElementList).value?.find(element => element.idShort === idShort);
                break;
            }
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
 * Serializes an AAS SubmodelElement into a primitive value, object, or array suitable for value transfer.
 *
 * The serialization logic depends on the specific type of the provided submodel element:
 * - For properties, deserializes the value according to its value type.
 * - For files and blobs, returns an object with `contentType` and `value`.
 * - For multi-language properties, returns the element as-is.
 * - For ranges, returns an object with deserialized `min` and `max` values.
 * - For reference elements, serializes the reference value.
 * - For relationship elements, serializes both `first` and `second` references.
 * - For basic event elements, serializes the observed reference.
 * - For submodel element collections, returns an object mapping `idShort` to serialized child values.
 * - For submodel element lists, returns an array of serialized child values.
 * - For entities, returns an object with `entityType`, `globalAssetId`, and serialized statements.
 * - For annotated relationship elements, serializes both references and all annotations.
 *
 * Returns `undefined` if the element type is not recognized.
 *
 * @param element - The AAS SubmodelElement to serialize.
 * @returns The serialized value, which may be a primitive, object, array, or `undefined`.
 */
export function toValueSerialization(element: aas.SubmodelElement): jsonization.JsonValue {
    if (isProperty(element)) {
        return element.value !== undefined ? deserializeValue(element.value, element.valueType) : '';
    }

    if (isFile(element)) {
        if (element.value) {
            return { contentType: element.contentType, value: element.value };
        } else {
            return '';
        }
    }

    if (isMultiLanguageProperty(element)) {
        let value: jsonization.JsonArray;
        if (Array.isArray(element.value)) {
            value = element.value.map(item => ({ language: item.language, text: item.text }));
        } else {
            value = [];
        }

        return value;
    }

    if (isBlob(element)) {
        const value: jsonization.JsonObject = { contentType: element.contentType };
        if (element.value !== undefined) {
            value.value = element.value;
        }

        return value;
    }

    if (isRange(element)) {
        const value: jsonization.JsonObject = {};
        if (element.min !== undefined) {
            value.min = deserializeValue(element.min, element.valueType);
        }

        if (element.max !== undefined) {
            value.max = deserializeValue(element.max, element.valueType);
        }

        return value;
    }

    if (isReferenceElement(element)) {
        return element.value !== undefined ? referenceToValueSerialization(element.value) : {};
    }

    if (isRelationshipElement(element)) {
        const value: jsonization.JsonObject = {};
        if (element.first !== undefined) {
            value.first = referenceToValueSerialization(element.first);
        }

        if (element.second !== undefined) {
            value.second = referenceToValueSerialization(element.second);
        }

        return value;
    }

    if (isBasicEventElement(element)) {
        return {
            observed: referenceToValueSerialization(element.observed),
        };
    }

    if (isSubmodelElementCollection(element)) {
        const value: jsonization.JsonObject = {};
        for (const child of element.value ?? []) {
            value[child.idShort] = toValueSerialization(child);
        }

        return value;
    }

    if (isSubmodelElementList(element)) {
        return element.value !== undefined ? element.value.map(child => toValueSerialization(child)) : [];
    }

    if (isEntity(element)) {
        const value: jsonization.JsonObject = {};
        if (element.globalAssetId !== undefined) {
            value.globalAssetId = element.globalAssetId;
        }

        if (element.entityType !== undefined) {
            value.entityType = element.entityType;
        }

        if (element.statements !== undefined) {
            const statements: jsonization.JsonObject = {};
            for (const child of element.statements ?? []) {
                statements[child.idShort] = toValueSerialization(child);
            }

            value.statements = statements;
        }

        return value;
    }

    if (isAnnotatedRelationshipElement(element)) {
        const value: jsonization.JsonObject = {};
        if (element.annotations !== undefined) {
            const annotations: jsonization.JsonObject = {};
            for (const child of element.annotations ?? []) {
                annotations[child.idShort] = toValueSerialization(child);
            }

            value.annotations = annotations;
        }

        if (element.first !== undefined) {
            value.first = referenceToValueSerialization(element.first);
        }

        if (element.second !== undefined) {
            value.second = referenceToValueSerialization(element.second);
        }

        return value;
    }

    throw new Error(ERROR.INVALID_OPERATION);
}

/**
 * Converts a value to its string representation according to the AAS specification (IDTA-01001-3-1-2, Part 1,
 * section "Data type to value mapping").
 * The function maps the input value and its data type to the correct string as specified.
 * @param value The value to convert.
 * @param dataType The AAS data type (XSD type string).
 * @returns The string representation of the value.
 */
export function serializeValue(value: unknown, dataType: types.DataTypeDefXsd): string | null {
    if (value === null || value === undefined) {
        return null;
    }

    switch (dataType) {
        case types.DataTypeDefXsd.AnyUri:
        case types.DataTypeDefXsd.String:
        case types.DataTypeDefXsd.Base64Binary:
        case types.DataTypeDefXsd.HexBinary:
            if (typeof value !== 'string') {
                throw new ApplicationError(ERROR.INVALID_VALUE_TYPE, { expected: 'string', actual: typeof value });
            }

            return value;

        case types.DataTypeDefXsd.Boolean:
            if (typeof value !== 'boolean') {
                throw new ApplicationError(ERROR.INVALID_VALUE_TYPE, { expected: 'boolean', actual: typeof value });
            }

            return value ? 'true' : 'false';

        case types.DataTypeDefXsd.Byte:
        case types.DataTypeDefXsd.Int:
        case types.DataTypeDefXsd.Integer:
        case types.DataTypeDefXsd.NegativeInteger:
        case types.DataTypeDefXsd.NonNegativeInteger:
        case types.DataTypeDefXsd.NonPositiveInteger:
        case types.DataTypeDefXsd.PositiveInteger:
        case types.DataTypeDefXsd.Short:
        case types.DataTypeDefXsd.UnsignedByte:
        case types.DataTypeDefXsd.UnsignedInt:
        case types.DataTypeDefXsd.UnsignedShort:
            if (typeof value !== 'number') {
                throw new ApplicationError(ERROR.INVALID_VALUE_TYPE, { expected: 'number', actual: typeof value });
            }

            if (!Number.isInteger(value)) {
                throw new ApplicationError(ERROR.INVALID_VALUE_TYPE, { expected: 'integer', actual: typeof value });
            }

            return value.toString();

        case types.DataTypeDefXsd.Long:
        case types.DataTypeDefXsd.UnsignedLong:
            if (typeof value !== 'string') {
                throw new ApplicationError(ERROR.INVALID_VALUE_TYPE, { expected: 'string', actual: typeof value });
            }

            return value;

        case types.DataTypeDefXsd.Decimal:
        case types.DataTypeDefXsd.Double:
        case types.DataTypeDefXsd.Float:
            if (typeof value !== 'number') {
                throw new ApplicationError(ERROR.INVALID_VALUE_TYPE, { expected: 'number', actual: typeof value });
            }

            return value.toString();

        case types.DataTypeDefXsd.Date:
        case types.DataTypeDefXsd.DateTime:
        case types.DataTypeDefXsd.Time:
        case types.DataTypeDefXsd.Duration:
        case types.DataTypeDefXsd.GDay:
        case types.DataTypeDefXsd.GMonth:
        case types.DataTypeDefXsd.GMonthDay:
        case types.DataTypeDefXsd.GYear:
        case types.DataTypeDefXsd.GYearMonth:
            if (typeof value !== 'string') {
                throw new ApplicationError(ERROR.INVALID_VALUE_TYPE, { expected: 'string', actual: typeof value });
            }
            return value;

        default: {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const invalid: never = dataType;
            throw new Error(`Unknown data type: ${dataType}`);
        }
    }
}

function referenceToValueSerialization(value: aas.Reference): jsonization.JsonObject {
    return {
        type: value.type,
        keys: value.keys.map(key => ({
            type: key.type,
            value: key.value,
        })),
    };
}
