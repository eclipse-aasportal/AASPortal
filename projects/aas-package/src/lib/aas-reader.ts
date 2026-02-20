/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { aas } from 'aas-core';

/**
 * Represents an Asset Administration Shell reader.
 */
export abstract class AASReader {
    protected constructor(protected readonly createPath: boolean = false) {}

    /**
     * Reads an AAS environment from a data source.
     */
    public abstract readEnvironment(): aas.Environment;

    /**
     * Reads an `Referable` from the specified data.
     * @param data The data.
     */
    public abstract read(data: string | object): aas.Referable;
}
