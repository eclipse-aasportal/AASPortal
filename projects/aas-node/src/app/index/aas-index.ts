/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { InjectionToken, Disposable } from 'tsyringe';
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
import { ERRORS } from '../errors.js';

/** Injection token. */
export const AAS_INDEX: InjectionToken<AASIndex> = Symbol('AAS_INDEX');

export type CommandName =
    | 'GetDocumentCount'
    | 'GetEndpoints'
    | 'GetEndpointCount'
    | 'GetEndpoint'
    | 'FindEndpoint'
    | 'InsertEndpoint'
    | 'UpdateEndpoint'
    | 'DeleteEndpoint'
    | 'GetDocuments'
    | 'GetEndpointDocuments'
    | 'Update'
    | 'Insert'
    | 'Create'
    | 'Find'
    | 'Get'
    | 'Delete'
    | 'Clear'
    | 'GetSubmodelConceptDescriptionIds'
    | 'SetSubmodelConceptDescriptionIds';

export interface ChannelData {
    id: number;
    type: 'command' | 'response' | 'error';
}

export interface ChannelCommand extends ChannelData {
    type: 'command';
    name: CommandName;
    args: Record<string, unknown>;
}

export interface ChannelResponse extends ChannelData {
    type: 'response';
    name: CommandName;
    result: unknown;
}

export interface ChannelError extends ChannelData {
    type: 'error';
    message: string;
}

export function isChannelCommand(data: ChannelData): data is ChannelCommand {
    return data.type === 'command';
}

export function isChannelResponse(data: ChannelData): data is ChannelResponse {
    return data.type === 'response';
}

export function isChannelError(data: ChannelData): data is ChannelError {
    return data.type === 'error';
}

/**
 * Represents an index of Asset Administration Shells.
 */
export interface IAASIndex extends Disposable {
    /**
     * Gets the total number of AAS documents in the AAS index or an AAS endpoint with the specified name.
     *
     * @param endpoint Optional the name of the AAS endpoint.
     * @returns The number of AAS documents.
     */
    getDocumentCount(endpoint?: string): Promise<number>;

    /**
     * Gets all registered AAS endpoints.
     *
     * @returns An array of the registered AAS endpoints.
     */
    getEndpoints(): Promise<AASEndpoint[]>;

    /**
     * Gets the number of registered AAS endpoints.
     *
     * @returns The number of registered AAS endpoints.
     */
    getEndpointCount(): Promise<number>;

    /**
     * Gets the `AASEndpoint` of the endpoint with the specified name.
     *
     * @param name The name of the AAS endpoint.
     * @returns An `AASEndpoint` instance.
     */
    getEndpoint(name: string): Promise<AASEndpoint>;

    /**
     * Tries to get the `AASEndpoint` of the endpoint with the specified name.
     *
     * @param name The name of the AAS endpoint.
     * @returns An `AASEndpoint` instance or `undefined`.
     */
    findEndpoint(name: string): Promise<AASEndpoint | undefined>;

    /**
     * Inserts a new AAS endpoint.
     * @param endpoint The AAS endpoint to add.
     */
    insertEndpoint(endpoint: AASEndpoint): Promise<void>;

    /**
     * Updates the data of an existing AAS endpoint.
     *
     * @param endpoint The new AAS endpoint data.
     * @returns The old AAS endpoint data.
     */
    updateEndpoint(endpoint: AASEndpoint): Promise<AASEndpoint>;

    /**
     * Deletes an AAS endpoint with the specified name.
     *
     * @param endpoint The name of the AAS endpoint to delete.
     * @returns `true` if the AAS endpoint was successfully deleted; otherwise `false`.
     */
    deleteEndpoint(endpoint: string): Promise<boolean>;

    /**
     * Gets a page of AAS documents.
     *
     * @param cursor The cursor that specifies the page to get (first, previous, next, last).
     * @param query An optional query expression.
     * @param language Optional the language.
     */
    getDocuments(cursor: AASCursor, query?: string, language?: string): Promise<AASPagedResult>;

    /**
     * Gets the documents of the specified endpoint.
     *
     * @param endpoint The name of the AAS endpoint.
     * @param cursor The cursor to get the next page or the first page if `cursor` is `undefined`.
     * @param limit The maximum number of items in the result.
     * @returns The next page.
     */
    getEndpointDocuments(
        endpoint: string,
        cursor: string | undefined,
        limit?: number,
    ): Promise<PagedResult<AASDocument>>;

    /**
     * Updates an AAS document.
     *
     * @param document The updated AAS document.
     */
    update(document: AASDocument): Promise<void>;

    /**
     * Inserts a new AAS document.
     *
     * @param document The AAS document to insert.
     */
    insert(document: AASDocument): Promise<void>;

