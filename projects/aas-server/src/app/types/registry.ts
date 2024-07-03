/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Endpoint } from 'aas-core';
import * as aasv2 from './aas-v2.js';

export interface AASRegistryModelType {
    name: 'AssetAdministrationShellDescriptor' | 'Asset';
}

/** The self-describing information of a network resource. */
export interface AASRegistryDescriptor {
    endpoints: Endpoint[];
}

/** Descriptor of a Submodel. */
export interface SubmodelDescriptor extends AASRegistryDescriptor {
    identification: aasv2.Identifier;
    idShort: string;
}

/** Descriptor of an Asset. */
export interface AssetDescriptor extends AASRegistryDescriptor {
    modelType: AASRegistryModelType;
    identification: aasv2.Identifier;
    idShort: string;
}

/** Descriptor of an Asset Administration Shell */
export interface AssetAdministrationShellDescriptor extends AASRegistryDescriptor {
    modelType: AASRegistryModelType;
    identification: aasv2.Identifier;
    idShort: string;
    asset: AssetDescriptor;
    submodels: SubmodelDescriptor[];
}
