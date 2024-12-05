/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { AASDocument, aas } from 'aas-core';

export function createDocument(name: string, endpoint= "http://localhost/container1"): AASDocument {
    const document: AASDocument = {
        id: `http://localhost/aas/${name}`,
        idShort: name,
        assetId: 'http://localhost/asset/${name}',
        endpoint: endpoint,
        address: '',
        modified: false,
        readonly: false,
        onlineReady: false,
        content: { assetAdministrationShells: [], submodels: [], conceptDescriptions: [] },
        timestamp: 123456,
        crc32: 0,
    };

    return document;
}

export function createDocumentHeader(name: string, endpoint: string): AASDocument {
    const document: AASDocument = {
        id: `http://localhost/aas/${name}`,
        idShort: name,
        assetId: 'http://localhost/asset/${name}',
        endpoint: endpoint,
        address: '',
        modified: false,
        readonly: false,
        onlineReady: false,
        content: null,
        timestamp: 123456,
        crc32: 0,
    };

    return document;
}

export function createContent(): aas.Environment {
    return { assetAdministrationShells: [], submodels: [], conceptDescriptions: [] };
}