/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { AASDocument, AASContainer, AASWorkspace, aas } from 'common';

export function createContainer(url: string, documents: AASDocument[]): AASContainer {
    return {
        documents: documents,
        url: url,
        name: url,
        type: 'AasxDirectory'
    };
}

export function createWorkspace(name: string, containers: AASContainer[]): AASWorkspace {
    return {
        name: name,
        containers: containers,
    };
}

export function createDocument(name: string, url = 'http://localhost/container1'): AASDocument {
    const document: AASDocument = {
        id: `http://localhost/aas/${name}`,
        idShort: name,
        endpoint: { url, name, type: 'AasxServer', version: '3.0' },
        address: '',
        modified: false,
        readonly: false,
        onlineReady: false,
        content: { assetAdministrationShells: [], submodels: [], conceptDescriptions: [] },
    };

    return document;
}

export function createDocumentHeader(name: string, url: string): AASDocument {
    const document: AASDocument = {
        id: `http://localhost/aas/${name}`,
        idShort: name,
        endpoint: { url, name, type: 'AasxServer', version: '3.0' },
        address: '',
        modified: false,
        readonly: false,
        onlineReady: false,
        content: null,
    };

    return document;
}

export function createContent(): aas.Environment {
    return { assetAdministrationShells: [], submodels: [], conceptDescriptions: [] };
}