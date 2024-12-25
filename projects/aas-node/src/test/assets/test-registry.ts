/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

export default [
    {
        "endpoints": [
            {
                "address": "http://172.16.160.171:51000/aas/ProductionJob_29663efb09f942cd80208737ad948b32",
                "type": "http"
            }
        ],
        "modelType": {
            "name": "AssetAdministrationShellDescriptor"
        },
        "identification": {
            "idType": "IRI",
            "id": "urn:IOSB:Fraunhofer:de:CrossTepDte:AssemblyAssistance:Id:AAS:ProductionJob:29663efb09f942cd80208737ad948b32"
        },
        "idShort": "ProductionJob_29663efb09f942cd80208737ad948b32",
        "asset": {
            "identification": {
                "idType": "IRI",
                "id": "urn:IOSB:Fraunhofer:de:CrossTepDte:AssemblyAssistance:Id:Asset:ProductionJob:29663efb09f942cd80208737ad948b32"
            },
            "idShort": "ProductionJob_29663efb09f942cd80208737ad948b32",
            "kind": "Instance",
            "modelType": {
                "name": "Asset"
            },
            "category": "VARIABLE"
        },
        "submodels": [
            {
                "semanticId": {
                    "keys": [
                        {
                            "idType": "IRI",
                            "index": 0,
                            "type": "GlobalReference",
                            "value": "urn:IOSB:Fraunhofer:de:CrossTepDte:AssemblyAssistance:SemId:Submodel:MasterData:ProductionJob",
                            "local": false
                        }
                    ]
                },
                "endpoints": [
                    {
                        "address": "http://172.16.160.171:51000/aas/ProductionJob_29663efb09f942cd80208737ad948b32/submodels/MasterData_ProductionJob_29663efb09f942cd80208737ad948b32/complete",
                        "type": "http"
                    }
                ],
                "identification": {
                    "idType": "IRI",
                    "id": "urn:IOSB:Fraunhofer:de:CrossTepDte:AssemblyAssistance:Id:Submodel:MasterData:ProductionJob:29663efb09f942cd80208737ad948b32"
                },
                "idShort": "MasterData_ProductionJob_29663efb09f942cd80208737ad948b32"
            },
            {
                "semanticId": {
                    "keys": [
                        {
                            "idType": "IRI",
                            "index": 0,
                            "type": "GlobalReference",
                            "value": "urn:IOSB:Fraunhofer:de:CrossTepDte:AssemblyAssistance:SemId:Submodel:BillOfMaterial:ProductionJob",
                            "local": false
                        }
                    ]
                },
                "endpoints": [
                    {
                        "address": "http://172.16.160.171:51000/aas/ProductionJob_29663efb09f942cd80208737ad948b32/submodels/BillOfMaterial_ProductionJob_29663efb09f942cd80208737ad948b32/complete",
                        "type": "http"
                    }
                ],
                "identification": {
                    "idType": "IRI",
                    "id": "urn:IOSB:Fraunhofer:de:CrossTepDte:AssemblyAssistance:Id:Submodel:BillOfMaterial:ProductionJob:29663efb09f942cd80208737ad948b32"
                },
                "idShort": "BillOfMaterial_ProductionJob_29663efb09f942cd80208737ad948b32"
            },
            {
                "semanticId": {
                    "keys": [
                        {
                            "idType": "IRI",
                            "index": 0,
                            "type": "GlobalReference",
                            "value": "urn:IOSB:Fraunhofer:de:CrossTepDte:AssemblyAssistance:SemId:Submodel:AssetManagement:ProductionJob",
                            "local": false
                        }
                    ]
                },
                "endpoints": [
                    {
                        "address": "http://172.16.160.171:51000/aas/ProductionJob_29663efb09f942cd80208737ad948b32/submodels/AssetManagement_ProductionJob_29663efb09f942cd80208737ad948b32/complete",
                        "type": "http"
                    }
                ],
                "identification": {
                    "idType": "IRI",
                    "id": "urn:IOSB:Fraunhofer:de:CrossTepDte:AssemblyAssistance:Id:Submodel:AssetManagement:ProductionJob:29663efb09f942cd80208737ad948b32"
                },
                "idShort": "AssetManagement_ProductionJob_29663efb09f942cd80208737ad948b32"
            },
            {
                "semanticId": {
                    "keys": [
                        {
                            "idType": "IRI",
                            "index": 0,
                            "type": "GlobalReference",
                            "value": "urn:IOSB:Fraunhofer:de:CrossTepDte:AssemblyAssistance:SemId:Submodel:LifeCycleDocumentation:ProductionJob",
                            "local": false
                        }
                    ]
                },
                "endpoints": [
                    {
                        "address": "http://172.16.160.171:51000/aas/ProductionJob_29663efb09f942cd80208737ad948b32/submodels/LifeCycleDocumentation_ProductionJob_29663efb09f942cd80208737ad948b32/complete",
                        "type": "http"
                    }
                ],
                "identification": {
                    "idType": "IRI",
                    "id": "urn:IOSB:Fraunhofer:de:CrossTepDte:AssemblyAssistance:Id:Submodel:LifeCycleDocumentation:ProductionJob:29663efb09f942cd80208737ad948b32"
                },
                "idShort": "LifeCycleDocumentation_ProductionJob_29663efb09f942cd80208737ad948b32"
            },
            {
                "semanticId": {
                    "keys": [
                        {
                            "idType": "IRI",
                            "index": 0,
                            "type": "GlobalReference",
                            "value": "urn:IOSB:Fraunhofer:de:CrossTepDte:AssemblyAssistance:SemId:Submodel:DTStorageInterfaceConfiguration:ProductionJob",
                            "local": false
                        }
                    ]
                },
                "endpoints": [
                    {
                        "address": "http://172.16.160.171:51000/aas/ProductionJob_29663efb09f942cd80208737ad948b32/submodels/DTStorageInterfaceConfiguration_ProductionJob_29663efb09f942cd80208737ad948b32/complete",
                        "type": "http"
                    }
                ],
                "identification": {
                    "idType": "IRI",
                    "id": "urn:IOSB:Fraunhofer:de:CrossTepDte:AssemblyAssistance:Id:Submodel:DTStorageInterfaceConfiguration:ProductionJob:29663efb09f942cd80208737ad948b32"
                },
                "idShort": "DTStorageInterfaceConfiguration_ProductionJob_29663efb09f942cd80208737ad948b32"
            },
            {
                "semanticId": {
                    "keys": [
                        {
                            "idType": "IRI",
                            "index": 0,
                            "type": "GlobalReference",
                            "value": "urn:IOSB:Fraunhofer:de:CrossTepDte:AssemblyAssistance:SemId:Submodel:DTAssetInterfaceConfiguration:ProductionJob",
                            "local": false
                        }
                    ]
                },
                "endpoints": [
                    {
                        "address": "http://172.16.160.171:51000/aas/ProductionJob_29663efb09f942cd80208737ad948b32/submodels/DTAssetInterfaceConfiguration_ProductionJob_29663efb09f942cd80208737ad948b32/complete",
                        "type": "http"
                    }
                ],
                "identification": {
                    "idType": "IRI",
                    "id": "urn:IOSB:Fraunhofer:de:CrossTepDte:AssemblyAssistance:Id:Submodel:DTAssetInterfaceConfiguration:ProductionJob:29663efb09f942cd80208737ad948b32"
                },
                "idShort": "DTAssetInterfaceConfiguration_ProductionJob_29663efb09f942cd80208737ad948b32"
            }
        ]
    },
    {
        "endpoints": [
            {
                "address": "http://172.16.160.188:50010/orderTakingService",
                "type": "http"
            }
        ],
        "modelType": {
            "name": "AssetAdministrationShellDescriptor"
        },
        "identification": {
            "idType": "IRI",
            "id": "urn:sfowl:manufacturer:aas:1:1:orderTakingService_0001"
        },
        "idShort": "orderTakingService",
        "asset": {
            "identification": {
                "idType": "IRI",
                "id": "urn:sfowl:manufacturer:asset:1:1:orderTakingService_0001"
            },
            "idShort": "orderTakingService",
            "kind": "Instance",
            "modelType": {
                "name": "Asset"
            },
            "category": "CONSTANT"
        },
        "submodels": [
            {
                "semanticId": {
                    "keys": [
                        {
                            "idType": "IRI",
                            "index": 0,
                            "type": "GlobalReference",
                            "value": "urn:sfowl:manufacturer:semId:1:1:orderTakingService",
                            "local": false
                        }
                    ]
                },
                "endpoints": [
                    {
                        "address": "http://172.16.160.188:50010/orderTakingService/orderTakingService",
                        "type": "http"
                    }
                ],
                "identification": {
                    "idType": "IRI",
                    "id": "urn:sfowl:manufacturer:sm:1:1:orderTakingService_0001"
                },
                "idShort": "orderTakingService"
            }
        ]
    },
    {
        "endpoints": [
            {
                "address": "http://172.16.160.171:54000/aas/InjectionMouldingMachine",
                "type": "http"
            }
        ],
        "modelType": {
            "name": "AssetAdministrationShellDescriptor"
        },
        "identification": {
            "idType": "IRI",
            "id": "urn:IOSB:INA:Fraunhofer:CUNA:Production:Id:AAS:InjectionMouldingMachine"
        },
        "idShort": "InjectionMouldingMachine",
        "asset": {
            "identification": {
                "idType": "IRI",
                "id": "urn:IOSB:INA:Fraunhofer:CUNA:Production:Id:Asset:InjectionMouldingMachine"
            },
            "idShort": "InjectionMouldingMachine",
            "kind": "Instance",
            "modelType": {
                "name": "Asset"
            },
            "category": "VARIABLE"
        },
        "submodels": [
            {
                "semanticId": {
                    "keys": [
                        {
                            "idType": "IRI",
                            "index": 0,
                            "type": "GlobalReference",
                            "value": "urn:IOSB:INA:Fraunhofer:CUNA:Production:SemId:Submodel:DigitalNameplate",
                            "local": false
                        }
                    ]
                },
                "endpoints": [
                    {
                        "address": "http://172.16.160.171:54000/aas/InjectionMouldingMachine/submodels/DigitalNameplate/complete",
                        "type": "http"
                    }
                ],
                "identification": {
                    "idType": "IRI",
                    "id": "urn:IOSB:INA:Fraunhofer:CUNA:Production:Id:Submodel:DigitalNameplate"
                },
                "idShort": "DigitalNameplate"
            },
            {
                "semanticId": {
                    "keys": [
                        {
                            "idType": "IRI",
                            "index": 0,
                            "type": "GlobalReference",
                            "value": "urn:IOSB:INA:Fraunhofer:CUNA:Production:SemId:Submodel:OperationalData",
                            "local": false
                        }
                    ]
                },
                "endpoints": [
                    {
                        "address": "http://172.16.160.171:54000/aas/InjectionMouldingMachine/submodels/OperationalData/complete",
                        "type": "http"
                    }
                ],
                "identification": {
                    "idType": "IRI",
                    "id": "urn:IOSB:INA:Fraunhofer:CUNA:Production:Id:Submodel:OperationalData"
                },
                "idShort": "OperationalData"
            }
        ]
    }
]