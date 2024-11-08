/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import {
    AASCursor,
    AASDocument,
    AASEndpoint,
    AASPagedResult,
    aas,
    baseType,
    getAbbreviation,
    isProperty,
    parseDate,
    parseNumber,
    toBoolean,
} from 'aas-core';

import { PagedResult } from '../types/paged-result.js';
import { KeywordDirectory } from './keyword-directory.js';
import { LangString } from '../types/aas-v2.js';

/** Represents an index of Asset Administration Shells. */
export abstract class AASIndex {
    protected constructor(private readonly keywordDirectory: KeywordDirectory) {}

    public abstract getCount(endpoint?: string): Promise<number>;

    public abstract getEndpoints(): Promise<AASEndpoint[]>;

    public abstract getEndpointCount(): Promise<number>;

    public abstract getEndpoint(name: string): Promise<AASEndpoint>;

    public abstract hasEndpoint(name: string): Promise<boolean>;

    public abstract addEndpoint(endpoint: AASEndpoint): Promise<void>;

    public abstract updateEndpoint(endpoint: AASEndpoint): Promise<void>;

    public abstract removeEndpoint(endpointName: string): Promise<boolean>;

    public abstract getDocuments(cursor: AASCursor, query?: string, language?: string): Promise<AASPagedResult>;

    public abstract nextPage(
        endpointName: string,
        cursor: string | undefined,
        limit?: number,
    ): Promise<PagedResult<AASDocument>>;

    public abstract update(document: AASDocument): Promise<void>;

    public abstract add(document: AASDocument): Promise<void>;

    public abstract find(endpointName: string | undefined, id: string): Promise<AASDocument | undefined>;

    public async get(endpoint: string | undefined, id: string): Promise<AASDocument> {
        const document = await this.find(endpoint, id);
        if (!document) {
            throw new Error(`An AAS with the identifier ${id} does not exist.`);
        }

        return document;
    }

    public abstract remove(endpoint?: string, id?: string): Promise<boolean>;

    public abstract clear(): Promise<void>;

    public abstract reset(): Promise<void>;

    protected toAbbreviation(referable: aas.Referable): string {
        return getAbbreviation(referable.modelType)!.toLowerCase();
    }

    protected toStringValue(referable: aas.Referable, max: number = 512): string | undefined {
        switch (referable.modelType) {
            case 'Property': {
                const property = referable as aas.Property;
                if (baseType(property.valueType) === 'string') {
                    return this.preprocessString(property.value, max);
                }

                return undefined;
            }
            case 'MultiLanguageProperty':
                return this.preprocessString((referable as aas.MultiLanguageProperty).value);
            case 'File':
                return (referable as aas.File).value;
            case 'Blob':
                return (referable as aas.Blob).contentType;
            case 'Range':
            case 'ReferenceElement':
            default:
                return undefined;
        }
    }

    protected toNumberValue(referable: aas.Referable): number | undefined {
        if (!isProperty(referable) || !referable.value || baseType(referable.valueType) !== 'number') {
            return undefined;
        }

        const value = parseNumber(referable.value);
        if (Number.isNaN(value)) {
            return undefined;
        }

        return value;
    }

    protected toDateValue(referable: aas.Referable): Date | undefined {
        if (!isProperty(referable) || !referable.value || baseType(referable.valueType) !== 'Date') {
            return undefined;
        }

        return parseDate(referable.value);
    }

    protected toBooleanValue(referable: aas.Referable): boolean | undefined {
        if (!isProperty(referable) || !referable.value || baseType(referable.valueType) !== 'boolean') {
            return undefined;
        }

        return toBoolean(referable.value);
    }

    protected toBigintValue(referable: aas.Referable): bigint | undefined {
        if (!isProperty(referable) || !referable.value || baseType(referable.valueType) !== 'bigint') {
            return undefined;
        }

        return BigInt(referable.value);
    }

    private preprocessString(value: string | LangString[] | undefined, max: number = 512): string | undefined {
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
