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
            id: 'http://customer.com/aas/9175_7013_7091_9168',
            assetInformation: {
                assetKind: 'Instance',
                globalAssetId: 'http://customer.com/assets/KHBVZJSQKIY',
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
            description: [
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
            kind: 'Instance',
            submodelElements: [
                {
                    idShort: 'Manufacturer',
                    modelType: 'Property',
                    path: {
                        id: 'http://i40.customer.com/type/1/1/F13E8576F6488342',
                        idShortPath: 'Manufacturer',
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
                    valueType: 'xs:string',
                    value: 'CUSTOMER GmbH',
                },
                {
                    idShort: 'GLN',
                    modelType: 'Property',
                    path: {
                        id: 'http://i40.customer.com/type/1/1/F13E8576F6488342',
                        idShortPath: 'GLN',
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
                    valueType: 'xs:integer',
                    value: '10101010',
                },
                {
                    idShort: 'ProductDesignation',
                    modelType: 'Property',
                    path: {
                        id: 'http://i40.customer.com/type/1/1/F13E8576F6488342',
                        idShortPath: 'ProductDesignation',
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
                    valueType: 'xs:string',
                    value: 'I40 Capable Servo Motor (EN)',
                },
                {
                    idShort: 'SerialNumber',
                    modelType: 'Property',
                    path: {
                        id: 'http://i40.customer.com/type/1/1/F13E8576F6488342',
                        idShortPath: 'SerialNumber',
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
                    valueType: 'xs:string',
                    value: 'P12345678I40',
                },
            ],
        },
        {
            idShort: 'TechnicalData',
            modelType: 'Submodel',
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
            kind: 'Instance',
            submodelElements: [
                {
                    idShort: 'MaxRotationSpeed',
                    modelType: 'Property',
                    path: {
                        id: 'http.//i40.customer.com/type/1/1/7A7104BDAB57E184',
                        idShortPath: 'MaxRotationSpeed',
                    },
                    category: 'PARAMETER',
                    semanticId: {
                        type: 'ExternalReference',
                        keys: [
                            {
                                type: 'GlobalReference',
                                value: '0173-1#02-BAA120#008',
                            },
                        ],
                    },
                    valueType: 'xs:integer',
                    value: '5000',
                },
                {
                    idShort: 'MaxTorque',
                    modelType: 'Property',
                    path: {
                        id: 'http.//i40.customer.com/type/1/1/7A7104BDAB57E184',
                        idShortPath: 'MaxTorque',
                    },
                    category: 'PARAMETER',
                    semanticId: {
                        type: 'ExternalReference',
                        keys: [
                            {
                                type: 'GlobalReference',
                                value: '0173-1#02-BAE098#004',
                            },
                        ],
                    },
                    valueType: 'xs:float',
                    value: '200',
                },
                {
                    idShort: 'CoolingType',
                    modelType: 'Property',
                    path: {
                        id: 'http.//i40.customer.com/type/1/1/7A7104BDAB57E184',
                        idShortPath: 'CoolingType',
                    },
                    category: 'PARAMETER',
                    description: [
                        {
                            language: 'EN',
                            text: 'open circuit, external cooling',
                        },
                    ],
                    semanticId: {
                        type: 'ExternalReference',
                        keys: [
                            {
                                type: 'GlobalReference',
                                value: '0173-1#02-BAE122#006',
                            },
                        ],
                    },
                    valueType: 'xs:string',
                    value: 'BAB657',
                    valueId: {
                        type: 'ExternalReference',
                        keys: [
                            {
                                type: 'ConceptDescription',
                                value: '0173-1#07-BAB657#003 ',
                            },
                        ],
                    },
                },
            ],
        },
        {
            idShort: 'OperationalData',
            modelType: 'Submodel',
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
            kind: 'Instance',
            submodelElements: [
                {
                    idShort: 'RotationSpeed',
                    modelType: 'Property',
                    path: {
                        id: 'http://i40.customer.com/instance/1/1/AC69B1CB44F07935',
                        idShortPath: 'RotationSpeed',
                    },
                    category: 'VARIABLE',
                    semanticId: {
                        type: 'ExternalReference',
                        keys: [
                            {
                                type: 'GlobalReference',
                                value: 'http://customer.com/cd//1/1/18EBD56F6B43D895',
                            },
                        ],
                    },
                    valueType: 'xs:integer',
                    value: '4370',
                    nodeId: 'aHR0cDovL2k0MC5jdXN0b21lci5jb20vaW5zdGFuY2UvMS8xL0FDNjlCMUNCNDRGMDc5MzU#RotationSpeed',
                },
                {
                    idShort: 'Torque',
                    modelType: 'Property',
                    path: {
                        id: 'http://i40.customer.com/instance/1/1/AC69B1CB44F07935',
                        idShortPath: 'Torque',
                    },
                    category: 'VARIABLE',
                    semanticId: {
                        type: 'ExternalReference',
                        keys: [
                            {
                                type: 'GlobalReference',
                                value: 'http://customer.com/cd//1/1/18EBD56F6B43D896',
                            },
                        ],
                    },
                    valueType: 'xs:float',
                    value: '117.4',
                    nodeId: 'aHR0cDovL2k0MC5jdXN0b21lci5jb20vaW5zdGFuY2UvMS8xL0FDNjlCMUNCNDRGMDc5MzU#Torque',
                },
                {
                    idShort: 'TestOperation',
                    modelType: 'Operation',
                    path: {
                        id: 'http://i40.customer.com/instance/1/1/AC69B1CB44F07935',
                        idShortPath: 'TestOperation',
                    },
                    category: 'PARAMETER',
                    qualifiers: [
                        {
                            type: 'Demo',
                            valueType: 'xs:string',
                            value: 'true',
                        },
                    ],
                    inputVariables: [
                        {
                            value: {
                                idShort: 'TestInVar',
                                modelType: 'Property',
                                category: 'VARIABLE',
                                valueType: 'xs:integer',
                                value: '1234',
                            },
                        },
                    ],
                    inoutputVariables: [
                        {
                            value: {
                                idShort: 'TestInOutVar',
                                modelType: 'Property',
                                category: 'VARIABLE',
                                valueType: 'xs:integer',
                                value: '5678',
                            },
                        },
                    ],
                    outputVariables: [
                        {
                            value: {
                                idShort: 'TestOutVar',
                                modelType: 'Property',
                                category: 'VARIABLE',
                                valueType: 'xs:string',
                            },
                        },
                    ],
                },
            ],
        },
        {
            idShort: 'Documentation',
            modelType: 'Submodel',
            id: 'http://i40.customer.com/type/1/1/1A7B62B529F19152',
            kind: 'Instance',
            submodelElements: [
                {
                    idShort: 'OperatingManual',
                    modelType: 'SubmodelElementCollection',
                    path: {
                        id: 'http://i40.customer.com/type/1/1/1A7B62B529F19152',
                        idShortPath: 'OperatingManual',
                    },
                    semanticId: {
                        type: 'ExternalReference',
                        keys: [
                            {
                                type: 'GlobalReference',
                                value: 'www.vdi2770.com/blatt1/Entwurf/Okt18/cd/Document',
                            },
                        ],
                    },
                    value: [
                        {
                            idShort: 'DocumentId',
                            modelType: 'Property',
                            path: {
                                id: 'http://i40.customer.com/type/1/1/1A7B62B529F19152',
                                idShortPath: 'OperatingManual.DocumentId',
                            },
                            category: 'CONSTANT',
                            semanticId: {
                                type: 'ExternalReference',
                                keys: [
                                    {
                                        type: 'GlobalReference',
                                        value: 'www.vdi2770.com/blatt1/Entwurf/Okt18/cd/DocumentId/Val',
                                    },
                                ],
                            },
                            valueType: 'xs:string',
                            value: '3 608 870 A47',
                        },
                        {
                            idShort: 'DocumentClassId',
                            modelType: 'Property',
                            path: {
                                id: 'http://i40.customer.com/type/1/1/1A7B62B529F19152',
                                idShortPath: 'OperatingManual.DocumentClassId',
                            },
                            semanticId: {
                                type: 'ExternalReference',
                                keys: [
                                    {
                                        type: 'GlobalReference',
                                        value: 'www.vdi2770.com/blatt1/Entwurf/Okt18/cd/DocumentClassification/ClassId',
                                    },
                                ],
                            },
                            valueType: 'xs:string',
                            value: '03-02',
                            nodeId: 'aHR0cDovL2k0MC5jdXN0b21lci5jb20vdHlwZS8xLzEvMUE3QjYyQjUyOUYxOTE1Mg#OperatingManual.DocumentClassId',
                        },
                        {
                            idShort: 'DocumentClassName',
                            modelType: 'Property',
                            path: {
                                id: 'http://i40.customer.com/type/1/1/1A7B62B529F19152',
                                idShortPath: 'OperatingManual.DocumentClassName',
                            },
                            semanticId: {
                                type: 'ExternalReference',
                                keys: [
                                    {
                                        type: 'GlobalReference',
                                        value: 'www.vdi2770.com/blatt1/Entwurf/Okt18/cd/DocumentClassification/ClassName',
                                    },
                                ],
                            },
                            valueType: 'xs:string',
                            value: 'Operation (EN) Bedienung (DE)',
                            nodeId: 'aHR0cDovL2k0MC5jdXN0b21lci5jb20vdHlwZS8xLzEvMUE3QjYyQjUyOUYxOTE1Mg#OperatingManual.DocumentClassName',
                        },
                        {
                            idShort: 'DocumentClassificationSystem',
                            modelType: 'Property',
                            path: {
                                id: 'http://i40.customer.com/type/1/1/1A7B62B529F19152',
                                idShortPath: 'OperatingManual.DocumentClassificationSystem',
                            },
                            semanticId: {
                                type: 'ExternalReference',
                                keys: [
                                    {
                                        type: 'GlobalReference',
                                        value: 'www.vdi2770.com/blatt1/Entwurf/Okt18/cd/DocumentClassification/ClassificationSystem',
                                    },
                                ],
                            },
                            valueType: 'xs:string',
                            value: 'VDI2770:2018',
                            nodeId: 'aHR0cDovL2k0MC5jdXN0b21lci5jb20vdHlwZS8xLzEvMUE3QjYyQjUyOUYxOTE1Mg#OperatingManual.DocumentClassificationSystem',
                        },
                        {
                            idShort: 'OrganizationName',
                            modelType: 'Property',
                            path: {
                                id: 'http://i40.customer.com/type/1/1/1A7B62B529F19152',
                                idShortPath: 'OperatingManual.OrganizationName',
                            },
                            semanticId: {
                                type: 'ExternalReference',
                                keys: [
                                    {
                                        type: 'GlobalReference',
                                        value: 'www.vdi2770.com/blatt1/Entwurf/Okt18/cd/Organization/OrganizationName',
                                    },
                                ],
                            },
                            valueType: 'xs:string',
                            value: 'CUSTOMER',
                            nodeId: 'aHR0cDovL2k0MC5jdXN0b21lci5jb20vdHlwZS8xLzEvMUE3QjYyQjUyOUYxOTE1Mg#OperatingManual.OrganizationName',
                        },
                        {
                            idShort: 'OrganizationOfficialName',
                            modelType: 'Property',
                            path: {
                                id: 'http://i40.customer.com/type/1/1/1A7B62B529F19152',
                                idShortPath: 'OperatingManual.OrganizationOfficialName',
                            },
                            semanticId: {
                                type: 'ExternalReference',
                                keys: [
                                    {
                                        type: 'GlobalReference',
                                        value: 'www.vdi2770.com/blatt1/Entwurf/Okt18/cd/Organization/OrganizationOfficialName',
                                    },
                                ],
                            },
                            valueType: 'xs:string',
                            value: 'CUSTOMER GmbH',
                            nodeId: 'aHR0cDovL2k0MC5jdXN0b21lci5jb20vdHlwZS8xLzEvMUE3QjYyQjUyOUYxOTE1Mg#OperatingManual.OrganizationOfficialName',
                        },
                        {
                            idShort: 'Title',
                            modelType: 'Property',
                            path: {
                                id: 'http://i40.customer.com/type/1/1/1A7B62B529F19152',
                                idShortPath: 'OperatingManual.Title',
                            },
                            semanticId: {
                                type: 'ExternalReference',
                                keys: [
                                    {
                                        type: 'GlobalReference',
                                        value: 'www.vdi2770.com/blatt1/Entwurf/Okt18/cd/Description/Title',
                                    },
                                ],
                            },
                            valueType: 'xs:string',
                            value: 'Operating Manual Servo Motor',
                            nodeId: 'aHR0cDovL2k0MC5jdXN0b21lci5jb20vdHlwZS8xLzEvMUE3QjYyQjUyOUYxOTE1Mg#OperatingManual.Title',
                        },
                        {
                            idShort: 'Language',
                            modelType: 'Property',
                            path: {
                                id: 'http://i40.customer.com/type/1/1/1A7B62B529F19152',
                                idShortPath: 'OperatingManual.Language',
                            },
                            semanticId: {
                                type: 'ExternalReference',
                                keys: [
                                    {
                                        type: 'GlobalReference',
                                        value: 'www.vdi2770.com/blatt1/Entwurf/Okt18/cd/DocumentVersion/Language',
                                    },
                                ],
                            },
                            valueType: 'xs:string',
                            value: 'en-US',
                            nodeId: 'aHR0cDovL2k0MC5jdXN0b21lci5jb20vdHlwZS8xLzEvMUE3QjYyQjUyOUYxOTE1Mg#OperatingManual.Language',
                        },
                        {
                            idShort: 'DigitalFile_PDF',
                            modelType: 'File',
                            path: {
                                id: 'http://i40.customer.com/type/1/1/1A7B62B529F19152',
                                idShortPath: 'OperatingManual.DigitalFile_PDF',
                            },
                            category: 'PARAMETER',
                            semanticId: {
                                type: 'ExternalReference',
                                keys: [
                                    {
                                        type: 'GlobalReference',
                                        value: 'www.vdi2770.com/blatt1/Entwurf/Okt18/cd/StoredDocumentRepresentation/DigitalFile',
                                    },
                                ],
                            },
                            contentType: 'application/pdf',
                            value: '/aasx/OperatingManual.pdf',
                        },
                    ],
                },
            ],
        },
    ],
    conceptDescriptions: [
        {
            idShort: 'ManufacturerName',
            modelType: 'ConceptDescription',
            id: '0173-1#02-AAO677#002',
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
                                text: 'Herstellername',
                            },
                            {
                                language: 'en',
                                text: 'Manufacturer Name',
                            },
                        ],
                        definition: [
                            {
                                language: 'de',
                                text: "Bezeichnung für eine natürliche oder juristische Person, die für die Auslegung, Herstellung und Verpackung sowie die Etikettierung eines Produkts im Hinblick auf das 'Inverkehrbringen' im eigenen Namen verantwortlich ist",
                            },
                            {
                                language: 'en',
                                text: 'legally valid designation of the natural or judicial person which is directly responsible for the design, production, packaging and labeling of a product in respect to its being brought into circulation',
                            },
                        ],
                        shortName: [
                            {
                                language: 'en',
                                text: 'Manufacturer Name',
                            },
                        ],
                    },
                },
            ],
        },
        {
            idShort: 'GLNOfManufacturer',
            modelType: 'ConceptDescription',
            id: '0173-1#02-AAY812#001',
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
                                language: 'en',
                                text: 'GLN of manufacturer',
                            },
                            {
                                language: 'de',
                                text: 'GLN des Herstellers',
                            },
                        ],
                        definition: [
                            {
                                language: 'de',
                                text: 'international eindeutige Nummer für den Geräte- oder Produkthersteller sowie für den Standort',
                            },
                            {
                                language: 'en',
                                text: 'internationally unique identification number for the manufacturer of the device or the product and for the physical location',
                            },
                        ],
                        shortName: [
                            {
                                language: 'en',
                                text: 'GLN of manufacturer',
                            },
                        ],
                    },
                },
            ],
        },
        {
            idShort: 'ManufacturerProductDesignation',
            modelType: 'ConceptDescription',
            id: '0173-1#02-AAW338#001',
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
                                language: 'en',
                                text: 'Manufacturer product designation',
                            },
                            {
                                language: 'de',
                                text: 'Herstellerproduktbezeichnung',
                            },
                        ],
                        dataType: 'STRING_TRANSLATABLE',
                        definition: [
                            {
                                language: 'de',
                                text: 'Kurze Beschreibung des Produktes (Kurztext)',
                            },
                            {
                                language: 'en',
                                text: 'Short description of the product (short text)',
                            },
                        ],
                        shortName: [
                            {
                                language: 'en',
                                text: 'ManufacturerTypName',
                            },
                        ],
                    },
                },
            ],
        },
        {
            idShort: 'SerialNumber',
            modelType: 'ConceptDescription',
            id: '0173-1#02-AAM556#002',
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
                                language: 'en',
                                text: 'Serial number',
                            },
                            {
                                language: 'de',
                                text: 'Seriennummer',
                            },
                        ],
                        definition: [
                            {
                                language: 'de',
                                text: 'eindeutige Zahlen- und Buchstabenkombination mit der das Gerät nach seiner Herstellung identifiziert ist',
                            },
                            {
                                language: 'en',
                                text: 'unique combination of numbers and letters used to identify the device once it has been manufactured',
                            },
                        ],
                        shortName: [
                            {
                                language: 'en',
                                text: 'InstanceId',
                            },
                        ],
                    },
                },
            ],
        },
        {
            idShort: 'MaxRotationSpeed',
            modelType: 'ConceptDescription',
            id: '0173-1#02-BAA120#008',
            administration: {
                revision: '2',
            },
            embeddedDataSpecifications: [
                {
                    dataSpecification: {
                        type: 'ExternalReference',
                        keys: [
                            {
                                type: 'GlobalReference',
                                value: 'http://admin-shell.io/DataSpecificationTemplates/DataSpecificationIEC61360/3/0',
                            },
                        ],
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
                        shortName: [
                            {
                                language: 'en',
                                text: '',
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
            idShort: 'MaxTorque',
            modelType: 'ConceptDescription',
            id: '0173-1#02-BAE098#004',
            embeddedDataSpecifications: [
                {
                    dataSpecification: {
                        type: 'ExternalReference',
                        keys: [
                            {
                                type: 'GlobalReference',
                                value: 'http://admin-shell.io/DataSpecificationTemplates/DataSpecificationIEC61360/3/0',
                            },
                        ],
                    },
                    dataSpecificationContent: {
                        modelType: 'DataSpecificationIec61360',
                        preferredName: [
                            {
                                language: 'EN',
                                text: 'Max. torque',
                            },
                        ],
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
                        shortName: [
                            {
                                language: 'en',
                                text: '',
                            },
                        ],
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
            idShort: 'CoolingType',
            modelType: 'ConceptDescription',
            id: '0173-1#02-BAE122#006',
            embeddedDataSpecifications: [
                {
                    dataSpecification: {
                        type: 'ExternalReference',
                        keys: [
                            {
                                type: 'GlobalReference',
                                value: 'http://admin-shell.io/DataSpecificationTemplates/DataSpecificationIEC61360/3/0',
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
                        shortName: [
                            {
                                language: 'en',
                                text: '',
                            },
                        ],
                    },
                },
            ],
        },
        {
            idShort: 'RotationSpeed',
            modelType: 'ConceptDescription',
            id: 'http://customer.com/cd//1/1/18EBD56F6B43D895',
            embeddedDataSpecifications: [
                {
                    dataSpecification: {
                        type: 'ExternalReference',
                        keys: [
                            {
                                type: 'GlobalReference',
                                value: 'http://admin-shell.io/DataSpecificationTemplates/DataSpecificationIEC61360/3/0',
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
                        definition: [
                            {
                                language: 'Atkuelle Drehzahl, mit welcher der Motor oder die Speiseinheit betri',
                                text: 'eben wird',
                            },
                        ],
                        shortName: [
                            {
                                language: 'EN',
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
            id: 'http://customer.com/cd//1/1/18EBD56F6B43D896',
            embeddedDataSpecifications: [
                {
                    dataSpecification: {
                        type: 'ExternalReference',
                        keys: [
                            {
                                type: 'GlobalReference',
                                value: 'http://admin-shell.io/DataSpecificationTemplates/DataSpecificationIEC61360/3/0',
                            },
                        ],
                    },
                    dataSpecificationContent: {
                        modelType: 'DataSpecificationIec61360',
                        preferredName: [
                            {
                                language: 'en',
                                text: '',
                            },
                        ],
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
                                language: 'EN',
                                text: 'Torque',
                            },
                        ],
                        unit: 'Nm',
                    },
                },
            ],
        },
        {
            idShort: 'Document',
            modelType: 'ConceptDescription',
            id: 'www.vdi2770.com/blatt1/Entwurf/Okt18/cd/Document',
            embeddedDataSpecifications: [
                {
                    dataSpecification: {
                        type: 'ExternalReference',
                        keys: [
                            {
                                type: 'GlobalReference',
                                value: 'http://admin-shell.io/DataSpecificationTemplates/DataSpecificationIEC61360/3/0',
                            },
                        ],
                    },
                    dataSpecificationContent: {
                        modelType: 'DataSpecificationIec61360',
                        preferredName: [
                            {
                                language: 'en',
                                text: '',
                            },
                        ],
                        definition: [
                            {
                                language: 'DE',
                                text: 'Feste und geordnete Menge von für die Verwendung durch Personen bestimmte Informationen, die verwaltet und als Einheit zwischen Benutzern und System ausgetauscht werden kann.',
                            },
                        ],
                        shortName: [
                            {
                                language: 'EN',
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
            id: 'www.vdi2770.com/blatt1/Entwurf/Okt18/cd/DocumentId/Val',
            embeddedDataSpecifications: [
                {
                    dataSpecification: {
                        type: 'ExternalReference',
                        keys: [
                            {
                                type: 'GlobalReference',
                                value: 'http://admin-shell.io/DataSpecificationTemplates/DataSpecificationIEC61360/3/0',
                            },
                        ],
                    },
                    dataSpecificationContent: {
                        modelType: 'DataSpecificationIec61360',
                        preferredName: [
                            {
                                language: 'en',
                                text: '',
                            },
                        ],
                        definition: [
                            {
                                language: 'DE',
                                text: 'die eigentliche Identifikationsnummer',
                            },
                        ],
                        shortName: [
                            {
                                language: 'EN',
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
                                value: 'http://admin-shell.io/DataSpecificationTemplates/DataSpecificationIEC61360/3/0',
                            },
                        ],
                    },
                    dataSpecificationContent: {
                        modelType: 'DataSpecificationIec61360',
                        preferredName: [
                            {
                                language: 'en',
                                text: '',
                            },
                        ],
                        definition: [
                            {
                                language: 'DE',
                                text: 'Eindeutige ID der Klasse in einer Klassifikation.',
                            },
                        ],
                        shortName: [
                            {
                                language: 'EN',
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
                                value: 'http://admin-shell.io/DataSpecificationTemplates/DataSpecificationIEC61360/3/0',
                            },
                        ],
                    },
                    dataSpecificationContent: {
                        modelType: 'DataSpecificationIec61360',
                        preferredName: [
                            {
                                language: 'en',
                                text: '',
                            },
                        ],
                        definition: [
                            {
                                language: 'DE',
                                text: 'Liste von sprachabhängigen Namen zur ClassId. ',
                            },
                        ],
                        shortName: [
                            {
                                language: 'EN',
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
                                value: 'http://admin-shell.io/DataSpecificationTemplates/DataSpecificationIEC61360/3/0',
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
                        definition: [
                            {
                                language: 'DE',
                                text: 'Eindeutige Kennung für ein Klassifikationssystem. Für Klassifikationen nach VDI 2770 muss "VDI2770:2018" verwenden werden.',
                            },
                        ],
                        shortName: [
                            {
                                language: 'EN',
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
                                value: 'http://admin-shell.io/DataSpecificationTemplates/DataSpecificationIEC61360/3/0',
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
                        definition: [
                            {
                                language: 'DE',
                                text: 'Die gebräuchliche Bezeichnung für die Organisation.',
                            },
                        ],
                        shortName: [
                            {
                                language: 'EN',
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
                                value: 'http://admin-shell.io/DataSpecificationTemplates/DataSpecificationIEC61360/3/0',
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
                        definition: [
                            {
                                language: 'DE',
                                text: 'Der offizielle Namen der Organisation.',
                            },
                        ],
                        shortName: [
                            {
                                language: 'EN',
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
                                value: 'http://admin-shell.io/DataSpecificationTemplates/DataSpecificationIEC61360/3/0',
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
                        definition: [
                            {
                                language: 'DE',
                                text: 'Sprachabhängiger Titel des Dokuments.',
                            },
                        ],
                        shortName: [
                            {
                                language: 'EN',
                                text: 'Title',
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
                                value: 'http://admin-shell.io/DataSpecificationTemplates/DataSpecificationIEC61360/3/0',
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
                        definition: [
                            {
                                language: 'DE',
                                text: 'Eine Liste der im Dokument verwendeten Sprachen.',
                            },
                        ],
                        shortName: [
                            {
                                language: 'EN',
                                text: 'Language',
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
                                value: 'http://admin-shell.io/DataSpecificationTemplates/DataSpecificationIEC61360/3/0',
                            },
                        ],
                    },
                    dataSpecificationContent: {
                        modelType: 'DataSpecificationIec61360',
                        preferredName: [
                            {
                                language: 'en',
                                text: '',
                            },
                        ],
                        definition: [
                            {
                                language: 'DE',
                                text: 'Eine Datei, die die DocumentVersion repräsentiert. Neben der obligatorischen PDF/A Datei können weitere Dateien angegeben werden.',
                            },
                        ],
                        shortName: [
                            {
                                language: 'EN',
                                text: 'DigitalFile',
                            },
                        ],
                    },
                },
            ],
        },
    ],
};

export const aasEnvironment = data as aas.Environment;
