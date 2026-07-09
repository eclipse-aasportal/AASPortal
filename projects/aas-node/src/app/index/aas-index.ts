/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import {
    AASCursor,
    AASDocument,
    AASDocumentId,
    AASEndpoint,
    AASPagedResult,
    ApplicationError,
    PagedResult,
    aas,
    getAbbreviation,
} from 'aas-core';

import { KeywordDirectory } from './keyword-directory.js';
import { aasV2 } from 'aas-package';
import { InjectionToken } from 'tsyringe';
import { ERRORS } from '../errors.js';

/** Injection token. */
export const AAS_INDEX: InjectionToken<AASIndex> = 'AAS_INDEX';

/**
 * Represents an index of Asset Administration Shells.
 */
export abstract class AASIndex {
    protected constructor(private readonly keywordDirectory: KeywordDirectory) {}

    /**
     * Gets the total number of AAS documents in the AAS index or an AAS endpoint with the specified name.
     *
     * @param endpoint Optional the name of the AAS endpoint.
     * @returns The number of AAS documents.
     */
    public abstract getCount(endpoint?: string): Promise<number>;

    /**
     * Gets all registered AAS endpoints.
     *
     * @returns An array of the registered AAS endpoints.
     */
    public abstract getEndpoints(): Promise<AASEndpoint[]>;

    /**
     * Gets the number of registered AAS endpoints.
     *
     * @returns The number of registered AAS endpoints.
     */
    public abstract getEndpointCount(): Promise<number>;

    /**
     * Gets the `AASEndpoint` of the endpoint with the specified name.
     *
     * @param name The name of the AAS endpoint.
     * @returns An `AASEndpoint` instance.
     */
    public abstract getEndpoint(name: string): Promise<AASEndpoint>;

    /**
     * Tries to get the `AASEndpoint` of the endpoint with the specified name.
     *
     * @param name The name of the AAS endpoint.
     * @returns An `AASEndpoint` instance or `undefined`.
     */
    public abstract findEndpoint(name: string): Promise<AASEndpoint | undefined>;

    /**
     * Inserts a new AAS endpoint.
     * @param endpoint The AAS endpoint to add.
     */
    public abstract insertEndpoint(endpoint: AASEndpoint): Promise<void>;

    /**
     * Updates the data of an existing AAS endpoint.
     *
     * @param endpoint The new AAS endpoint data.
     * @returns The old AAS endpoint data.
     */
    public abstract updateEndpoint(endpoint: AASEndpoint): Promise<AASEndpoint>;

    /**
     * Deletes an AAS endpoint with the specified name.
     *
     * @param endpoint The name of the AAS endpoint to delete.
     * @returns `true` if the AAS endpoint was successfully deleted; otherwise `false`.
     */
    public abstract deleteEndpoint(endpoint: string): Promise<boolean>;

    /**
     * Gets a page of AAS documents.
     *
     * @param cursor The cursor that specifies the page to get (first, previous, next, last).
     * @param query An optional query expression.
     * @param language Optional the
     */
    public abstract getDocuments(cursor: AASCursor, query?: string, language?: string): Promise<AASPagedResult>;

    /**
     * Gets the documents of the specified endpoint.
     *
     * @param endpoint The name of the AAS endpoint.
     * @param cursor The cursor to get the next page or the first page if `cursor` is `undefined`.
     * @param limit The maximum number of items in the result.
     * @returns The next page.
     */
    public abstract getEndpointDocuments(
        endpoint: string,
        cursor: string | undefined,
        limit?: number,
    ): Promise<PagedResult<AASDocument>>;

    /**
     * Updates an AAS document.
     *
     * @param document The updated AAS document.
     */
    public abstract update(document: AASDocument): Promise<void>;

    /**
     * Inserts a new AAS document.
     *
     * @param document The AAS document to insert.
     */
    public abstract insert(document: AASDocument): Promise<void>;

    /**
     * Finds and retrieves an AASDocument from the database based on the provided parameters.
     *
     * @param endpoint - The AAS endpoint name (optional).
     * @param modelType - The model type to search for ('AssetAdministrationShell' or 'Asset').
     * @param id - Depending on the `modelType` the unique identifier of the Asset Administration Shell or the Asset.
     * @returns A promise that resolves to the found `AASDocument`, or `undefined` if no document is found.
     */
    public abstract find(
        endpoint: string | undefined,
        modelType: 'AssetAdministrationShell' | 'Asset',
        id: string,
    ): Promise<AASDocument | undefined>;

    /**
     * Gets an AASDocument from the database based on the provided parameters.
     *
     * @param endpoint - The AAS endpoint name (optional).
     * @param modelType - The model type to search for ('AssetAdministrationShell' or 'Asset').
     * @param id - Depending on the modelType the unique identifier of the Asset Administration Shell or the Asset.
     * @returns A promise that resolves to the found `AASDocument`.
     */
    public async get(
        endpoint: string | undefined,
        modelType: 'AssetAdministrationShell' | 'Asset',
        id: string,
    ): Promise<AASDocument> {
        const document = await this.find(endpoint, modelType, id);
        if (!document) {
            throw new ApplicationError(ERRORS.AAS_NOT_FOUND, { modelType, id }, 404);
        }

        return document;
    }

    /**
     * Deletes the AAS with the specified identifier.
     *
     * @param endpoint Optional the name of the AAS endpoint.
     * @param id The identifier of the AAS to delete.
     */
    public abstract delete(endpoint?: string, id?: string): Promise<boolean>;

    /**
     * Clears the content of the AAS index. If an endpoint is specified only the content that belongs to that endpoint
     * will be cleaned.
     *
     * @param endpoint Optional the name of the AAS endpoint.
     */
    public abstract clear(endpoint?: string): Promise<void>;

    /**
     * Destroys the AAS index.
     */
    public abstract destroy(): Promise<void>;

    protected toAbbreviation(referable: aas.Referable): string {
        return getAbbreviation(referable.modelType)!.toLowerCase();
    }

    protected toDocumentId(document: AASDocument): AASDocumentId {
        return { endpoint: document.endpoint, id: document.id };
    }

    protected preprocessString(value: string | aasV2.LangString[] | undefined, max: number = 512): string | undefined {
        if (value === undefined) {
            return undefined;
        }

        if (typeof value === 'string') {
            if (value.length < 128) {
                return value;
            }

            return this.keywordDirectory.toString(this.keywordDirectory.containedKeyword(value), ';', max);
        }

        const keywords: string[] = [];
        for (const item of value) {
            if (item.text.length < 32) {
                keywords.push(item.text);
            } else {
                keywords.push(...this.keywordDirectory.containedKeyword(item.text, item.language));
            }
        }

        return this.keywordDirectory.toString(keywords, ';', max);
    }
}
