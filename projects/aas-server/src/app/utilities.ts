/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import fs from 'fs';
import path from 'path';
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

import { decodeBase64Url, encodeBase64Url } from 'aas-package';

import { Cursor, ExtentModifier, LevelModifier } from './types.js';
import { ERROR } from './error.js';

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

export function toCursor(value: string | undefined): Cursor {
    if (value === undefined) {
        return {};
    }

    return JSON.parse(decodeBase64Url(value));
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

/**
 * Returns all immediate child elements of the provided referable object, according to its type.
 *
 * - For Submodel instances, returns the list of contained submodel elements.
 * - For SubmodelElementCollection instances, returns the array of child values.
 * - For SubmodelElementList instances, returns the array of elements in the list.
 * - For AnnotatedRelationshipElement instances, returns the set of annotations.
 * - For Entity instances, returns the list of statements.
 * - For any other type, or if the corresponding property is undefined, returns an empty array.
 *
 * @param referable The referable AAS object from which to obtain children.
 * @returns An array of immediate child referables, or an empty array if none exist.
 */
export function getChildren(referable: types.IReferable): types.IReferable[] {
    if (referable instanceof types.Submodel) {
        return referable.submodelElements ?? [];
    }

    if (referable instanceof types.SubmodelElementCollection) {
        return referable.value ?? [];
    }

    if (referable instanceof types.SubmodelElementList) {
        return referable.value ?? [];
    }

    if (referable instanceof types.AnnotatedRelationshipElement) {
        return referable.annotations ?? [];
    }

    if (referable instanceof types.Entity) {
        return referable.statements ?? [];
    }

    return [];
}

/**
 * Iterates recursively over all referable elements in a hierarchical AAS structure.
 *
 * This generator yields the specified root referable and then traverses its entire
 * hierarchy in depth-first order, yielding each contained referable element exactly once.
 *
 * @param referable The root referable element to start traversal from.
 * @yields Each referable element in the tree, starting with the input.
 */
export function* selectReferables(referable: types.IReferable): Generator<types.IReferable> {
    const stack: types.IReferable[][] = [];
    yield referable;

    let children = getChildren(referable);
    if (children.length > 0) {
        stack.push(children);
    }

    while (stack.length) {
        for (const child of stack.pop()!) {
            yield child;

            children = getChildren(child);
            if (children.length > 0) {
                stack.push(children);
            }
        }
    }
}

/**
 * Recursively copies a directory and its contents.
 * @param src - Source directory path
 * @param dest - Destination directory path
 */
export async function copyDirectory(src: string, dest: string): Promise<void> {
    const srcStat = await fs.promises.stat(src);
    if (!srcStat.isDirectory()) {
        throw new Error(`Source path is not a directory: ${src}`);
    }

    await fs.promises.mkdir(dest, { recursive: true });
    const entries = await fs.promises.readdir(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            await copyDirectory(srcPath, destPath);
        } else if (entry.isFile()) {
            await fs.promises.copyFile(srcPath, destPath);
        } else if (entry.isSymbolicLink()) {
            const linkTarget = await fs.promises.readlink(srcPath);
            await fs.promises.symlink(linkTarget, destPath);
        }
    }
}

export async function restoreFile(backup: string, file: string): Promise<void> {
    if (fs.existsSync(file)) {
        await fs.promises.unlink(file);
    }

    await fs.promises.rename(backup, file);
}

export async function restoreDir(backup: string, dir: string): Promise<void> {
    if (fs.existsSync(dir)) {
        await fs.promises.rm(dir, { recursive: true });
    }

    await fs.promises.rename(backup, dir);
}

export async function getFiles(dir: string, files: fs.Dirent[] = []): Promise<fs.Dirent[]> {
    if (!fs.existsSync(dir)) {
        return [];
    }

    for (const entry of await fs.promises.readdir(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) {
            await getFiles(path.join(entry.parentPath, entry.name), files);
        } else if (entry.isFile()) {
            files.push(entry);
        }
    }

    return files;
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