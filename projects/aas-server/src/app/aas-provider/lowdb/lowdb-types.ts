/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import {
    AASDocument,
    aas,
    AASEndpoint
} from 'common';

export interface LowDbElement {
    documentId: string;
    modelType: aas.ModelType;
    idShort: string;
    value?: string;
    valueType?: aas.DataTypeDefXsd;
}

export interface LowDbDocument extends AASDocument {
    uuid: string;
}

export interface LowDbData {
    endpoints: AASEndpoint[];
    documents: LowDbDocument[];
    elements: LowDbElement[];
}