/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { DOMParser } from '@xmldom/xmldom';
import { Crc32, aas, flat } from 'aas-core';
import * as aasV2 from './aas-v2.js';
import { XmlReaderV1 } from './reader/xml-reader-v1.js';
import { XmlReaderV2 } from './reader/xml-reader-v2.js';
import { XmlReaderV3 } from './reader/xml-reader-v3.js';
import { HTMLDocumentElement } from './types.js';
import { AASReader } from './aas-reader.js';
import { JsonReaderV2 } from './reader/json-reader-v2.js';
import { JsonReaderV3 } from './reader/json-reader-v3.js';

/**
 * Decodes a base64url encoded string into an ASCII string.
 *
 * @param data - The base64url encoded string to decode
 * @returns The decoded ASCII string
 */
export function decodeBase64Url(data: string): string {
    return Buffer.from(data, 'base64url').toString('ascii');
}

/**
 * Encodes a string to base64url format.
 * Base64URL encoding is similar to base64 encoding but is safe for use in URLs and filenames.
 * It uses '-' and '_' instead of '+' and '/' respectively, and omits padding characters ('=').
 *
 * @param data - The string to be encoded
 * @returns The base64url encoded string
 */
export function encodeBase64Url(data: string): string {
    return Buffer.from(data).toString('base64url');
}

/**
 * Computes the CRC32 checksum for the given environment containing asset administration shells,
 * concept descriptions, and submodels. It iterates through each of these entities and their
 * referables (properties, submodels, collections, lists, annotated relationship elements,
 * and entities), while applying specific value exclusions based on the type of referable.
 * The checksum is returned after processing all relevant data.
 */
export function computeCrc32(env: aas.Environment): number {
    const crc = new Crc32();
    crc.start();

    for (const shell of env.assetAdministrationShells) {
        crc.add(JSON.stringify(shell));
    }

    for (const conceptDescription of env.conceptDescriptions) {
        crc.add(JSON.stringify(conceptDescription));
    }

    for (const submodel of env.submodels) {
        for (const referable of flat(submodel)) {
            switch (referable.modelType) {
                case 'Property': {
                    const property: aas.Property = { ...(referable as aas.Property) };
                    if (property.category !== 'CONSTANT' && property.category !== 'PARAMETER') {
                        delete property.value;
                    }

                    crc.add(JSON.stringify(property));
                    break;
                }
                case 'Submodel': {
                    const sm: aas.Submodel = { ...(referable as aas.Submodel) };
                    delete sm.submodelElements;
                    crc.add(JSON.stringify(sm));
                    break;
                }
                case 'SubmodelElementCollection': {
                    const collection: aas.SubmodelElementCollection = {
                        ...(referable as aas.SubmodelElementCollection),
                    };
                    delete collection.value;
                    crc.add(JSON.stringify(collection));
                    break;
                }
                case 'SubmodelElementList': {
                    const list: aas.SubmodelElementList = { ...(referable as aas.SubmodelElementList) };
                    delete list.value;
                    crc.add(JSON.stringify(list));
                    break;
                }
                case 'AnnotatedRelationshipElement': {
                    const element: aas.AnnotatedRelationshipElement = {
                        ...(referable as aas.AnnotatedRelationshipElement),
                    };

                    delete element.annotations;
                    crc.add(JSON.stringify(element));
                    break;
                }
                case 'Entity': {
                    const entity: aas.Entity = {
                        ...(referable as aas.Entity),
                    };

                    delete entity.statements;
                    crc.add(JSON.stringify(entity));
                    break;
                }
                default:
                    crc.add(JSON.stringify(referable));
                    break;
            }
        }
    }

    return crc.end();
}

/**
 * Converts a readable stream into a Base64-encoded object URL.
 *
 * @param stream - The readable stream to be converted.
 * @param contentType - The MIME type to be used in the data URI (default is 'image/png').
 * @returns A promise that resolves to a Base64-encoded string representation of the stream data.
 */
export async function streamToObjectUrl(
    stream: NodeJS.ReadableStream,
    contentType: string = 'image/png',
): Promise<string> {
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk, 'utf-8') : Buffer.from(chunk));
    }

    return `data:${contentType};base64,` + Buffer.concat(chunks).toString('base64');
}

/**
 * Creates an AASReader instance based on the XML namespace version found in the document.
 *
 * @param xml - The XML string to parse
 * @param createReferenceToParent - Optional flag to create parent references in the resulting object structure. Defaults to false.
 * @returns An AASReader instance specific to the XML namespace version (V1, V2, or V3)
 * @throws Error if no valid AAS namespace is found in the document
 */
export function createXmlReader(xml: string, createReferenceToParent: boolean = false): AASReader {
    const document = new DOMParser().parseFromString(xml);
    const nsMap = (document.documentElement as HTMLDocumentElement)._nsMap ?? {};
    for (const prefix in nsMap) {
        const uri = nsMap[prefix];
        if (uri.startsWith('https://admin-shell.io/aas/3/')) {
            return new XmlReaderV3(document, createReferenceToParent);
        }

        if (uri === 'http://www.admin-shell.io/aas/2/0') {
            return new XmlReaderV2(document, createReferenceToParent);
        }

        if (uri === 'http://www.admin-shell.io/aas/1/0') {
            return new XmlReaderV1(document, createReferenceToParent);
        }
    }

    throw new Error('Invalid operation.');
}

/**
 * Creates an appropriate AAS reader based on the provided JSON data structure.
 *
 * @param data - The JSON object to be read. Can be an AAS environment (V2 or V3) or a submodel element.
 * @param createReferenceToParent - Optional flag to determine if parent references should be created. Defaults to false.
 * @returns An instance of AASReader appropriate for the provided data structure.
 * @throws Error if the data structure is not recognized or implementation is missing.
 *
 * The function determines the type of data by checking:
 * - If it's a V2 AAS environment (has assets array)
 * - If it's a V3 environment (has arrays for shells, submodels, and concept descriptions)
 * - If it's a V3 submodel element (has modelType as string)
 * - If it's a V2 submodel element (has modelType.name as string)
 */
export function createJsonReader(data: object, createReferenceToParent: boolean = false): AASReader {
    if (isAssetAdministrationShellEnvironment(data)) {
        return new JsonReaderV2(data, createReferenceToParent);
    }

    if (isEnvironment(data)) {
        return new JsonReaderV3(data, createReferenceToParent);
    }

    if (isSubmodelElement(data)) {
        return new JsonReaderV3(undefined, createReferenceToParent);
    }

    if (isSubmodelElementV2(data)) {
        return new JsonReaderV2(undefined, createReferenceToParent);
    }

    throw new Error('Not implemented.');

    function isAssetAdministrationShellEnvironment(value: unknown): value is aasV2.AssetAdministrationShellEnvironment {
        const env = value as aasV2.AssetAdministrationShellEnvironment;
        return Array.isArray(env.assets);
    }

    function isEnvironment(value: unknown): value is aas.Environment {
        const env = value as aas.Environment;
        return (
            Array.isArray(env.assetAdministrationShells) &&
            Array.isArray(env.submodels) &&
            Array.isArray(env.conceptDescriptions)
        );
    }

    function isSubmodelElement(value: unknown): value is aas.Referable {
        return typeof (value as aas.Referable).modelType === 'string';
    }

    function isSubmodelElementV2(value: unknown): value is aasV2.Referable {
        return typeof (value as aasV2.Referable).modelType?.name === 'string';
    }
}
