/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { aas, isIdentifiable } from 'aas-core';

/**
 * Represents an Asset Administration Shell reader.
 */
export abstract class AASReader {
    protected constructor(protected readonly createReferenceToParent: boolean = false) {}

    /**
     * Reads an AAS environment from a data source.
     */
    public abstract readEnvironment(): aas.Environment;

    /**
     * Reads an `Referable` from the specified data.
     * @param data The data.
     */
    public abstract read(data: string | object): aas.Referable;

    /**
     * Creates a reference to a parent element based on a list of ancestor elements.
     *
     * @param ancestors - An array of Referable objects representing the ancestor hierarchy
     * @returns A Reference object containing keys that identify the path to the parent
     *          through the ancestor hierarchy. Each key contains either the id (for Identifiable elements)
     *          or idShort (for non-Identifiable elements) of the corresponding ancestor.
     */
    protected createParentReference(ancestors: aas.Referable[]): aas.Reference {
        return {
            type: 'ModelReference',
            keys: ancestors.map(ancestor => {
                if (isIdentifiable(ancestor)) {
                    return {
                        type: ancestor.modelType,
                        value: ancestor.id,
                    } as aas.Key;
                } else {
                    return {
                        type: ancestor.modelType,
                        value: ancestor.idShort,
                    } as aas.Key;
                }
            }),
        };
    }
}