    /**
     *
     * @param endpoint The AAS endpoint name.
     * @param id The AAS identifier.
     * @param env The environment.
     */
    create(endpoint: string, id: string, env: aas.Environment): Promise<void>;

    /**
     * Finds and retrieves an AASDocument from the database based on the provided parameters.
     *
     * @param endpoint - The AAS endpoint name (optional).
     * @param modelType - The model type to search for ('AssetAdministrationShell' or 'Asset').
     * @param id - Depending on the `modelType` the unique identifier of the Asset Administration Shell or the Asset.
     * @returns A promise that resolves to the found `AASDocument`, or `undefined` if no document is found.
     */
    find(
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
    get(
        endpoint: string | undefined,
        modelType: 'AssetAdministrationShell' | 'Asset',
        id: string,
    ): Promise<AASDocument>;

    /**
     * Deletes the AAS with the specified identifier.
     *
     * @param endpoint Optional the name of the AAS endpoint.
     * @param id The identifier of the AAS to delete.
     */
    delete(endpoint?: string, id?: string): Promise<boolean>;

    /**
     * Clears the content of the AAS index. If an endpoint is specified only the content that belongs to that endpoint
     * will be cleaned. If an AAS identifier is specified only the content that belongs to that AAS will be cleaned.
     *
     * @param endpoint Optional the name of the AAS endpoint.
     * @param id Optional the AAS identifier.
     */
    clear(endpoint?: string, id?: string): Promise<void>;

    /**
     * Gets the available `ConceptDescription` identifiers for the specified submodel.
     * @param endpoint The name of the AAS endpoint.
     * @param id The identifier of the `Submodel`.
     * @returns A promise that resolves to an array of `ConceptDescription` identifiers.
     */
    getSubmodelConceptDescriptionIds(endpoint: string, id: string): Promise<string[]>;

    /**
     * Sets the `ConceptDescription` identifiers for the specified submodel.
     * @param endpoint The AAS endpoint name.
     * @param id The submodel identifier.
     * @param conceptDescriptionIds The array of concept description identifiers to set for the specified submodel.
     */
    setSubmodelConceptDescriptionIds(endpoint: string, id: string, conceptDescriptionIds: string[]): Promise<void>;
}

/**
 * Provides common functionality for AAS index implementations.
 */
export abstract class AASIndex implements IAASIndex {
    protected constructor(private readonly keywordDirectory: KeywordDirectory) {}

    public abstract getDocumentCount(endpoint?: string): Promise<number>;

    public abstract getEndpoints(): Promise<AASEndpoint[]>;

    public abstract getEndpointCount(): Promise<number>;

    public abstract getEndpoint(name: string): Promise<AASEndpoint>;

    public abstract findEndpoint(name: string): Promise<AASEndpoint | undefined>;

    public abstract insertEndpoint(endpoint: AASEndpoint): Promise<void>;

    public abstract updateEndpoint(endpoint: AASEndpoint): Promise<AASEndpoint>;

    public abstract deleteEndpoint(endpoint: string): Promise<boolean>;

    public abstract getDocuments(cursor: AASCursor, query?: string, language?: string): Promise<AASPagedResult>;

    public abstract getEndpointDocuments(
        endpoint: string,
        cursor: string | undefined,
        limit?: number,
    ): Promise<PagedResult<AASDocument>>;

    public abstract update(document: AASDocument): Promise<void>;

    public abstract insert(document: AASDocument): Promise<void>;

    public abstract create(endpoint: string, id: string, env: aas.Environment): Promise<void>;

    public abstract find(
        endpoint: string | undefined,
        modelType: 'AssetAdministrationShell' | 'Asset',
        id: string,
    ): Promise<AASDocument | undefined>;

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

    public abstract delete(endpoint?: string, id?: string): Promise<boolean>;

    public abstract clear(endpoint?: string, id?: string): Promise<void>;

    public abstract getSubmodelConceptDescriptionIds(endpoint: string, id: string): Promise<string[]>;

    public abstract setSubmodelConceptDescriptionIds(
        endpoint: string,
        id: string,
        conceptDescriptionIds: string[],
    ): Promise<void>;

    /**
     * Destroys the AAS index.
     * @returns A promise that resolves when the index is destroyed.
     */
    public abstract dispose(): Promise<void> | void;

    protected toAbbreviation(referable: aas.Referable): string {
        return getAbbreviation(referable.modelType)!.toLowerCase();
    }

    protected toDocumentId(document: AASDocument): AASDocumentId {
        return { endpoint: document.endpoint, id: document.id };
    }

    protected preprocessString(value: string | aas.LangString[] | undefined, max: number = 512): string | undefined {
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
