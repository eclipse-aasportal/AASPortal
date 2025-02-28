/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import * as aas from '../../lib/aas.js';

const data: unknown = {
    assetAdministrationShells: [
        {
            idShort: 'ExampleMotor',
            modelType: 'AssetAdministrationShell',
            category: 'CONSTANT',
            id: 'http://customer.com/aas/9175_7013_7091_9168',
            assetInformation: {
                assetKind: 'Instance',
                globalAssetId: {
                    type: 'ModelReference',
                    keys: [
                        {
                            type: 'GlobalReference',
                            value: 'http://customer.com/assets/KHBVZJSQKIY',
                        },
                    ],
                },
            },
            submodels: [
                {
                    type: 'ModelReference',
                    keys: [
                        {
                            type: 'Submodel',
                            value: 'http://i40.customer.com/type/1/1/F13E8576F6488342',
                        },
                    ],
                },
                {
                    type: 'ModelReference',
                    keys: [
                        {
                            type: 'Submodel',
                            value: 'http.//i40.customer.com/type/1/1/7A7104BDAB57E184',
                        },
                    ],
                },
                {
                    type: 'ModelReference',
                    keys: [
                        {
                            type: 'Submodel',
                            value: 'http://i40.customer.com/instance/1/1/AC69B1CB44F07935',
                        },
                    ],
                },
                {
                    type: 'ModelReference',
                    keys: [
                        {
                            type: 'Submodel',
                            value: 'http://i40.customer.com/type/1/1/1A7B62B529F19152',
                        },
                    ],
                },
            ],
        },
    ],
    submodels: [
        {
            idShort: 'Identification',
            modelType: 'Submodel',
            category: 'CONSTANT',
            descriptions: [
                {
                    language: 'EN',
                    text: 'Identification from Manufacturer',
                },
            ],
            id: 'http://i40.customer.com/type/1/1/F13E8576F6488342',
            semanticId: {
                type: 'ExternalReference',
                keys: [
                    {
                        type: 'GlobalReference',
                        value: '0173-1#01-ADN198#009',
                    },
                ],
            },
            qualifiers: [],
            kind: 'Instance',
            submodelElements: [
                {
                    idShort: 'Manufacturer',
                    modelType: 'Property',
                    parent: {
                        type: 'ModelReference',
                        keys: [
                            {
                                type: 'Submodel',
                                value: 'http://i40.customer.com/type/1/1/F13E8576F6488342',
                            },
                        ],
                    },
                    category: 'CONSTANT',
                    semanticId: {
                        type: 'ExternalReference',
                        keys: [
                            {
                                type: 'GlobalReference',
                                value: '0173-1#02-AAO677#002',
                            },
                        ],
                    },
                    kind: 'Instance',
                    valueType: 'xs:string',
                    value: 'CUSTOMER GmbH',
                },
                {
                    idShort: 'GLN',
                    modelType: 'Property',
                    parent: {
                        type: 'ModelReference',
                        keys: [
                            {
                                type: 'Submodel',
                                value: 'http://i40.customer.com/type/1/1/F13E8576F6488342',
                            },
                        ],
                    },
                    category: 'CONSTANT',
                    semanticId: {
                        type: 'ExternalReference',
                        keys: [
                            {
                                type: 'GlobalReference',
                                value: '0173-1#02-AAY812#001',
                            },
                        ],
                    },
                    kind: 'Instance',
                    valueType: 'xs:integer',
                    value: '10101010',
                },
                {
                    idShort: 'ProductDesignation',
                    modelType: 'Property',
                    parent: {
                        type: 'ModelReference',
                        keys: [
                            {
                                type: 'Submodel',
                                value: 'http://i40.customer.com/type/1/1/F13E8576F6488342',
                            },
                        ],
                    },
                    category: 'CONSTANT',
                    semanticId: {
                        type: 'ExternalReference',
                        keys: [
                            {
                                type: 'GlobalReference',
                                value: '0173-1#02-AAW338#001',
                            },
                        ],
                    },
                    kind: 'Instance',
                    valueType: 'langString',
                    value: 'I40 Capable Servo Motor (EN)',
                },
                {
                    idShort: 'SerialNumber',
                    modelType: 'Property',
                    parent: {
                        type: 'ModelReference',
                        keys: [
                            {
                                type: 'Submodel',
                                value: 'http://i40.customer.com/type/1/1/F13E8576F6488342',
                            },
                        ],
                    },
                    category: 'CONSTANT',
                    semanticId: {
                        type: 'ExternalReference',
                        keys: [
                            {
                                type: 'GlobalReference',
                                value: '0173-1#02-AAM556#002',
                            },
                        ],
                    },
                    kind: 'Instance',
                    valueType: 'xs:string',
                    value: 'P12345678I40',
                },
            ],
        },
        {
            idShort: 'TechnicalData',
            modelType: 'Submodel',
            category: 'CONSTANT',
            id: 'http.//i40.customer.com/type/1/1/7A7104BDAB57E184',
            semanticId: {
                type: 'ExternalReference',
                keys: [
                    {
                        type: 'GlobalReference',
                        value: '0173-1#01-AFZ615#016',
                    },
                ],
            },
            qualifiers: [],
            kind: 'Instance',
            submodelElements: [
                {
                    idShort: 'MaxRotationSpeed',
                    modelType: 'Property',
                    parent: {
                        type: 'ModelReference',
                        keys: [
                            {
                                type: 'Submodel',
                                value: 'http.//i40.customer.com/type/1/1/7A7104BDAB57E184',
                            },
                        ],
                    },
                    category: 'PARAMETER',
                    semanticId: {
                        type: 'ModelReference',
                        keys: [
                            {
                                type: 'ConceptDescription',
                                value: '0173-1#02-BAA120#008',
                            },
                        ],
                    },
                    kind: 'Instance',
                    valueType: 'xs:integer',
                    value: '5000',
                },
                {
                    idShort: 'MaxTorque',
                    modelType: 'Property',
                    parent: {
                        type: 'ModelReference',
                        keys: [
                            {
                                type: 'Submodel',
                                value: 'http.//i40.customer.com/type/1/1/7A7104BDAB57E184',
                            },
                        ],
                    },
                    category: 'PARAMETER',
                    semanticId: {
                        type: 'ModelReference',
                        keys: [
                            {
                                type: 'ConceptDescription',
                                value: '0173-1#02-BAE098#004',
                            },
                        ],
                    },
                    kind: 'Instance',
                    valueType: 'xs:float',
                    value: '200',
                },
                {
                    idShort: 'CoolingType',
                    modelType: 'Property',
                    parent: {
                        type: 'ModelReference',
                        keys: [
                            {
                                type: 'Submodel',
                                value: 'http.//i40.customer.com/type/1/1/7A7104BDAB57E184',
                            },
                        ],
                    },
                    category: 'PARAMETER',
                    descriptions: [
                        {
                            language: 'EN',
                            text: 'open circuit, external cooling',
                        },
                    ],
                    semanticId: {
                        type: 'ModelReference',
                        keys: [
                            {
                                type: 'ConceptDescription',
                                value: '0173-1#02-BAE122#006',
                            },
                        ],
                    },
                    kind: 'Instance',
                    valueType: 'xs:string',
                    value: 'BAB657',
                },
            ],
        },
        {
            idShort: 'Documentation',
            modelType: 'Submodel',
            category: 'CONSTANT',
            id: 'http://i40.customer.com/type/1/1/1A7B62B529F19152',
            semanticId: {
                type: 'ModelReference',
                keys: [],
            },
            qualifiers: [],
            kind: 'Instance',
            submodelElements: [
                {
                    idShort: 'OperatingManual',
                    modelType: 'SubmodelElementCollection',
                    parent: {
                        type: 'ModelReference',
                        keys: [
                            {
                                type: 'Submodel',
                                value: 'http://i40.customer.com/type/1/1/1A7B62B529F19152',
                            },
                        ],
                    },
                    semanticId: {
                        type: 'ModelReference',
                        keys: [
                            {
                                type: 'ConceptDescription',
                                value: 'www.vdi2770.com/blatt1/Entwurf/Okt18/cd/Document',
                            },
                        ],
                    },
                    kind: 'Instance',
                    value: [
                        {
                            idShort: 'DocumentId',
                            modelType: 'Property',
                            parent: {
                                type: 'ModelReference',
                                keys: [
                                    {
                                        type: 'Submodel',
                                        value: 'http://i40.customer.com/type/1/1/1A7B62B529F19152',
                                    },
                                    {
                                        type: 'SubmodelElementCollection',
                                        value: 'OperatingManual',
                                    },
                                ],
                            },
                            category: 'CONSTANT',
                            semanticId: {
                                type: 'ModelReference',
                                keys: [
                                    {
                                        type: 'ConceptDescription',
                                        value: 'www.vdi2770.com/blatt1/Entwurf/Okt18/cd/DocumentId/Val',
                                    },
                                ],
                            },
                            kind: 'Instance',
                            valueType: 'xs:string',
                            value: '3 608 870 A47',
                        },
                        {
                            idShort: 'DocumentClassId',
                            modelType: 'Property',
                            parent: {
                                type: 'ModelReference',
                                keys: [
                                    {
                                        type: 'Submodel',
                                        value: 'http://i40.customer.com/type/1/1/1A7B62B529F19152',
                                    },
                                    {
                                        type: 'SubmodelElementCollection',
                                        value: 'OperatingManual',
                                    },
                                ],
                            },
                            semanticId: {
                                type: 'ModelReference',
                                keys: [
                                    {
                                        type: 'ConceptDescription',
                                        value: 'www.vdi2770.com/blatt1/Entwurf/Okt18/cd/DocumentClassification/ClassId',
                                    },
                                ],
                            },
                            kind: 'Instance',
                            valueType: 'xs:string',
                            value: '03-02',
                            nodeId: 'aHR0cDovL2k0MC5jdXN0b21lci5jb20vdHlwZS8xLzEvMUE3QjYyQjUyOUYxOTE1Mg.Documentation/OperatingManual/DocumentClassId',
                        },
                        {
                            idShort: 'DocumentClassName',
                            modelType: 'Property',
                            parent: {
                                type: 'ModelReference',
                                keys: [
                                    {
                                        type: 'Submodel',
                                        value: 'http://i40.customer.com/type/1/1/1A7B62B529F19152',
                                    },
                                    {
                                        type: 'SubmodelElementCollection',
                                        value: 'OperatingManual',
                                    },
                                ],
                            },
                            semanticId: {
                                type: 'ModelReference',
                                keys: [
                                    {
                                        type: 'ConceptDescription',
                                        value: 'www.vdi2770.com/blatt1/Entwurf/Okt18/cd/DocumentClassification/ClassName',
                                    },
                                ],
                            },
                            kind: 'Instance',
                            valueType: 'langString',
                            value: 'Operation (EN) Bedienung (DE)',
                            nodeId: 'aHR0cDovL2k0MC5jdXN0b21lci5jb20vdHlwZS8xLzEvMUE3QjYyQjUyOUYxOTE1Mg.Documentation/OperatingManual/DocumentClassName',
                        },
                        {
                            idShort: 'DocumentClassificationSystem',
                            modelType: 'Property',
                            parent: {
                                type: 'ModelReference',
                                keys: [
                                    {
                                        type: 'Submodel',
                                        value: 'http://i40.customer.com/type/1/1/1A7B62B529F19152',
                                    },
                                    {
                                        type: 'SubmodelElementCollection',
                                        value: 'OperatingManual',
                                    },
                                ],
                            },
                            semanticId: {
                                type: 'ModelReference',
                                keys: [
                                    {
                                        type: 'ConceptDescription',
                                        value: 'www.vdi2770.com/blatt1/Entwurf/Okt18/cd/DocumentClassification/ClassificationSystem',
                                    },
                                ],
                            },
                            kind: 'Instance',
                            valueType: 'xs:string',
                            value: 'VDI2770:2018',
                            nodeId: 'aHR0cDovL2k0MC5jdXN0b21lci5jb20vdHlwZS8xLzEvMUE3QjYyQjUyOUYxOTE1Mg.Documentation/OperatingManual/DocumentClassificationSystem',
                        },
                        {
                            idShort: 'OrganizationName',
                            modelType: 'Property',
                            parent: {
                                type: 'ModelReference',
                                keys: [
                                    {
                                        type: 'Submodel',
                                        value: 'http://i40.customer.com/type/1/1/1A7B62B529F19152',
                                    },
                                    {
                                        type: 'SubmodelElementCollection',
                                        value: 'OperatingManual',
                                    },
                                ],
                            },
                            semanticId: {
                                type: 'ModelReference',
                                keys: [
                                    {
                                        type: 'ConceptDescription',
                                        value: 'www.vdi2770.com/blatt1/Entwurf/Okt18/cd/Organization/OrganizationName',
                                    },
                                ],
                            },
                            kind: 'Instance',
                            valueType: 'xs:string',
                            value: 'CUSTOMER',
                            nodeId: 'aHR0cDovL2k0MC5jdXN0b21lci5jb20vdHlwZS8xLzEvMUE3QjYyQjUyOUYxOTE1Mg.Documentation/OperatingManual/OrganizationName',
                        },
                        {
                            idShort: 'OrganizationOfficialName',
                            modelType: 'Property',
                            parent: {
                                type: 'ModelReference',
                                keys: [
                                    {
                                        type: 'Submodel',
                                        value: 'http://i40.customer.com/type/1/1/1A7B62B529F19152',
                                    },
                                    {
                                        type: 'SubmodelElementCollection',
                                        value: 'OperatingManual',
                                    },
                                ],
                            },
                            semanticId: {
                                type: 'ModelReference',
                                keys: [
                                    {
                                        type: 'ConceptDescription',
                                        value: 'www.vdi2770.com/blatt1/Entwurf/Okt18/cd/Organization/OrganizationOfficialName',
                                    },
                                ],
                            },
                            kind: 'Instance',
                            valueType: 'xs:string',
                            value: 'CUSTOMER GmbH',
                            nodeId: 'aHR0cDovL2k0MC5jdXN0b21lci5jb20vdHlwZS8xLzEvMUE3QjYyQjUyOUYxOTE1Mg.Documentation/OperatingManual/OrganizationOfficialName',
                        },
                        {
                            idShort: 'Title',
                            modelType: 'Property',
                            parent: {
                                type: 'ModelReference',
                                keys: [
                                    {
                                        type: 'Submodel',
                                        value: 'http://i40.customer.com/type/1/1/1A7B62B529F19152',
                                    },
                                    {
                                        type: 'SubmodelElementCollection',
                                        value: 'OperatingManual',
                                    },
                                ],
                            },
                            semanticId: {
                                type: 'ModelReference',
                                keys: [
                                    {
                                        type: 'ConceptDescription',
                                        value: 'www.vdi2770.com/blatt1/Entwurf/Okt18/cd/Description/Title',
                                    },
                                ],
                            },
                            kind: 'Instance',
                            valueType: 'langString',
                            value: 'Operating Manual Servo Motor',
                            nodeId: 'aHR0cDovL2k0MC5jdXN0b21lci5jb20vdHlwZS8xLzEvMUE3QjYyQjUyOUYxOTE1Mg.Documentation/OperatingManual/Title',
                        },
                        {
                            idShort: 'Language',
                            modelType: 'Property',
                            parent: {
                                type: 'ModelReference',
                                keys: [
                                    {
                                        type: 'Submodel',
                                        value: 'http://i40.customer.com/type/1/1/1A7B62B529F19152',
                                    },
                                    {
                                        type: 'SubmodelElementCollection',
                                        value: 'OperatingManual',
                                    },
                                ],
                            },
                            semanticId: {
                                type: 'ModelReference',
                                keys: [
                                    {
                                        type: 'ConceptDescription',
                                        value: 'www.vdi2770.com/blatt1/Entwurf/Okt18/cd/DocumentVersion/Language',
                                    },
                                ],
                            },
                            kind: 'Instance',
                            valueType: 'xs:string',
                            value: 'en-US',
                            nodeId: 'aHR0cDovL2k0MC5jdXN0b21lci5jb20vdHlwZS8xLzEvMUE3QjYyQjUyOUYxOTE1Mg.Documentation/OperatingManual/Language',
                        },
                        {
                            idShort: 'DigitalFile_PDF',
                            modelType: 'File',
                            parent: {
                                type: 'ModelReference',
                                keys: [
                                    {
                                        type: 'Submodel',
                                        value: 'http://i40.customer.com/type/1/1/1A7B62B529F19152',
                                    },
                                    {
                                        type: 'SubmodelElementCollection',
                                        value: 'OperatingManual',
                                    },
                                ],
                            },
                            category: 'PARAMETER',
                            semanticId: {
                                type: 'ModelReference',
                                keys: [
                                    {
                                        type: 'ConceptDescription',
                                        value: 'www.vdi2770.com/blatt1/Entwurf/Okt18/cd/StoredDocumentRepresentation/DigitalFile',
                                    },
                                ],
                            },
                            kind: 'Instance',
                            contentType: 'application/pdf',
                            value: '/aasx/OperatingManual.pdf',
                        },
                    ],
                },
            ],
        },
        {
            idShort: 'OperationalData',
            modelType: 'Submodel',
            category: 'VARIABLE',
            id: 'http://i40.customer.com/instance/1/1/AC69B1CB44F07935',
            semanticId: {
                type: 'ExternalReference',
                keys: [
                    {
                        type: 'GlobalReference',
                        value: '0173-1#01-AFZ615#016',
                    },
                ],
            },
            qualifiers: [],
            kind: 'Instance',
            submodelElements: [
                {
                    idShort: 'RotationSpeed',
                    modelType: 'Property',
                    parent: {
                        type: 'ModelReference',
                        keys: [
                            {
                                type: 'Submodel',
                                value: 'http://i40.customer.com/instance/1/1/AC69B1CB44F07935',
                            },
                        ],
                    },
                    category: 'VARIABLE',
                    semanticId: {
                        type: 'ModelReference',
                        keys: [
                            {
                                type: 'ConceptDescription',
                                value: 'http://customer.com/cd//1/1/18EBD56F6B43D895',
                            },
                        ],
                    },
                    kind: 'Instance',
                    valueType: 'xs:integer',
                    value: '4370',
                    nodeId: 'aHR0cDovL2k0MC5jdXN0b21lci5jb20vaW5zdGFuY2UvMS8xL0FDNjlCMUNCNDRGMDc5MzU.OperationalData/RotationSpeed',
                },
                {
                    idShort: 'Torque',
                    modelType: 'Property',
                    parent: {
                        type: 'ModelReference',
                        keys: [
                            {
                                type: 'Submodel',
                                value: 'http://i40.customer.com/instance/1/1/AC69B1CB44F07935',
                            },
                        ],
                    },
                    category: 'VARIABLE',
                    semanticId: {
                        type: 'ModelReference',
                        keys: [
                            {
                                type: 'ConceptDescription',
                                value: 'http://customer.com/cd//1/1/18EBD56F6B43D896',
                            },
                        ],
                    },
                    kind: 'Instance',
                    valueType: 'xs:float',
                    value: '117.4',
                    nodeId: 'aHR0cDovL2k0MC5jdXN0b21lci5jb20vaW5zdGFuY2UvMS8xL0FDNjlCMUNCNDRGMDc5MzU.OperationalData/Torque',
                },
            ],
        },
    ],
    conceptDescriptions: [
        {
            idShort: 'Document',
            modelType: 'ConceptDescription',
            descriptions: [],
            id: 'www.vdi2770.com/blatt1/Entwurf/Okt18/cd/Document',
            embeddedDataSpecifications: [
                {
                    dataSpecification: {
                        type: 'ExternalReference',
                        keys: [
                            {
                                type: 'GlobalReference',
                                value: 'http://admin-shell.io/DataSpecificationTemplates/DataSpecificationIEC61360',
                            },
                        ],
                    },
                    dataSpecificationContent: {
                        modelType: 'DataSpecificationIec61360',
                        preferredName: [],
                        dataType: 'ENTITY',
                        definition: [
                            {
                                language: 'DE',
                                text: 'Feste und geordnete Menge von für die Verwendung durch Personen bestimmte Informationen, die verwaltet und als Einheit zwischen Benutzern und System ausgetauscht werden kann.',
                            },
                        ],
                        shortName: [
                            {
                                language: 'EN?',
                                text: 'Document',
                            },
                        ],
                        sourceOfDefinition: '[ISO 15519-1:2010]',
                    },
                },
            ],
        },
        {
            idShort: 'DocumentIdValue',
            modelType: 'ConceptDescription',
            category: 'CONSTANT',
            id: 'www.vdi2770.com/blatt1/Entwurf/Okt18/cd/DocumentId/Val',
            embeddedDataSpecifications: [
                {
                    dataSpecification: {
                        type: 'ExternalReference',
                        keys: [
                            {
                                type: 'GlobalReference',
                                value: 'http://admin-shell.io/DataSpecificationTemplates/DataSpecificationIEC61360',
                            },
                        ],
                    },
                    dataSpecificationContent: {
                        modelType: 'DataSpecificationIec61360',
                        preferredName: [],
                        dataType: 'STRING',
                        definition: [
                            {
                                language: 'DE',
                                text: 'die eigentliche Identifikationsnummer',
                            },
                        ],
                        shortName: [
                            {
                                language: 'EN?',
                                text: 'DocumentId',
                            },
                        ],
                    },
                },
            ],
        },
        {
            idShort: 'DocumentClassId',
            modelType: 'ConceptDescription',
            id: 'www.vdi2770.com/blatt1/Entwurf/Okt18/cd/DocumentClassification/ClassId',
            embeddedDataSpecifications: [
                {
                    dataSpecification: {
                        type: 'ExternalReference',
                        keys: [
                            {
                                type: 'GlobalReference',
                                value: 'http://admin-shell.io/DataSpecificationTemplates/DataSpecificationIEC61360',
                            },
                        ],
                    },
                    dataSpecificationContent: {
                        modelType: 'DataSpecificationIec61360',
                        preferredName: [],
                        dataType: 'STRING',
                        definition: [
                            {
                                language: 'DE',
                                text: 'Eindeutige ID der Klasse in einer Klassifikation.',
                            },
                        ],
                        shortName: [
                            {
                                language: 'EN?',
                                text: 'DocumentClassId',
                            },
                        ],
                    },
                },
            ],
        },
        {
            idShort: 'DocumentClassName',
            modelType: 'ConceptDescription',
            id: 'www.vdi2770.com/blatt1/Entwurf/Okt18/cd/DocumentClassification/ClassName',
            embeddedDataSpecifications: [
                {
                    dataSpecification: {
                        type: 'ExternalReference',
                        keys: [
                            {
                                type: 'GlobalReference',
                                value: 'http://admin-shell.io/DataSpecificationTemplates/DataSpecificationIEC61360',
                            },
                        ],
                    },
                    dataSpecificationContent: {
                        modelType: 'DataSpecificationIec61360',
                        preferredName: [],
                        dataType: 'STRING_TRANSLATABLE',
                        definition: [
                            {
                                language: 'DE',
                                text: 'Liste von sprachabhängigen Namen zur ClassId. ',
                            },
                        ],
                        shortName: [
                            {
                                language: 'EN?',
                                text: 'DocumentClassName',
                            },
                        ],
                    },
                },
            ],
        },
        {
            idShort: 'DocumentClassificationSystem',
            modelType: 'ConceptDescription',
            id: 'www.vdi2770.com/blatt1/Entwurf/Okt18/cd/DocumentClassification/ClassificationSystem',
            embeddedDataSpecifications: [
                {
                    dataSpecification: {
                        type: 'ExternalReference',
                        keys: [
                            {
                                type: 'GlobalReference',
                                value: 'http://admin-shell.io/DataSpecificationTemplates/DataSpecificationIEC61360',
                            },
                        ],
                    },
                    dataSpecificationContent: {
                        modelType: 'DataSpecificationIec61360',
                        preferredName: [
                            {
                                language: 'EN',
                                text: 'Classification System',
                            },
                            {
                                language: 'DE',
                                text: 'Klassifikationssystem',
                            },
                        ],
                        dataType: 'STRING',
                        definition: [
                            {
                                language: 'DE',
                                text: 'Eindeutige Kennung für ein Klassifikationssystem. Für Klassifikationen nach VDI 2770 muss "VDI2770:2018" verwenden werden.',
                            },
                        ],
                        shortName: [
                            {
                                language: 'EN?',
                                text: 'DocumentClassificationSystem',
                            },
                        ],
                    },
                },
            ],
        },
        {
            idShort: 'OrganizationName',
            modelType: 'ConceptDescription',
            id: 'www.vdi2770.com/blatt1/Entwurf/Okt18/cd/Organization/OrganizationName',
            embeddedDataSpecifications: [
                {
                    dataSpecification: {
                        type: 'ExternalReference',
                        keys: [
                            {
                                type: 'GlobalReference',
                                value: 'http://admin-shell.io/DataSpecificationTemplates/DataSpecificationIEC61360',
                            },
                        ],
                    },
                    dataSpecificationContent: {
                        modelType: 'DataSpecificationIec61360',
                        preferredName: [
                            {
                                language: 'DE',
                                text: 'gebräuchliche Bezeichnung für Organisation',
                            },
                            {
                                language: 'EN',
                                text: 'organization name',
                            },
                        ],
                        dataType: 'STRING',
                        definition: [
                            {
                                language: 'DE',
                                text: 'Die gebräuchliche Bezeichnung für die Organisation.',
                            },
                        ],
                        shortName: [
                            {
                                language: 'EN?',
                                text: 'OrganizationName',
                            },
                        ],
                    },
                },
            ],
        },
        {
            idShort: 'OrganizationOfficialName',
            modelType: 'ConceptDescription',
            id: 'www.vdi2770.com/blatt1/Entwurf/Okt18/cd/Organization/OrganizationOfficialName',
            embeddedDataSpecifications: [
                {
                    dataSpecification: {
                        type: 'ExternalReference',
                        keys: [
                            {
                                type: 'GlobalReference',
                                value: 'http://admin-shell.io/DataSpecificationTemplates/DataSpecificationIEC61360',
                            },
                        ],
                    },
                    dataSpecificationContent: {
                        modelType: 'DataSpecificationIec61360',
                        preferredName: [
                            {
                                language: 'DE',
                                text: 'offizieller Name der Organisation',
                            },
                            {
                                language: 'EN',
                                text: 'official name of the organization',
                            },
                        ],
                        dataType: 'STRING',
                        definition: [
                            {
                                language: 'DE',
                                text: 'Der offizielle Namen der Organisation.',
                            },
                        ],
                        shortName: [
                            {
                                language: 'EN?',
                                text: 'OrganizationOfficialName',
                            },
                        ],
                    },
                },
            ],
            isCaseOf: [
                {
                    type: 'ModelReference',
                    keys: [
                        {
                            type: 'ConceptDescription',
                            value: '0173-1#02-AAO677#002',
                        },
                    ],
                },
            ],
        },
        {
            idShort: 'DocumentVersion',
            modelType: 'ConceptDescription',
            id: 'www.vdi2770.com/blatt1/Entwurf/Okt18/cd/DocumentVersion',
            embeddedDataSpecifications: [
                {
                    dataSpecification: {
                        type: 'ExternalReference',
                        keys: [
                            {
                                type: 'GlobalReference',
                                value: 'www.admin-shell.io/DataSpecificationTemplates/DataSpecificationIEC61360',
                            },
                        ],
                    },
                    dataSpecificationContent: {
                        modelType: 'DataSpecificationIec61360',
                        preferredName: [
                            {
                                language: 'DE',
                                text: 'Version des Dokuments',
                            },
                        ],
                        definition: [
                            {
                                language: 'DE',
                                text: 'Zu jedem Dokument muss eine Menge von mindestens einer Dokumentenversion existieren. Es können auch mehrere Dokumentenversionen ausgeliefert werden.',
                            },
                        ],
                        shortName: [
                            {
                                language: 'EN?',
                                text: 'DocumentVersion',
                            },
                        ],
                    },
                },
            ],
        },
        {
            idShort: 'Language',
            modelType: 'ConceptDescription',
            id: 'www.vdi2770.com/blatt1/Entwurf/Okt18/cd/DocumentVersion/Language',
            embeddedDataSpecifications: [
                {
                    dataSpecification: {
                        type: 'ExternalReference',
                        keys: [
                            {
                                type: 'GlobalReference',
                                value: 'http://admin-shell.io/DataSpecificationTemplates/DataSpecificationIEC61360',
                            },
                        ],
                    },
                    dataSpecificationContent: {
                        modelType: 'DataSpecificationIec61360',
                        preferredName: [
                            {
                                language: 'EN',
                                text: 'Language',
                            },
                            {
                                language: 'DE',
                                text: 'Sprache',
                            },
                        ],
                        dataType: 'STRING',
                        definition: [
                            {
                                language: 'DE',
                                text: 'Eine Liste der im Dokument verwendeten Sprachen.',
                            },
                        ],
                        shortName: [
                            {
                                language: 'EN?',
                                text: 'Language',
                            },
                        ],
                    },
                },
            ],
        },
        {
            idShort: 'Title',
            modelType: 'ConceptDescription',
            id: 'www.vdi2770.com/blatt1/Entwurf/Okt18/cd/Description/Title',
            embeddedDataSpecifications: [
                {
                    dataSpecification: {
                        type: 'ExternalReference',
                        keys: [
                            {
                                type: 'GlobalReference',
                                value: 'http://admin-shell.io/DataSpecificationTemplates/DataSpecificationIEC61360',
                            },
                        ],
                    },
                    dataSpecificationContent: {
                        modelType: 'DataSpecificationIec61360',
                        preferredName: [
                            {
                                language: 'EN',
                                text: 'Title',
                            },
                            {
                                language: 'DE',
                                text: 'Titel',
                            },
                        ],
                        dataType: 'STRING_TRANSLATABLE',
                        definition: [
                            {
                                language: 'DE',
                                text: 'Sprachabhängiger Titel des Dokuments.',
                            },
                        ],
                        shortName: [
                            {
                                language: 'EN?',
                                text: 'Title',
                            },
                        ],
                    },
                },
            ],
        },
        {
            idShort: 'Date',
            modelType: 'ConceptDescription',
            id: 'www.vdi2770.com/blatt1/Entwurf/Okt18/cd/LifeCycleStatus/SetDate',
            embeddedDataSpecifications: [
                {
                    dataSpecification: {
                        type: 'ExternalReference',
                        keys: [
                            {
                                type: 'GlobalReference',
                                value: 'www.admin-shell.io/DataSpecificationTemplates/DataSpecificationIEC61360',
                            },
                        ],
                    },
                    dataSpecificationContent: {
                        modelType: 'DataSpecificationIec61360',
                        preferredName: [],
                        dataType: 'DATE',
                        definition: [
                            {
                                language: 'DE',
                                text: 'Datum und Uhrzeit, an dem der Status festgelegt wurde. Es muss das Datumsformat „YYYY-MM-dd“ verwendet werden (Y = Jahr, M = Monat, d = Tag, siehe ISO 8601).',
                            },
                        ],
                        shortName: [
                            {
                                language: 'EN?',
                                text: 'SetDate',
                            },
                        ],
                    },
                },
            ],
        },
        {
            idShort: 'DocumentVersionIdValue',
            modelType: 'ConceptDescription',
            id: 'www.vdi2770.com/blatt1/Entwurf/Okt18/cd/DocumentVersionId/Val',
            embeddedDataSpecifications: [
                {
                    dataSpecification: {
                        type: 'ExternalReference',
                        keys: [
                            {
                                type: 'GlobalReference',
                                value: 'www.admin-shell.io/DataSpecificationTemplates/DataSpecificationIEC61360',
                            },
                        ],
                    },
                    dataSpecificationContent: {
                        modelType: 'DataSpecificationIec61360',
                        preferredName: [],
                        dataType: 'STRING',
                        definition: [
                            {
                                language: 'DE',
                                text: 'Verschiedene Versionen eines Dokuments müssen eindeutig identifizierbar sein. Die DocumentVersionId stellt eine innerhalb einer Domäne eindeutige Versionsidentifikationsnummer dar.',
                            },
                        ],
                        shortName: [
                            {
                                language: 'EN?',
                                text: 'DocumentVersionId',
                            },
                        ],
                    },
                },
            ],
        },
        {
            idShort: 'DigitalFile',
            modelType: 'ConceptDescription',
            id: 'www.vdi2770.com/blatt1/Entwurf/Okt18/cd/StoredDocumentRepresentation/DigitalFile',
            embeddedDataSpecifications: [
                {
                    dataSpecification: {
                        type: 'ExternalReference',
                        keys: [
                            {
                                type: 'GlobalReference',
                                value: 'http://admin-shell.io/DataSpecificationTemplates/DataSpecificationIEC61360',
                            },
                        ],
                    },
                    dataSpecificationContent: {
                        modelType: 'DataSpecificationIec61360',
                        preferredName: [],
                        dataType: 'FILE',
                        definition: [
                            {
                                language: 'DE',
                                text: 'Eine Datei, die die DocumentVersion repräsentiert. Neben der obligatorischen PDF/A Datei können weitere Dateien angegeben werden.',
                            },
                        ],
                        shortName: [
                            {
                                language: 'EN?',
                                text: 'DigitalFile',
                            },
                        ],
                    },
                },
            ],
        },
        {
            idShort: 'MaxRotationSpeed',
            modelType: 'ConceptDescription',
            category: 'PROPERTY',
            id: '0173-1#02-BAA120#008',
            administration: {
                version: '',
                revision: '2',
            },
            embeddedDataSpecifications: [
                {
                    dataSpecification: {
                        type: 'ModelReference',
                        keys: [],
                    },
                    dataSpecificationContent: {
                        modelType: 'DataSpecificationIec61360',
                        preferredName: [
                            {
                                language: 'de',
                                text: 'max. Drehzahl',
                            },
                            {
                                language: 'en',
                                text: 'Max. rotation speed',
                            },
                        ],
                        dataType: 'INTEGER_MEASURE',
                        definition: [
                            {
                                language: 'de',
                                text: 'Höchste zulässige Drehzahl, mit welcher der Motor oder die Speiseinheit betrieben werden darf',
                            },
                            {
                                language: 'en',
                                text: 'Greatest permissible rotation speed with which the motor or feeding unit may be operated',
                            },
                        ],
                        shortName: [],
                        unit: '1/min',
                        unitId: {
                            type: 'ExternalReference',
                            keys: [
                                {
                                    type: 'GlobalReference',
                                    value: '0173-1#05-AAA650#002',
                                },
                            ],
                        },
                    },
                },
            ],
            isCaseOf: [
                {
                    type: 'ModelReference',
                    keys: [],
                },
            ],
        },
        {
            idShort: 'MaxTorque',
            modelType: 'ConceptDescription',
            category: 'PROPERTY',
            id: '0173-1#02-BAE098#004',
            embeddedDataSpecifications: [
                {
                    dataSpecification: {
                        type: 'ModelReference',
                        keys: [],
                    },
                    dataSpecificationContent: {
                        modelType: 'DataSpecificationIec61360',
                        preferredName: [
                            {
                                language: 'EN',
                                text: 'Max. torque',
                            },
                        ],
                        dataType: 'REAL_MEASURE',
                        definition: [
                            {
                                language: 'EN',
                                text: 'Greatest permissible mechanical torque which the motor can pass on at the drive shaft',
                            },
                            {
                                language: 'DE',
                                text: 'Größtes mechanisch zulässiges Drehmoment, welches der Motor an der Abtriebswelle abgeben kann',
                            },
                        ],
                        shortName: [],
                        unit: 'Nm',
                        unitId: {
                            type: 'ExternalReference',
                            keys: [
                                {
                                    type: 'GlobalReference',
                                    value: '0173-1#05-AAA212#003',
                                },
                            ],
                        },
                    },
                },
            ],
        },
        {
            idShort: 'RotationSpeed',
            modelType: 'ConceptDescription',
            category: 'PROPERTY',
            id: 'http://customer.com/cd//1/1/18EBD56F6B43D895',
            embeddedDataSpecifications: [
                {
                    dataSpecification: {
                        type: 'ExternalReference',
                        keys: [
                            {
                                type: 'GlobalReference',
                                value: 'http://admin-shell.io/DataSpecificationTemplates/DataSpecificationIEC61360',
                            },
                        ],
                    },
                    dataSpecificationContent: {
                        modelType: 'DataSpecificationIec61360',
                        preferredName: [
                            {
                                language: 'DE',
                                text: 'Aktuelle Drehzahl',
                            },
                            {
                                language: 'EN',
                                text: 'Actual rotation speed',
                            },
                        ],
                        dataType: 'INTEGER_MEASURE',
                        definition: [
                            {
                                language: 'Atkuelle Drehzahl, mit welcher der Motor oder die Speiseinheit betri',
                                text: 'eben wird',
                            },
                        ],
                        shortName: [
                            {
                                language: 'EN?',
                                text: 'RotationSpeed',
                            },
                        ],
                        unit: '1/min',
                        unitId: {
                            type: 'ExternalReference',
                            keys: [
                                {
                                    type: 'GlobalReference',
                                    value: '0173-1#05-AAA650#002',
                                },
                            ],
                        },
                    },
                },
            ],
        },
        {
            idShort: 'Torque',
            modelType: 'ConceptDescription',
            category: 'PROPERTY',
            id: 'http://customer.com/cd//1/1/18EBD56F6B43D896',
            embeddedDataSpecifications: [
                {
                    dataSpecification: {
                        type: 'ExternalReference',
                        keys: [
                            {
                                type: 'GlobalReference',
                                value: 'http://admin-shell.io/DataSpecificationTemplates/DataSpecificationIEC61360',
                            },
                        ],
                    },
                    dataSpecificationContent: {
                        modelType: 'DataSpecificationIec61360',
                        preferredName: [],
                        dataType: 'REAL_MEASURE',
                        definition: [
                            {
                                language: 'EN',
                                text: 'Actual mechanical torque which the motor passes on at the drive shaft',
                            },
                            {
                                language: 'DE',
                                text: 'Atkuelles Drehmoment, welches der Motor an der Abtriebswelle abgibt',
                            },
                        ],
                        shortName: [
                            {
                                language: 'EN?',
                                text: 'Torque',
                            },
                        ],
                        unit: 'Nm',
                        unitId: {
                            type: 'ModelReference',
                            keys: [],
                        },
                    },
                },
            ],
        },
        {
            idShort: 'CoolingType',
            modelType: 'ConceptDescription',
            category: 'PROPERTY',
            id: '0173-1#02-BAE122#006',
            embeddedDataSpecifications: [
                {
                    dataSpecification: {
                        type: 'ExternalReference',
                        keys: [
                            {
                                type: 'GlobalReference',
                                value: 'http://admin-shell.io/DataSpecificationTemplates/DataSpecificationIEC61360',
                            },
                        ],
                    },
                    dataSpecificationContent: {
                        modelType: 'DataSpecificationIec61360',
                        preferredName: [
                            {
                                language: 'DE',
                                text: 'Art der Kühlung',
                            },
                            {
                                language: 'EN',
                                text: 'Cooling type',
                            },
                        ],
                        dataType: 'STRING',
                        definition: [
                            {
                                language: 'DE',
                                text: 'Zusammenfassung verschiedener Kühlarten, um für Suchmerkmale zu einer begrenzten Auswahl zu kommen',
                            },
                            {
                                language: 'EN',
                                text: 'Summary of various types of cooling, for use as search criteria that limit a selection',
                            },
                        ],
                        shortName: [],
                    },
                },
            ],
        },
        {
            idShort: 'BAB657',
            modelType: 'ConceptDescription',
            category: 'VALUE',
            id: '0173-1#07-BAB657#003',
            embeddedDataSpecifications: [
                {
                    dataSpecification: {
                        type: 'ExternalReference',
                        keys: [
                            {
                                type: 'GlobalReference',
                                value: 'http://admin-shell.io/DataSpecificationTemplates/DataSpecificationIEC61360',
                            },
                        ],
                    },
                    dataSpecificationContent: {
                        modelType: 'DataSpecificationIec61360',
                        preferredName: [
                            {
                                language: 'EN',
                                text: 'open circuit, external cooling',
                            },
                            {
                                language: 'DE',
                                text: 'offener Kreis, Fremdkühlung ',
                            },
                        ],
                        dataType: 'STRING',
                        definition: [],
                        shortName: [],
                    },
                },
            ],
        },
    ],
};

export const aasEnvironment = data as aas.Environment;