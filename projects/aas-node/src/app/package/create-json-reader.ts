/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { aas } from 'aas-core';
import { AASReader } from './aas-reader.js';
import { JsonReaderV2 } from './json-reader-v2.js';
import { JsonReaderV3 } from './json-reader-v3.js';
import * as aasV2 from '../types/aas-v2.js';

export function createJsonReader(data: object): AASReader {
    if (isAssetAdministrationShellEnvironment(data)) {
        return new JsonReaderV2(data);
    }

    if (isEnvironment(data)) {
        return new JsonReaderV3(data);
    }

    if (isSubmodelElement(data)) {
        return new JsonReaderV3();
    }

    if (isSubmodelElementV2(data)) {
        return new JsonReaderV2();
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
