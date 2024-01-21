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
    AASPage,
    aas,
    baseType,
    getAbbreviation,
    isProperty,
    parseDate,
    parseNumber,
    toBoolean,
} from 'common';

export abstract class AASIndex {
    public abstract getEndpoints(): Promise<AASEndpoint[]>;

    public abstract getEndpoint(name: string): Promise<AASEndpoint>;

    public abstract addEndpoint(endpoint: AASEndpoint): Promise<void>;

    public abstract removeEndpoint(name: string): Promise<boolean>;

    public abstract getDocuments(cursor: AASCursor, query?: string, language?: string): Promise<AASPage>;

    public abstract getContainerDocuments(endpointName: string): Promise<AASDocument[]>;

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

    public abstract reset(): Promise<void>;

    protected toAbbreviation(referable: aas.Referable): string {
        return getAbbreviation(referable.modelType)!.toLowerCase();
    }

    protected toStringValue(referable: aas.Referable): string | undefined {
        switch (referable.modelType) {
            case 'Property': {
                const property = referable as aas.Property;
                if (baseType(property.valueType) === 'string') {
                    return property.value;
                }

                return undefined;
            }
            case 'MultiLanguageProperty':
                return (referable as aas.MultiLanguageProperty).value?.map(item => item.text).join(' ');
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
        if (isProperty(referable) && referable.value && baseType(referable.valueType) === 'number') {
            return parseNumber(referable.value);
        }

        return undefined;
    }

    protected toDateValue(referable: aas.Referable): Date | undefined {
        if (isProperty(referable) && referable.value && baseType(referable.valueType) === 'Date') {
            return parseDate(referable.value);
        }

        return undefined;
    }

    protected toBooleanValue(referable: aas.Referable): boolean | undefined {
        if (isProperty(referable) && referable.value && baseType(referable.valueType) === 'boolean') {
            return toBoolean(referable.value);
        }

        return undefined;
    }

    protected toBigintValue(referable: aas.Referable): bigint | undefined {
        if (isProperty(referable) && referable.value && baseType(referable.valueType) === 'bigint') {
            return BigInt(referable.value);
        }

        return undefined;
    }
}