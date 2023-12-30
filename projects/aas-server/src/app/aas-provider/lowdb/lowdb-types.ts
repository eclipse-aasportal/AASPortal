/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { AASDocument, AASEndpoint } from 'common';

export type LowDbElementValueType = 'string' | 'boolean' | 'number' | 'Date' | 'bigint';

export interface LowDbElement {
    uuid: string;
    modelType: string;
    idShort: string;
    value?: string;
    valueType?: LowDbElementValueType;
}

export interface LowDbDocument extends AASDocument {
    uuid: string;
}

export interface LowDbData {
    endpoints: AASEndpoint[];
    documents: LowDbDocument[];
    elements: LowDbElement[];
}