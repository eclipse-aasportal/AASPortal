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
    isAnnotatedRelationshipElement,
    isEntity,
    isSubmodel,
    isSubmodelElementCollection,
    isSubmodelElementList,
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
