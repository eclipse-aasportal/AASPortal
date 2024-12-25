/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { AASDocument, AASEndpoint } from 'aas-core';

export type LowDbElementValueType = 'string' | 'boolean' | 'number' | 'Date' | 'bigint';

export type LowDbElement = {
    uuid: string;
    modelType: string;
    id?: string;
    idShort: string;
    value?: string;
    valueType?: LowDbElementValueType;
};

export interface LowDbDocument extends AASDocument {
    uuid: string;
}

export type LowDbData = {
    endpoints: AASEndpoint[];
    documents: LowDbDocument[];
    elements: LowDbElement[];
};
