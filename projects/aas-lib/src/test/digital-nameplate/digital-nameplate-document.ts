/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { AASDocument } from 'aas-core';

const data: object = {
    id: 'AssetAdministrationShell---2CEBD072',
    container: 'C:\\Git\\AASPortal\\data\\endpoints\\samples',
    endpoint: {
        type: 'file',
        address: 'IDTA 02006-2-0_Sample Digital Nameplate.aasx',
    },
    idShort: 'AssetAdministrationShell---2CEBD072',
    timeStamp: 1677429431327,
    readonly: true,
    modified: false,
    onlineReady: false,
    content: {
        assetAdministrationShells: [],
        submodels: [
            {
                idShort: 'Nameplate',
                modelType: 'Submodel',
                id: 'www.example.com/ids/sm/1225_9020_5022_1974',
                kind: 'Instance',
                semanticId: {
                    type: 'ModelReference',
                    keys: [
                        {
                            type: 'Submodel',
                            value: 'https://admin-shell.io/zvei/nameplate/2/0/Nameplate',
                        },
                    ],
                },
                submodelElements: [
                    {
                        idShort: 'ManufacturerName',
                        modelType: 'MultiLanguageProperty',
                        parent: {
                            type: 'ModelReference',
                            keys: [
                                {
                                    type: 'Submodel',
                                    value: 'www.example.com/ids/sm/1225_9020_5022_1974',
                                },
                            ],
                        },
                        kind: 'Instance',
                        value: [
                            {
                                language: 'de',
                                text: 'Muster AG',
                            },
                        ],
                    },
                ],
            },
        ],
        conceptDescriptions: [],
    },
};

export const nameplate = data as AASDocument;
