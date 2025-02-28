/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import * as aasv2 from '../../../app/types/aas-v2.js';

export default {
    "assetAdministrationShells": [
      {
        "asset": {
          "keys": [
            {
              "type": "Asset",
              "local": true,
              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:Id:Asset:CunaCup:Becher-1",
              "index": 0,
              "idType": "IRI"
            }
          ]
        },
        "submodels": [
          {
            "keys": [
              {
                "type": "Submodel",
                "local": true,
                "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:Id:Submodel:Nameplate:Becher-1",
                "index": 0,
                "idType": "IRI"
              }
            ]
          },
          {
            "keys": [
              {
                "type": "Submodel",
                "local": true,
                "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:Id:Submodel:DigitalProductPassport:Becher-1",
                "index": 0,
                "idType": "IRI"
              }
            ]
          },
          {
            "keys": [
              {
                "type": "Submodel",
                "local": true,
                "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:Id:Submodel:CustomerFeedback:Becher-1",
                "index": 0,
                "idType": "IRI"
              }
            ]
          }
        ],
        "identification": {
          "idType": "IRI",
          "id": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:Id:AAS:CunaCup:Becher-1"
        },
        "idShort": "CunaCup_Becher-1",
        "category": "VARIABLE",
        "modelType": {
          "name": "AssetAdministrationShell"
        }
      }
    ],
    "assets": [
      {
        "identification": {
          "idType": "IRI",
          "id": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:Id:Asset:CunaCup:Becher-1"
        },
        "idShort": "CunaCup_Becher-1",
        "category": "VARIABLE",
        "modelType": {
          "name": "Asset"
        },
        "kind": "Instance"
      }
    ],
    "submodels": [
      {
        "semanticId": {
          "keys": [
            {
              "type": "GlobalReference",
              "local": false,
              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:Nameplate",
              "index": 0,
              "idType": "IRI"
            }
          ]
        },
        "identification": {
          "idType": "IRI",
          "id": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:Id:Submodel:Nameplate:Becher-1"
        },
        "idShort": "Nameplate_Becher-1",
        "category": "VARIABLE",
        "modelType": {
          "name": "Submodel"
        },
        "kind": "Instance",
        "submodelElements": [
          {
            "value": "CUNA Products GmbH",
            "semanticId": {
              "keys": [
                {
                  "type": "GlobalReference",
                  "local": false,
                  "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:Nameplate:ManufacturerName",
                  "index": 0,
                  "idType": "IRI"
                }
              ]
            },
            "idShort": "ManufacturerName",
            "category": "CONSTANT",
            "modelType": {
              "name": "Property"
            },
            "valueType": {
              "dataObjectType": {
                "name": "string"
              }
            },
            "kind": "Instance"
          },
          {
            "value": "",
            "semanticId": {
              "keys": [
                {
                  "type": "GlobalReference",
                  "local": false,
                  "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:Nameplate:ManufacturerProductDesignation",
                  "index": 0,
                  "idType": "IRI"
                }
              ]
            },
            "idShort": "ManufacturerProductDesignation",
            "category": "CONSTANT",
            "modelType": {
              "name": "Property"
            },
            "valueType": {
              "dataObjectType": {
                "name": "string"
              }
            },
            "kind": "Instance"
          },
          {
            "value": "",
            "semanticId": {
              "keys": [
                {
                  "type": "GlobalReference",
                  "local": false,
                  "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:Nameplate:ManufacturerProductFamily",
                  "index": 0,
                  "idType": "IRI"
                }
              ]
            },
            "idShort": "ManufacturerProductFamily",
            "category": "CONSTANT",
            "modelType": {
              "name": "Property"
            },
            "valueType": {
              "dataObjectType": {
                "name": "string"
              }
            },
            "kind": "Instance"
          },
          {
            "value": "Becher-1",
            "semanticId": {
              "keys": [
                {
                  "type": "GlobalReference",
                  "local": false,
                  "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:Nameplate:SerialNumber",
                  "index": 0,
                  "idType": "IRI"
                }
              ]
            },
            "idShort": "SerialNumber",
            "category": "CONSTANT",
            "modelType": {
              "name": "Property"
            },
            "valueType": {
              "dataObjectType": {
                "name": "string"
              }
            },
            "kind": "Instance"
          },
          {
            "value": "",
            "semanticId": {
              "keys": [
                {
                  "type": "GlobalReference",
                  "local": false,
                  "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:Nameplate:BatchNumber",
                  "index": 0,
                  "idType": "IRI"
                }
              ]
            },
            "idShort": "BatchNumber",
            "category": "CONSTANT",
            "modelType": {
              "name": "Property"
            },
            "valueType": {
              "dataObjectType": {
                "name": "string"
              }
            },
            "kind": "Instance"
          },
          {
            "value": "DE",
            "semanticId": {
              "keys": [
                {
                  "type": "GlobalReference",
                  "local": false,
                  "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:Nameplate:ProductCountryOfOrigin",
                  "index": 0,
                  "idType": "IRI"
                }
              ]
            },
            "idShort": "ProductCountryOfOrigin",
            "category": "CONSTANT",
            "modelType": {
              "name": "Property"
            },
            "valueType": {
              "dataObjectType": {
                "name": "string"
              }
            },
            "kind": "Instance"
          },
          {
            "value": "01/15/2023",
            "semanticId": {
              "keys": [
                {
                  "type": "GlobalReference",
                  "local": false,
                  "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:Nameplate:DateOfConstruction",
                  "index": 0,
                  "idType": "IRI"
                }
              ]
            },
            "idShort": "DateOfConstruction",
            "category": "CONSTANT",
            "modelType": {
              "name": "Property"
            },
            "valueType": {
              "dataObjectType": {
                "name": "datetime"
              }
            },
            "kind": "Instance"
          },
          {
            "value": "DE",
            "semanticId": {
              "keys": [
                {
                  "type": "GlobalReference",
                  "local": false,
                  "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:Nameplate:ProductCountryOfOrigin",
                  "index": 0,
                  "idType": "IRI"
                }
              ]
            },
            "idShort": "ProductCountryOfOrigin",
            "category": "CONSTANT",
            "modelType": {
              "name": "Property"
            },
            "valueType": {
              "dataObjectType": {
                "name": "string"
              }
            },
            "kind": "Instance"
          },
          {
            "ordered": true,
            "allowDuplicates": true,
            "semanticId": {
              "keys": [
                {
                  "type": "GlobalReference",
                  "local": false,
                  "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:Nameplate:Marking",
                  "index": 0,
                  "idType": "IRI"
                }
              ]
            },
            "idShort": "Marking_CE",
            "category": "CONSTANT",
            "modelType": {
              "name": "SubmodelElementCollection"
            },
            "value": [
              {
                "value": "1",
                "semanticId": {
                  "keys": [
                    {
                      "type": "GlobalReference",
                      "local": false,
                      "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:Nameplate:Marking:CEQualificationPresent",
                      "index": 0,
                      "idType": "IRI"
                    }
                  ]
                },
                "idShort": "CEQualificationPresent",
                "category": "CONSTANT",
                "modelType": {
                  "name": "Property"
                },
                "valueType": {
                  "dataObjectType": {
                    "name": "string"
                  }
                },
                "kind": "Instance"
              }
            ],
            "kind": "Instance"
          },
          {
            "ordered": true,
            "allowDuplicates": true,
            "semanticId": {
              "keys": [
                {
                  "type": "GlobalReference",
                  "local": false,
                  "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:Nameplate:PhysicalAddress",
                  "index": 0,
                  "idType": "IRI"
                }
              ]
            },
            "idShort": "PhysicalAddress",
            "category": "CONSTANT",
            "modelType": {
              "name": "SubmodelElementCollection"
            },
            "value": [
              {
                "value": "DE",
                "semanticId": {
                  "keys": [
                    {
                      "type": "GlobalReference",
                      "local": false,
                      "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:Nameplate:CountryCode",
                      "index": 0,
                      "idType": "IRI"
                    }
                  ]
                },
                "idShort": "CountryCode",
                "category": "CONSTANT",
                "modelType": {
                  "name": "Property"
                },
                "valueType": {
                  "dataObjectType": {
                    "name": "string"
                  }
                },
                "kind": "Instance"
              },
              {
                "value": "Rudolf-Diesel-Str. 3 ",
                "semanticId": {
                  "keys": [
                    {
                      "type": "GlobalReference",
                      "local": false,
                      "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:Nameplate:Street",
                      "index": 0,
                      "idType": "IRI"
                    }
                  ]
                },
                "idShort": "Street",
                "category": "CONSTANT",
                "modelType": {
                  "name": "Property"
                },
                "valueType": {
                  "dataObjectType": {
                    "name": "string"
                  }
                },
                "kind": "Instance"
              },
              {
                "value": "40822",
                "semanticId": {
                  "keys": [
                    {
                      "type": "GlobalReference",
                      "local": false,
                      "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:Nameplate:Zip",
                      "index": 0,
                      "idType": "IRI"
                    }
                  ]
                },
                "idShort": "Zip",
                "category": "CONSTANT",
                "modelType": {
                  "name": "Property"
                },
                "valueType": {
                  "dataObjectType": {
                    "name": "string"
                  }
                },
                "kind": "Instance"
              },
              {
                "value": "Mettmann",
                "semanticId": {
                  "keys": [
                    {
                      "type": "GlobalReference",
                      "local": false,
                      "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:Nameplate:CityTown",
                      "index": 0,
                      "idType": "IRI"
                    }
                  ]
                },
                "idShort": "CityTown",
                "category": "CONSTANT",
                "modelType": {
                  "name": "Property"
                },
                "valueType": {
                  "dataObjectType": {
                    "name": "string"
                  }
                },
                "kind": "Instance"
              },
              {
                "value": "DE",
                "semanticId": {
                  "keys": [
                    {
                      "type": "GlobalReference",
                      "local": false,
                      "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:Nameplate:StateCounty",
                      "index": 0,
                      "idType": "IRI"
                    }
                  ]
                },
                "idShort": "StateCounty",
                "category": "CONSTANT",
                "modelType": {
                  "name": "Property"
                },
                "valueType": {
                  "dataObjectType": {
                    "name": "string"
                  }
                },
                "kind": "Instance"
              }
            ],
            "kind": "Instance"
          }
        ]
      },
      {
        "semanticId": {
          "keys": [
            {
              "type": "GlobalReference",
              "local": false,
              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:DigitalProductPassport",
              "index": 0,
              "idType": "IRI"
            }
          ]
        },
        "identification": {
          "idType": "IRI",
          "id": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:Id:Submodel:DigitalProductPassport:Becher-1"
        },
        "idShort": "DigitalProductPassport_Becher-1",
        "category": "VARIABLE",
        "modelType": {
          "name": "Submodel"
        },
        "kind": "Instance",
        "submodelElements": [
          {
            "ordered": true,
            "allowDuplicates": true,
            "semanticId": {
              "keys": [
                {
                  "type": "GlobalReference",
                  "local": false,
                  "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:DigitalProductPassport:General",
                  "index": 0,
                  "idType": "IRI"
                }
              ]
            },
            "idShort": "General",
            "category": "CONSTANT",
            "modelType": {
              "name": "SubmodelElementCollection"
            },
            "value": [
              {
                "value": "1",
                "semanticId": {
                  "keys": [
                    {
                      "type": "GlobalReference",
                      "local": false,
                      "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:DigitalProductPassport:General:Color",
                      "index": 0,
                      "idType": "IRI"
                    }
                  ]
                },
                "idShort": "Color",
                "category": "CONSTANT",
                "modelType": {
                  "name": "Property"
                },
                "valueType": {
                  "dataObjectType": {
                    "name": "string"
                  }
                },
                "kind": "Instance"
              },
              {
                "value": "1",
                "semanticId": {
                  "keys": [
                    {
                      "type": "GlobalReference",
                      "local": false,
                      "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:DigitalProductPassport:General:LaserMotive",
                      "index": 0,
                      "idType": "IRI"
                    }
                  ]
                },
                "idShort": "LaserMotive",
                "category": "CONSTANT",
                "modelType": {
                  "name": "Property"
                },
                "valueType": {
                  "dataObjectType": {
                    "name": "string"
                  }
                },
                "kind": "Instance"
              },
              {
                "value": "1",
                "semanticId": {
                  "keys": [
                    {
                      "type": "GlobalReference",
                      "local": false,
                      "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:DigitalProductPassport:General:Volume",
                      "index": 0,
                      "idType": "IRI"
                    }
                  ]
                },
                "idShort": "Volume",
                "category": "CONSTANT",
                "modelType": {
                  "name": "Property"
                },
                "valueType": {
                  "dataObjectType": {
                    "name": "string"
                  }
                },
                "kind": "Instance"
              },
              {
                "value": "1",
                "semanticId": {
                  "keys": [
                    {
                      "type": "GlobalReference",
                      "local": false,
                      "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:DigitalProductPassport:General:Height",
                      "index": 0,
                      "idType": "IRI"
                    }
                  ]
                },
                "idShort": "Height",
                "category": "CONSTANT",
                "modelType": {
                  "name": "Property"
                },
                "valueType": {
                  "dataObjectType": {
                    "name": "string"
                  }
                },
                "kind": "Instance"
              },
              {
                "value": "1",
                "semanticId": {
                  "keys": [
                    {
                      "type": "GlobalReference",
                      "local": false,
                      "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:DigitalProductPassport:General:Diameter",
                      "index": 0,
                      "idType": "IRI"
                    }
                  ]
                },
                "idShort": "Diameter",
                "category": "CONSTANT",
                "modelType": {
                  "name": "Property"
                },
                "valueType": {
                  "dataObjectType": {
                    "name": "string"
                  }
                },
                "kind": "Instance"
              }
            ],
            "kind": "Instance"
          },
          {
            "ordered": true,
            "allowDuplicates": true,
            "semanticId": {
              "keys": [
                {
                  "type": "GlobalReference",
                  "local": false,
                  "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:DigitalProductPassport:Material",
                  "index": 0,
                  "idType": "IRI"
                }
              ]
            },
            "idShort": "Material",
            "category": "CONSTANT",
            "modelType": {
              "name": "SubmodelElementCollection"
            },
            "value": [
              {
                "value": "1",
                "semanticId": {
                  "keys": [
                    {
                      "type": "GlobalReference",
                      "local": false,
                      "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:DigitalProductPassport:Material:Commodity",
                      "index": 0,
                      "idType": "IRI"
                    }
                  ]
                },
                "idShort": "Commodity_group",
                "category": "CONSTANT",
                "modelType": {
                  "name": "Property"
                },
                "valueType": {
                  "dataObjectType": {
                    "name": "string"
                  }
                },
                "kind": "Instance"
              },
              {
                "value": "1",
                "semanticId": {
                  "keys": [
                    {
                      "type": "GlobalReference",
                      "local": false,
                      "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:DigitalProductPassport:Material:Abbreviation",
                      "index": 0,
                      "idType": "IRI"
                    }
                  ]
                },
                "idShort": "Abbreviation_DIN",
                "category": "CONSTANT",
                "modelType": {
                  "name": "Property"
                },
                "valueType": {
                  "dataObjectType": {
                    "name": "string"
                  }
                },
                "kind": "Instance"
              },
              {
                "value": "1",
                "semanticId": {
                  "keys": [
                    {
                      "type": "GlobalReference",
                      "local": false,
                      "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:DigitalProductPassport:Material:Density",
                      "index": 0,
                      "idType": "IRI"
                    }
                  ]
                },
                "idShort": "Density",
                "category": "CONSTANT",
                "modelType": {
                  "name": "Property"
                },
                "valueType": {
                  "dataObjectType": {
                    "name": "string"
                  }
                },
                "kind": "Instance"
              },
              {
                "value": "1",
                "semanticId": {
                  "keys": [
                    {
                      "type": "GlobalReference",
                      "local": false,
                      "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:DigitalProductPassport:Material:Tensile",
                      "index": 0,
                      "idType": "IRI"
                    }
                  ]
                },
                "idShort": "Tensile_strength",
                "category": "CONSTANT",
                "modelType": {
                  "name": "Property"
                },
                "valueType": {
                  "dataObjectType": {
                    "name": "string"
                  }
                },
                "kind": "Instance"
              },
              {
                "value": "1",
                "semanticId": {
                  "keys": [
                    {
                      "type": "GlobalReference",
                      "local": false,
                      "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:DigitalProductPassport:Material:Heat",
                      "index": 0,
                      "idType": "IRI"
                    }
                  ]
                },
                "idShort": "Heat_resistance",
                "category": "CONSTANT",
                "modelType": {
                  "name": "Property"
                },
                "valueType": {
                  "dataObjectType": {
                    "name": "string"
                  }
                },
                "kind": "Instance"
              },
              {
                "value": "1",
                "semanticId": {
                  "keys": [
                    {
                      "type": "GlobalReference",
                      "local": false,
                      "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:DigitalProductPassport:Material:Moisture",
                      "index": 0,
                      "idType": "IRI"
                    }
                  ]
                },
                "idShort": "Moisture_absorption",
                "category": "CONSTANT",
                "modelType": {
                  "name": "Property"
                },
                "valueType": {
                  "dataObjectType": {
                    "name": "string"
                  }
                },
                "kind": "Instance"
              },
              {
                "value": "1",
                "semanticId": {
                  "keys": [
                    {
                      "type": "GlobalReference",
                      "local": false,
                      "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:DigitalProductPassport:Material:Temperature",
                      "index": 0,
                      "idType": "IRI"
                    }
                  ]
                },
                "idShort": "Temperature_range",
                "category": "CONSTANT",
                "modelType": {
                  "name": "Property"
                },
                "valueType": {
                  "dataObjectType": {
                    "name": "string"
                  }
                },
                "kind": "Instance"
              },
              {
                "value": "1",
                "semanticId": {
                  "keys": [
                    {
                      "type": "GlobalReference",
                      "local": false,
                      "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:DigitalProductPassport:Material:Weight",
                      "index": 0,
                      "idType": "IRI"
                    }
                  ]
                },
                "idShort": "Weight",
                "category": "CONSTANT",
                "modelType": {
                  "name": "Property"
                },
                "valueType": {
                  "dataObjectType": {
                    "name": "string"
                  }
                },
                "kind": "Instance"
              }
            ],
            "kind": "Instance"
          },
          {
            "ordered": true,
            "allowDuplicates": true,
            "semanticId": {
              "keys": [
                {
                  "type": "GlobalReference",
                  "local": false,
                  "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:DigitalProductPassport:Energy",
                  "index": 0,
                  "idType": "IRI"
                }
              ]
            },
            "idShort": "Energy",
            "category": "CONSTANT",
            "modelType": {
              "name": "SubmodelElementCollection"
            },
            "value": [
              {
                "value": "1",
                "semanticId": {
                  "keys": [
                    {
                      "type": "GlobalReference",
                      "local": false,
                      "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:DigitalProductPassport:Energy:neededEnergy",
                      "index": 0,
                      "idType": "IRI"
                    }
                  ]
                },
                "idShort": "neededEnergy",
                "category": "CONSTANT",
                "modelType": {
                  "name": "Property"
                },
                "valueType": {
                  "dataObjectType": {
                    "name": "string"
                  }
                },
                "kind": "Instance"
              },
              {
                "value": "1",
                "semanticId": {
                  "keys": [
                    {
                      "type": "GlobalReference",
                      "local": false,
                      "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:DigitalProductPassport:Energy:CO2",
                      "index": 0,
                      "idType": "IRI"
                    }
                  ]
                },
                "idShort": "CO2_emission",
                "category": "CONSTANT",
                "modelType": {
                  "name": "Property"
                },
                "valueType": {
                  "dataObjectType": {
                    "name": "string"
                  }
                },
                "kind": "Instance"
              },
              {
                "value": "1",
                "semanticId": {
                  "keys": [
                    {
                      "type": "GlobalReference",
                      "local": false,
                      "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:DigitalProductPassport:Energy:Renewable",
                      "index": 0,
                      "idType": "IRI"
                    }
                  ]
                },
                "idShort": "Renewable_portion",
                "category": "CONSTANT",
                "modelType": {
                  "name": "Property"
                },
                "valueType": {
                  "dataObjectType": {
                    "name": "string"
                  }
                },
                "kind": "Instance"
              },
              {
                "value": "1",
                "semanticId": {
                  "keys": [
                    {
                      "type": "GlobalReference",
                      "local": false,
                      "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:DigitalProductPassport:Energy:Electrical",
                      "index": 0,
                      "idType": "IRI"
                    }
                  ]
                },
                "idShort": "Electrical_work",
                "category": "CONSTANT",
                "modelType": {
                  "name": "Property"
                },
                "valueType": {
                  "dataObjectType": {
                    "name": "string"
                  }
                },
                "kind": "Instance"
              }
            ],
            "kind": "Instance"
          },
          {
            "ordered": true,
            "allowDuplicates": true,
            "semanticId": {
              "keys": [
                {
                  "type": "GlobalReference",
                  "local": false,
                  "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:DigitalProductPassport:Recycling",
                  "index": 0,
                  "idType": "IRI"
                }
              ]
            },
            "idShort": "Recycling",
            "category": "CONSTANT",
            "modelType": {
              "name": "SubmodelElementCollection"
            },
            "value": [
              {
                "value": "1",
                "semanticId": {
                  "keys": [
                    {
                      "type": "GlobalReference",
                      "local": false,
                      "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:DigitalProductPassport:Recycling:savedMaterial",
                      "index": 0,
                      "idType": "IRI"
                    }
                  ]
                },
                "idShort": "savedMaterial",
                "category": "CONSTANT",
                "modelType": {
                  "name": "Property"
                },
                "valueType": {
                  "dataObjectType": {
                    "name": "string"
                  }
                },
                "kind": "Instance"
              }
            ],
            "kind": "Instance"
          }
        ]
      },
      {
        "semanticId": {
          "keys": [
            {
              "type": "GlobalReference",
              "local": false,
              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback",
              "index": 0,
              "idType": "IRI"
            }
          ]
        },
        "identification": {
          "idType": "IRI",
          "id": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:Id:Submodel:CustomerFeedback:Becher-1"
        },
        "idShort": "CustomerFeedback_Becher-1",
        "category": "VARIABLE",
        "modelType": {
          "name": "Submodel"
        },
        "kind": "Instance",
        "submodelElements": [
          {
            "ordered": true,
            "allowDuplicates": true,
            "semanticId": {
              "keys": [
                {
                  "type": "GlobalReference",
                  "local": false,
                  "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:dad32a3b1b56d8bb2ca4b6859fd271d0cf2db7df",
                  "index": 0,
                  "idType": "IRI"
                }
              ]
            },
            "idShort": "dad32a3b1b56d8bb2ca4b6859fd271d0cf2db7df",
            "category": "VARIABLE",
            "modelType": {
              "name": "SubmodelElementCollection"
            },
            "value": [
              {
                "value": "03/01/2023 11:09:59",
                "semanticId": {
                  "keys": [
                    {
                      "type": "GlobalReference",
                      "local": false,
                      "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:dad32a3b1b56d8bb2ca4b6859fd271d0cf2db7df:createdAt",
                      "index": 0,
                      "idType": "IRI"
                    }
                  ]
                },
                "idShort": "createdAt",
                "category": "CONSTANT",
                "modelType": {
                  "name": "Property"
                },
                "valueType": {
                  "dataObjectType": {
                    "name": "string"
                  }
                },
                "kind": "Instance"
              },
              {
                "value": "dad32a3b1b56d8bb2ca4b6859fd271d0cf2db7df",
                "semanticId": {
                  "keys": [
                    {
                      "type": "GlobalReference",
                      "local": false,
                      "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:dad32a3b1b56d8bb2ca4b6859fd271d0cf2db7df:feedbackId",
                      "index": 0,
                      "idType": "IRI"
                    }
                  ]
                },
                "idShort": "feedbackId",
                "category": "CONSTANT",
                "modelType": {
                  "name": "Property"
                },
                "valueType": {
                  "dataObjectType": {
                    "name": "string"
                  }
                },
                "kind": "Instance"
              },
              {
                "value": "Becher war gut. Ich mochte das Aussehen.",
                "semanticId": {
                  "keys": [
                    {
                      "type": "GlobalReference",
                      "local": false,
                      "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:dad32a3b1b56d8bb2ca4b6859fd271d0cf2db7df:message",
                      "index": 0,
                      "idType": "IRI"
                    }
                  ]
                },
                "idShort": "message",
                "category": "CONSTANT",
                "modelType": {
                  "name": "Property"
                },
                "valueType": {
                  "dataObjectType": {
                    "name": "string"
                  }
                },
                "kind": "Instance"
              },
              {
                "value": "4",
                "semanticId": {
                  "keys": [
                    {
                      "type": "GlobalReference",
                      "local": false,
                      "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:dad32a3b1b56d8bb2ca4b6859fd271d0cf2db7df:stars",
                      "index": 0,
                      "idType": "IRI"
                    }
                  ]
                },
                "idShort": "stars",
                "category": "CONSTANT",
                "modelType": {
                  "name": "Property"
                },
                "valueType": {
                  "dataObjectType": {
                    "name": "float"
                  }
                },
                "kind": "Instance"
              },
              {
                "ordered": true,
                "allowDuplicates": true,
                "semanticId": {
                  "keys": [
                    {
                      "type": "GlobalReference",
                      "local": false,
                      "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:dad32a3b1b56d8bb2ca4b6859fd271d0cf2db7df:Individual",
                      "index": 0,
                      "idType": "IRI"
                    }
                  ]
                },
                "idShort": "Individual",
                "category": "CONSTANT",
                "modelType": {
                  "name": "SubmodelElementCollection"
                },
                "value": [
                  {
                    "value": "no",
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:dad32a3b1b56d8bb2ca4b6859fd271d0cf2db7df:Individual:Deposit",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Deposit_appropriate",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "Property"
                    },
                    "valueType": {
                      "dataObjectType": {
                        "name": "string"
                      }
                    },
                    "kind": "Instance"
                  },
                  {
                    "value": "EveryDay",
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:dad32a3b1b56d8bb2ca4b6859fd271d0cf2db7df:Individual:Coffee",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Coffee_frequency",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "Property"
                    },
                    "valueType": {
                      "dataObjectType": {
                        "name": "string"
                      }
                    },
                    "kind": "Instance"
                  },
                  {
                    "value": "EveryDay",
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:dad32a3b1b56d8bb2ca4b6859fd271d0cf2db7df:Individual:Usage",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Usage_CUNACup",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "Property"
                    },
                    "valueType": {
                      "dataObjectType": {
                        "name": "string"
                      }
                    },
                    "kind": "Instance"
                  },
                  {
                    "value": "SFOWL",
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:dad32a3b1b56d8bb2ca4b6859fd271d0cf2db7df:Individual:Cafe",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Cafe_recommendation",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "Property"
                    },
                    "valueType": {
                      "dataObjectType": {
                        "name": "string"
                      }
                    },
                    "kind": "Instance"
                  }
                ],
                "kind": "Instance"
              },
              {
                "ordered": true,
                "allowDuplicates": true,
                "semanticId": {
                  "keys": [
                    {
                      "type": "GlobalReference",
                      "local": false,
                      "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:dad32a3b1b56d8bb2ca4b6859fd271d0cf2db7df:General",
                      "index": 0,
                      "idType": "IRI"
                    }
                  ]
                },
                "idShort": "General",
                "category": "CONSTANT",
                "modelType": {
                  "name": "SubmodelElementCollection"
                },
                "value": [
                  {
                    "ordered": true,
                    "allowDuplicates": true,
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:dad32a3b1b56d8bb2ca4b6859fd271d0cf2db7df:General:Form",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Form",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "SubmodelElementCollection"
                    },
                    "value": [
                      {
                        "value": "0",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:dad32a3b1b56d8bb2ca4b6859fd271d0cf2db7df:Score",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Score",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      },
                      {
                        "value": "Gestalt: neutral; Geometrie: neutral; Maße: neutral; dimensions: neutral; Konstruktion: neutral; depth: neutral; Tiefe: neutral; räumlich: neutral; Form: neutral; area: neutral; length: neutral; Proportion: neutral; Gebilde: neutral; spatial: neutral; Abmaße: neutral; Größe: neutral; structure: neutral; Relation: neutral; Höhe: neutral; Breite: neutral; geometry: neutral; shape: neutral; broad: neutral; model: neutral; height: neutral; Abmessungen: neutral; Länge: neutral; Fläche: neutral; Modell: neutral; size: neutral",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:dad32a3b1b56d8bb2ca4b6859fd271d0cf2db7df:Sentiment",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Sentiment",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      }
                    ],
                    "kind": "Instance"
                  },
                  {
                    "ordered": true,
                    "allowDuplicates": true,
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:dad32a3b1b56d8bb2ca4b6859fd271d0cf2db7df:General:Looks",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Looks",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "SubmodelElementCollection"
                    },
                    "value": [
                      {
                        "value": "0.0238772",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:dad32a3b1b56d8bb2ca4b6859fd271d0cf2db7df:Score",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Score",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      },
                      {
                        "value": "blue: neutral; Hässlich: neutral; beautiful: neutral; Colorful: neutral; Ugly: neutral; Blau: neutral; Aussehen: positive; Look: neutral; schön: neutral; edel: neutral; Noble: neutral; modern: neutral; hochwertig: neutral; high-quality: neutral; colours: neutral; Rot: neutral; Lichtwirkung: neutral; Weiß: neutral; color: neutral; Grün: neutral; Schwarz: neutral; Red: neutral; Design: neutral; Optik: neutral; colour: neutral; optics: neutral; Gelb: neutral; black: neutral; yellow: neutral; lighting effect: neutral; Farbe: neutral; material look: neutral; Materialoptik: neutral; Bunt: neutral; green: neutral",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:dad32a3b1b56d8bb2ca4b6859fd271d0cf2db7df:Sentiment",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Sentiment",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      }
                    ],
                    "kind": "Instance"
                  },
                  {
                    "ordered": true,
                    "allowDuplicates": true,
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:dad32a3b1b56d8bb2ca4b6859fd271d0cf2db7df:General:Interaction",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Interaction",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "SubmodelElementCollection"
                    },
                    "value": [
                      {
                        "value": "0",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:dad32a3b1b56d8bb2ca4b6859fd271d0cf2db7df:Score",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Score",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      },
                      {
                        "value": "Handhabung: neutral; handling: neutral; Benutzerfreundlichkeit: neutral; user friendliness: neutral; Usability: neutral; Intuitiv: neutral; Intuitive: neutral; Natürlich: neutral; Natural: neutral; Simple: neutral; Bildschirm: neutral; screen: neutral; Tasten: neutral; Knöpfe: neutral; buttons: neutral; Keys: neutral; Hebel: neutral; lever: neutral; Klappe: neutral; flap: neutral; Anzeige: neutral; display: neutral; Eingabe: neutral; input: neutral; output: neutral; Ausgabe: neutral; Feedback: neutral; Benutzerschnittstelle: neutral; Einfach: neutral; user interface: neutral; Interaktion: neutral; interaction: neutral",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:dad32a3b1b56d8bb2ca4b6859fd271d0cf2db7df:Sentiment",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Sentiment",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      }
                    ],
                    "kind": "Instance"
                  },
                  {
                    "ordered": true,
                    "allowDuplicates": true,
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:dad32a3b1b56d8bb2ca4b6859fd271d0cf2db7df:General:Structure",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Structure",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "SubmodelElementCollection"
                    },
                    "value": [
                      {
                        "value": "0",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:dad32a3b1b56d8bb2ca4b6859fd271d0cf2db7df:Score",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Score",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      },
                      {
                        "value": "vocals: neutral; hidden: neutral; composition: neutral; generation: neutral; voices: neutral; components: neutral; module: neutral; great: neutral; component: neutral; modules: neutral; female: neutral; young: neutral; dependencies: neutral; active structure: neutral; desert: neutral; Artikel: neutral; item: neutral; Austausch: neutral; modular: neutral; exchange: neutral; construction: neutral; Struktur: neutral; white: neutral;  structure: neutral",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:dad32a3b1b56d8bb2ca4b6859fd271d0cf2db7df:Sentiment",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Sentiment",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      }
                    ],
                    "kind": "Instance"
                  },
                  {
                    "ordered": true,
                    "allowDuplicates": true,
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:dad32a3b1b56d8bb2ca4b6859fd271d0cf2db7df:General:Haptics",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Haptics",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "SubmodelElementCollection"
                    },
                    "value": [
                      {
                        "value": "0",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:dad32a3b1b56d8bb2ca4b6859fd271d0cf2db7df:Score",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Score",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      },
                      {
                        "value": "Oberfläche: neutral; surface: neutral; Greifen: neutral; Grasp: neutral; Gefühl: neutral; feeling: neutral; grip: neutral; Griffigkeit: neutral; touch: neutral; Berührung: neutral; Taktil: neutral; Tactile: neutral; Haptik: neutral; Anfassen: neutral; feel: neutral; Widerstand: neutral; resistance: neutral; feels: neutral; feelings: neutral",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:dad32a3b1b56d8bb2ca4b6859fd271d0cf2db7df:Sentiment",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Sentiment",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      }
                    ],
                    "kind": "Instance"
                  },
                  {
                    "ordered": true,
                    "allowDuplicates": true,
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:dad32a3b1b56d8bb2ca4b6859fd271d0cf2db7df:General:Acustics",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Acustics",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "SubmodelElementCollection"
                    },
                    "value": [
                      {
                        "value": "0",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:dad32a3b1b56d8bb2ca4b6859fd271d0cf2db7df:Score",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Score",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      },
                      {
                        "value": "Geräusche: neutral; noises: neutral; Lautstärke: neutral; volume: neutral; Quietly: neutral; Betriebsgeräusch: neutral; Lärm: neutral; operating noise: neutral; noise: neutral; Leise: neutral; Laut: neutral; audible: neutral; Audio: neutral; Ton: neutral; Akustik: neutral; acoustics: neutral; hörbar: neutral; akustisch: neutral; acoustically: neutral; wahrnehmbar: neutral; Schall: neutral; sound: neutral; perceptible: neutral; Echo: neutral; Klang: neutral; Tonqualität: neutral; sound quality: neutral; Rauschen: neutral; rush: neutral; Krach: neutral; According to: neutral",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:dad32a3b1b56d8bb2ca4b6859fd271d0cf2db7df:Sentiment",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Sentiment",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      }
                    ],
                    "kind": "Instance"
                  },
                  {
                    "ordered": true,
                    "allowDuplicates": true,
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:dad32a3b1b56d8bb2ca4b6859fd271d0cf2db7df:General:Assembly",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Assembly_Installation",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "SubmodelElementCollection"
                    },
                    "value": [
                      {
                        "value": "0",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:dad32a3b1b56d8bb2ca4b6859fd271d0cf2db7df:Score",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Score",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      },
                      {
                        "value": "Montageschritte: neutral; Anfügen: neutral; assembly steps: neutral; append: neutral; Zusammenbau: neutral; assembly: neutral; Montage: neutral; Installation: neutral; Einbau: neutral; Einbauen: neutral; build in: neutral; work steps: neutral; installieren: neutral; to install: neutral; Arbeitsschritte: neutral; Aufbau: neutral; Inbetriebnahme: neutral; setup: neutral; Anschließen: neutral; Connect: neutral; Aufstellen: neutral; Set up: neutral; Auspacken: neutral; unpacking: neutral; Einsetzen: neutral; Deploy: neutral; Nutzen: neutral; To use: neutral; Montage und Installation: neutral",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:dad32a3b1b56d8bb2ca4b6859fd271d0cf2db7df:Sentiment",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Sentiment",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      }
                    ],
                    "kind": "Instance"
                  },
                  {
                    "ordered": true,
                    "allowDuplicates": true,
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:dad32a3b1b56d8bb2ca4b6859fd271d0cf2db7df:General:Material",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Material",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "SubmodelElementCollection"
                    },
                    "value": [
                      {
                        "value": "0",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:dad32a3b1b56d8bb2ca4b6859fd271d0cf2db7df:Score",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Score",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      },
                      {
                        "value": "Material: neutral; Robust: neutral; Haltbar: neutral; Durable: neutral; durability: neutral; Robustheit: neutral; robustness: neutral; Haltbarkeit: neutral; Materialien: neutral; materials: neutral; Plastik: neutral; plastic: neutral; metal: neutral; Metall: neutral; Eisen: neutral; Holz: neutral; wood: neutral; iron: neutral; Stahl: neutral; steel: neutral; Oberflächenstruktur: neutral; surface structure: neutral; Rauheitsgrad: neutral; degree of roughness: neutral; Härtegrad: neutral; Festigkeit: neutral; degree of hardness: neutral; strength: neutral; Biegfestigkeit: neutral; Dichte: neutral; density: neutral; Probe: neutral; sample: neutral; flexural strength: neutral; material sample: neutral; Materialprobe: neutral",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:dad32a3b1b56d8bb2ca4b6859fd271d0cf2db7df:Sentiment",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Sentiment",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      }
                    ],
                    "kind": "Instance"
                  }
                ],
                "kind": "Instance"
              }
            ],
            "kind": "Instance"
          },
          {
            "ordered": true,
            "allowDuplicates": true,
            "semanticId": {
              "keys": [
                {
                  "type": "GlobalReference",
                  "local": false,
                  "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:c85518aa0f631389dfb9f46f78a38814dee437b9",
                  "index": 0,
                  "idType": "IRI"
                }
              ]
            },
            "idShort": "c85518aa0f631389dfb9f46f78a38814dee437b9",
            "category": "VARIABLE",
            "modelType": {
              "name": "SubmodelElementCollection"
            },
            "value": [
              {
                "value": "03/01/2023 11:09:59",
                "semanticId": {
                  "keys": [
                    {
                      "type": "GlobalReference",
                      "local": false,
                      "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:c85518aa0f631389dfb9f46f78a38814dee437b9:createdAt",
                      "index": 0,
                      "idType": "IRI"
                    }
                  ]
                },
                "idShort": "createdAt",
                "category": "CONSTANT",
                "modelType": {
                  "name": "Property"
                },
                "valueType": {
                  "dataObjectType": {
                    "name": "string"
                  }
                },
                "kind": "Instance"
              },
              {
                "value": "c85518aa0f631389dfb9f46f78a38814dee437b9",
                "semanticId": {
                  "keys": [
                    {
                      "type": "GlobalReference",
                      "local": false,
                      "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:c85518aa0f631389dfb9f46f78a38814dee437b9:feedbackId",
                      "index": 0,
                      "idType": "IRI"
                    }
                  ]
                },
                "idShort": "feedbackId",
                "category": "CONSTANT",
                "modelType": {
                  "name": "Property"
                },
                "valueType": {
                  "dataObjectType": {
                    "name": "string"
                  }
                },
                "kind": "Instance"
              },
              {
                "value": "testtetstesttes",
                "semanticId": {
                  "keys": [
                    {
                      "type": "GlobalReference",
                      "local": false,
                      "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:c85518aa0f631389dfb9f46f78a38814dee437b9:message",
                      "index": 0,
                      "idType": "IRI"
                    }
                  ]
                },
                "idShort": "message",
                "category": "CONSTANT",
                "modelType": {
                  "name": "Property"
                },
                "valueType": {
                  "dataObjectType": {
                    "name": "string"
                  }
                },
                "kind": "Instance"
              },
              {
                "value": "4",
                "semanticId": {
                  "keys": [
                    {
                      "type": "GlobalReference",
                      "local": false,
                      "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:c85518aa0f631389dfb9f46f78a38814dee437b9:stars",
                      "index": 0,
                      "idType": "IRI"
                    }
                  ]
                },
                "idShort": "stars",
                "category": "CONSTANT",
                "modelType": {
                  "name": "Property"
                },
                "valueType": {
                  "dataObjectType": {
                    "name": "float"
                  }
                },
                "kind": "Instance"
              },
              {
                "ordered": true,
                "allowDuplicates": true,
                "semanticId": {
                  "keys": [
                    {
                      "type": "GlobalReference",
                      "local": false,
                      "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:c85518aa0f631389dfb9f46f78a38814dee437b9:Individual",
                      "index": 0,
                      "idType": "IRI"
                    }
                  ]
                },
                "idShort": "Individual",
                "category": "CONSTANT",
                "modelType": {
                  "name": "SubmodelElementCollection"
                },
                "value": [
                  {
                    "value": "no",
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:c85518aa0f631389dfb9f46f78a38814dee437b9:Individual:Deposit",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Deposit_appropriate",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "Property"
                    },
                    "valueType": {
                      "dataObjectType": {
                        "name": "string"
                      }
                    },
                    "kind": "Instance"
                  },
                  {
                    "value": "EveryDay",
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:c85518aa0f631389dfb9f46f78a38814dee437b9:Individual:Coffee",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Coffee_frequency",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "Property"
                    },
                    "valueType": {
                      "dataObjectType": {
                        "name": "string"
                      }
                    },
                    "kind": "Instance"
                  },
                  {
                    "value": "EveryDay",
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:c85518aa0f631389dfb9f46f78a38814dee437b9:Individual:Usage",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Usage_CUNACup",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "Property"
                    },
                    "valueType": {
                      "dataObjectType": {
                        "name": "string"
                      }
                    },
                    "kind": "Instance"
                  },
                  {
                    "value": "fghj",
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:c85518aa0f631389dfb9f46f78a38814dee437b9:Individual:Cafe",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Cafe_recommendation",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "Property"
                    },
                    "valueType": {
                      "dataObjectType": {
                        "name": "string"
                      }
                    },
                    "kind": "Instance"
                  }
                ],
                "kind": "Instance"
              },
              {
                "ordered": true,
                "allowDuplicates": true,
                "semanticId": {
                  "keys": [
                    {
                      "type": "GlobalReference",
                      "local": false,
                      "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:c85518aa0f631389dfb9f46f78a38814dee437b9:General",
                      "index": 0,
                      "idType": "IRI"
                    }
                  ]
                },
                "idShort": "General",
                "category": "CONSTANT",
                "modelType": {
                  "name": "SubmodelElementCollection"
                },
                "value": [
                  {
                    "ordered": true,
                    "allowDuplicates": true,
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:c85518aa0f631389dfb9f46f78a38814dee437b9:General:Form",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Form",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "SubmodelElementCollection"
                    },
                    "value": [
                      {
                        "value": "0",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:c85518aa0f631389dfb9f46f78a38814dee437b9:Score",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Score",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      },
                      {
                        "value": "Gestalt: neutral; length: neutral; Abmaße: neutral; räumlich: neutral; height: neutral; Höhe: neutral; Tiefe: neutral; Form: neutral; Geometrie: neutral; Proportion: neutral; Gebilde: neutral; Konstruktion: neutral; Länge: neutral; model: neutral; broad: neutral; Maße: neutral; area: neutral; structure: neutral; size: neutral; spatial: neutral; Modell: neutral; Größe: neutral; Fläche: neutral; depth: neutral; Abmessungen: neutral; Breite: neutral; Relation: neutral; shape: neutral; geometry: neutral; dimensions: neutral",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:c85518aa0f631389dfb9f46f78a38814dee437b9:Sentiment",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Sentiment",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      }
                    ],
                    "kind": "Instance"
                  },
                  {
                    "ordered": true,
                    "allowDuplicates": true,
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:c85518aa0f631389dfb9f46f78a38814dee437b9:General:Looks",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Looks",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "SubmodelElementCollection"
                    },
                    "value": [
                      {
                        "value": "0",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:c85518aa0f631389dfb9f46f78a38814dee437b9:Score",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Score",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      },
                      {
                        "value": "Design: neutral; Materialoptik: neutral; material look: neutral; Gelb: neutral; yellow: neutral; optics: neutral; green: neutral; Optik: neutral; Red: neutral; Schwarz: neutral; black: neutral; Weiß: neutral; Bunt: neutral; Grün: neutral; Hässlich: neutral; Ugly: neutral; Blau: neutral; blue: neutral; Look: neutral; Rot: neutral; schön: neutral; beautiful: neutral; edel: neutral; Noble: neutral; modern: neutral; hochwertig: neutral; high-quality: neutral; Colorful: neutral; Aussehen: neutral; colours: neutral; lighting effect: neutral; Lichtwirkung: neutral; Farbe: neutral; colour: neutral; color: neutral",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:c85518aa0f631389dfb9f46f78a38814dee437b9:Sentiment",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Sentiment",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      }
                    ],
                    "kind": "Instance"
                  },
                  {
                    "ordered": true,
                    "allowDuplicates": true,
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:c85518aa0f631389dfb9f46f78a38814dee437b9:General:Interaction",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Interaction",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "SubmodelElementCollection"
                    },
                    "value": [
                      {
                        "value": "0",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:c85518aa0f631389dfb9f46f78a38814dee437b9:Score",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Score",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      },
                      {
                        "value": "Handhabung: neutral; handling: neutral; Benutzerfreundlichkeit: neutral; user friendliness: neutral; Intuitiv: neutral; Intuitive: neutral; Natürlich: neutral; Natural: neutral; Simple: neutral; Einfach: neutral; Bildschirm: neutral; screen: neutral; Tasten: neutral; Keys: neutral; Knöpfe: neutral; buttons: neutral; Hebel: neutral; lever: neutral; flap: neutral; Klappe: neutral; Anzeige: neutral; display: neutral; Eingabe: neutral; input: neutral; Ausgabe: neutral; output: neutral; Feedback: neutral; Benutzerschnittstelle: neutral; user interface: neutral; Usability: neutral; Interaktion: neutral; interaction: neutral",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:c85518aa0f631389dfb9f46f78a38814dee437b9:Sentiment",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Sentiment",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      }
                    ],
                    "kind": "Instance"
                  },
                  {
                    "ordered": true,
                    "allowDuplicates": true,
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:c85518aa0f631389dfb9f46f78a38814dee437b9:General:Structure",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Structure",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "SubmodelElementCollection"
                    },
                    "value": [
                      {
                        "value": "0",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:c85518aa0f631389dfb9f46f78a38814dee437b9:Score",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Score",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      },
                      {
                        "value": "white: neutral; vocals: neutral; hidden: neutral; composition: neutral; component: neutral; desert: neutral; components: neutral; voices: neutral; module: neutral; great: neutral; modules: neutral; female: neutral; young: neutral; dependencies: neutral; active structure: neutral; Artikel: neutral; item: neutral; Austausch: neutral; exchange: neutral; modular: neutral; generation: neutral; construction: neutral; Struktur: neutral;  structure: neutral",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:c85518aa0f631389dfb9f46f78a38814dee437b9:Sentiment",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Sentiment",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      }
                    ],
                    "kind": "Instance"
                  },
                  {
                    "ordered": true,
                    "allowDuplicates": true,
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:c85518aa0f631389dfb9f46f78a38814dee437b9:General:Haptics",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Haptics",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "SubmodelElementCollection"
                    },
                    "value": [
                      {
                        "value": "0",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:c85518aa0f631389dfb9f46f78a38814dee437b9:Score",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Score",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      },
                      {
                        "value": "Oberfläche: neutral; surface: neutral; Greifen: neutral; Grasp: neutral; Gefühl: neutral; feeling: neutral; Griffigkeit: neutral; grip: neutral; Berührung: neutral; touch: neutral; Taktil: neutral; Tactile: neutral; Widerstand: neutral; resistance: neutral; Haptik: neutral; Anfassen: neutral; feel: neutral; feelings: neutral; feels: neutral",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:c85518aa0f631389dfb9f46f78a38814dee437b9:Sentiment",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Sentiment",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      }
                    ],
                    "kind": "Instance"
                  },
                  {
                    "ordered": true,
                    "allowDuplicates": true,
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:c85518aa0f631389dfb9f46f78a38814dee437b9:General:Acustics",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Acustics",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "SubmodelElementCollection"
                    },
                    "value": [
                      {
                        "value": "0",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:c85518aa0f631389dfb9f46f78a38814dee437b9:Score",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Score",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      },
                      {
                        "value": "Geräusche: neutral; noises: neutral; Lautstärke: neutral; volume: neutral; operating noise: neutral; Leise: neutral; Lärm: neutral; Betriebsgeräusch: neutral; noise: neutral; Quietly: neutral; Laut: neutral; According to: neutral; hörbar: neutral; Audio: neutral; Ton: neutral; Akustik: neutral; acoustics: neutral; akustisch: neutral; acoustically: neutral; perceptible: neutral; wahrnehmbar: neutral; Schall: neutral; sound: neutral; Klang: neutral; Tonqualität: neutral; sound quality: neutral; Rauschen: neutral; rush: neutral; Krach: neutral; Echo: neutral; audible: neutral",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:c85518aa0f631389dfb9f46f78a38814dee437b9:Sentiment",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Sentiment",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      }
                    ],
                    "kind": "Instance"
                  },
                  {
                    "ordered": true,
                    "allowDuplicates": true,
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:c85518aa0f631389dfb9f46f78a38814dee437b9:General:Assembly",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Assembly_Installation",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "SubmodelElementCollection"
                    },
                    "value": [
                      {
                        "value": "0",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:c85518aa0f631389dfb9f46f78a38814dee437b9:Score",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Score",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      },
                      {
                        "value": "Montageschritte: neutral; assembly steps: neutral; Anfügen: neutral; Zusammenbau: neutral; assembly: neutral; append: neutral; Installation: neutral; Montage: neutral; Arbeitsschritte: neutral; Einbau: neutral; Einbauen: neutral; build in: neutral; installieren: neutral; to install: neutral; Inbetriebnahme: neutral; Aufbau: neutral; Anschließen: neutral; setup: neutral; Set up: neutral; Aufstellen: neutral; Connect: neutral; unpacking: neutral; Einsetzen: neutral; To use: neutral; Auspacken: neutral; Deploy: neutral; Nutzen: neutral; work steps: neutral; Montage und Installation: neutral",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:c85518aa0f631389dfb9f46f78a38814dee437b9:Sentiment",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Sentiment",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      }
                    ],
                    "kind": "Instance"
                  },
                  {
                    "ordered": true,
                    "allowDuplicates": true,
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:c85518aa0f631389dfb9f46f78a38814dee437b9:General:Material",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Material",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "SubmodelElementCollection"
                    },
                    "value": [
                      {
                        "value": "0",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:c85518aa0f631389dfb9f46f78a38814dee437b9:Score",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Score",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      },
                      {
                        "value": "Material: neutral; Robust: neutral; Haltbarkeit: neutral; durability: neutral; Durable: neutral; Haltbar: neutral; Robustheit: neutral; robustness: neutral; Materialien: neutral; materials: neutral; plastic: neutral; Metall: neutral; metal: neutral; iron: neutral; Holz: neutral; Eisen: neutral; wood: neutral; Stahl: neutral; steel: neutral; Oberflächenstruktur: neutral; surface structure: neutral; Rauheitsgrad: neutral; degree of roughness: neutral; Härtegrad: neutral; degree of hardness: neutral; Festigkeit: neutral; strength: neutral; Biegfestigkeit: neutral; Dichte: neutral; flexural strength: neutral; density: neutral; Probe: neutral; sample: neutral; Materialprobe: neutral; material sample: neutral; Plastik: neutral",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:c85518aa0f631389dfb9f46f78a38814dee437b9:Sentiment",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Sentiment",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      }
                    ],
                    "kind": "Instance"
                  }
                ],
                "kind": "Instance"
              }
            ],
            "kind": "Instance"
          },
          {
            "ordered": true,
            "allowDuplicates": true,
            "semanticId": {
              "keys": [
                {
                  "type": "GlobalReference",
                  "local": false,
                  "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:6fb0b6712f6bee1b8bc64a8abfcc00022da66f0a",
                  "index": 0,
                  "idType": "IRI"
                }
              ]
            },
            "idShort": "6fb0b6712f6bee1b8bc64a8abfcc00022da66f0a",
            "category": "VARIABLE",
            "modelType": {
              "name": "SubmodelElementCollection"
            },
            "value": [
              {
                "value": "03/01/2023 11:09:59",
                "semanticId": {
                  "keys": [
                    {
                      "type": "GlobalReference",
                      "local": false,
                      "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:6fb0b6712f6bee1b8bc64a8abfcc00022da66f0a:createdAt",
                      "index": 0,
                      "idType": "IRI"
                    }
                  ]
                },
                "idShort": "createdAt",
                "category": "CONSTANT",
                "modelType": {
                  "name": "Property"
                },
                "valueType": {
                  "dataObjectType": {
                    "name": "string"
                  }
                },
                "kind": "Instance"
              },
              {
                "value": "6fb0b6712f6bee1b8bc64a8abfcc00022da66f0a",
                "semanticId": {
                  "keys": [
                    {
                      "type": "GlobalReference",
                      "local": false,
                      "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:6fb0b6712f6bee1b8bc64a8abfcc00022da66f0a:feedbackId",
                      "index": 0,
                      "idType": "IRI"
                    }
                  ]
                },
                "idShort": "feedbackId",
                "category": "CONSTANT",
                "modelType": {
                  "name": "Property"
                },
                "valueType": {
                  "dataObjectType": {
                    "name": "string"
                  }
                },
                "kind": "Instance"
              },
              {
                "value": "Das ist ein guter Becher. Der Kaffee war lecker.",
                "semanticId": {
                  "keys": [
                    {
                      "type": "GlobalReference",
                      "local": false,
                      "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:6fb0b6712f6bee1b8bc64a8abfcc00022da66f0a:message",
                      "index": 0,
                      "idType": "IRI"
                    }
                  ]
                },
                "idShort": "message",
                "category": "CONSTANT",
                "modelType": {
                  "name": "Property"
                },
                "valueType": {
                  "dataObjectType": {
                    "name": "string"
                  }
                },
                "kind": "Instance"
              },
              {
                "value": "4",
                "semanticId": {
                  "keys": [
                    {
                      "type": "GlobalReference",
                      "local": false,
                      "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:6fb0b6712f6bee1b8bc64a8abfcc00022da66f0a:stars",
                      "index": 0,
                      "idType": "IRI"
                    }
                  ]
                },
                "idShort": "stars",
                "category": "CONSTANT",
                "modelType": {
                  "name": "Property"
                },
                "valueType": {
                  "dataObjectType": {
                    "name": "float"
                  }
                },
                "kind": "Instance"
              },
              {
                "ordered": true,
                "allowDuplicates": true,
                "semanticId": {
                  "keys": [
                    {
                      "type": "GlobalReference",
                      "local": false,
                      "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:6fb0b6712f6bee1b8bc64a8abfcc00022da66f0a:Individual",
                      "index": 0,
                      "idType": "IRI"
                    }
                  ]
                },
                "idShort": "Individual",
                "category": "CONSTANT",
                "modelType": {
                  "name": "SubmodelElementCollection"
                },
                "value": [
                  {
                    "value": "yes",
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:6fb0b6712f6bee1b8bc64a8abfcc00022da66f0a:Individual:Deposit",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Deposit_appropriate",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "Property"
                    },
                    "valueType": {
                      "dataObjectType": {
                        "name": "string"
                      }
                    },
                    "kind": "Instance"
                  },
                  {
                    "value": "EveryDay",
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:6fb0b6712f6bee1b8bc64a8abfcc00022da66f0a:Individual:Coffee",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Coffee_frequency",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "Property"
                    },
                    "valueType": {
                      "dataObjectType": {
                        "name": "string"
                      }
                    },
                    "kind": "Instance"
                  },
                  {
                    "value": "EveryDay",
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:6fb0b6712f6bee1b8bc64a8abfcc00022da66f0a:Individual:Usage",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Usage_CUNACup",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "Property"
                    },
                    "valueType": {
                      "dataObjectType": {
                        "name": "string"
                      }
                    },
                    "kind": "Instance"
                  },
                  {
                    "value": "SFOWL",
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:6fb0b6712f6bee1b8bc64a8abfcc00022da66f0a:Individual:Cafe",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Cafe_recommendation",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "Property"
                    },
                    "valueType": {
                      "dataObjectType": {
                        "name": "string"
                      }
                    },
                    "kind": "Instance"
                  }
                ],
                "kind": "Instance"
              },
              {
                "ordered": true,
                "allowDuplicates": true,
                "semanticId": {
                  "keys": [
                    {
                      "type": "GlobalReference",
                      "local": false,
                      "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:6fb0b6712f6bee1b8bc64a8abfcc00022da66f0a:General",
                      "index": 0,
                      "idType": "IRI"
                    }
                  ]
                },
                "idShort": "General",
                "category": "CONSTANT",
                "modelType": {
                  "name": "SubmodelElementCollection"
                },
                "value": [
                  {
                    "ordered": true,
                    "allowDuplicates": true,
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:6fb0b6712f6bee1b8bc64a8abfcc00022da66f0a:General:Form",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Form",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "SubmodelElementCollection"
                    },
                    "value": [
                      {
                        "value": "0",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:6fb0b6712f6bee1b8bc64a8abfcc00022da66f0a:Score",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Score",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      },
                      {
                        "value": "spatial: neutral; Abmessungen: neutral; Relation: neutral; depth: neutral; length: neutral; Form: neutral; shape: neutral; Geometrie: neutral; geometry: neutral; Gebilde: neutral; structure: neutral; Modell: neutral; model: neutral; Maße: neutral; dimensions: neutral; Abmaße: neutral; Größe: neutral; size: neutral; Länge: neutral; Breite: neutral; broad: neutral; Konstruktion: neutral; height: neutral; Proportion: neutral; Tiefe: neutral; Höhe: neutral; area: neutral; räumlich: neutral; Fläche: neutral; Gestalt: neutral",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:6fb0b6712f6bee1b8bc64a8abfcc00022da66f0a:Sentiment",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Sentiment",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      }
                    ],
                    "kind": "Instance"
                  },
                  {
                    "ordered": true,
                    "allowDuplicates": true,
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:6fb0b6712f6bee1b8bc64a8abfcc00022da66f0a:General:Looks",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Looks",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "SubmodelElementCollection"
                    },
                    "value": [
                      {
                        "value": "0",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:6fb0b6712f6bee1b8bc64a8abfcc00022da66f0a:Score",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Score",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      },
                      {
                        "value": "Grün: neutral; colours: neutral; hochwertig: neutral; Look: neutral; Aussehen: neutral; Farbe: neutral; color: neutral; colour: neutral; lighting effect: neutral; Optik: neutral; optics: neutral; Design: neutral; Materialoptik: neutral; Gelb: neutral; yellow: neutral; green: neutral; Lichtwirkung: neutral; Red: neutral; Schwarz: neutral; black: neutral; Weiß: neutral; material look: neutral; Colorful: neutral; Hässlich: neutral; Ugly: neutral; Blau: neutral; blue: neutral; schön: neutral; Rot: neutral; edel: neutral; Noble: neutral; modern: neutral; high-quality: neutral; Bunt: neutral; beautiful: neutral",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:6fb0b6712f6bee1b8bc64a8abfcc00022da66f0a:Sentiment",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Sentiment",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      }
                    ],
                    "kind": "Instance"
                  },
                  {
                    "ordered": true,
                    "allowDuplicates": true,
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:6fb0b6712f6bee1b8bc64a8abfcc00022da66f0a:General:Interaction",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Interaction",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "SubmodelElementCollection"
                    },
                    "value": [
                      {
                        "value": "0",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:6fb0b6712f6bee1b8bc64a8abfcc00022da66f0a:Score",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Score",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      },
                      {
                        "value": "Handhabung: neutral; handling: neutral; Benutzerfreundlichkeit: neutral; user friendliness: neutral; Usability: neutral; Intuitiv: neutral; Intuitive: neutral; Natürlich: neutral; Natural: neutral; Einfach: neutral; Simple: neutral; Bildschirm: neutral; screen: neutral; Tasten: neutral; Keys: neutral; Knöpfe: neutral; buttons: neutral; Hebel: neutral; lever: neutral; Klappe: neutral; flap: neutral; Anzeige: neutral; display: neutral; Eingabe: neutral; input: neutral; Ausgabe: neutral; output: neutral; Feedback: neutral; Benutzerschnittstelle: neutral; user interface: neutral; Interaktion: neutral; interaction: neutral",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:6fb0b6712f6bee1b8bc64a8abfcc00022da66f0a:Sentiment",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Sentiment",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      }
                    ],
                    "kind": "Instance"
                  },
                  {
                    "ordered": true,
                    "allowDuplicates": true,
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:6fb0b6712f6bee1b8bc64a8abfcc00022da66f0a:General:Structure",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Structure",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "SubmodelElementCollection"
                    },
                    "value": [
                      {
                        "value": "0",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:6fb0b6712f6bee1b8bc64a8abfcc00022da66f0a:Score",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Score",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      },
                      {
                        "value": "vocals: neutral; hidden: neutral; composition: neutral; generation: neutral; component: neutral; desert: neutral; components: neutral; voices: neutral; module: neutral; great: neutral; modules: neutral; female: neutral; dependencies: neutral; young: neutral; active structure: neutral; Artikel: neutral; item: neutral; Austausch: neutral; exchange: neutral; modular: neutral; construction: neutral; Struktur: neutral;  structure: neutral; white: neutral",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:6fb0b6712f6bee1b8bc64a8abfcc00022da66f0a:Sentiment",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Sentiment",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      }
                    ],
                    "kind": "Instance"
                  },
                  {
                    "ordered": true,
                    "allowDuplicates": true,
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:6fb0b6712f6bee1b8bc64a8abfcc00022da66f0a:General:Haptics",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Haptics",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "SubmodelElementCollection"
                    },
                    "value": [
                      {
                        "value": "0",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:6fb0b6712f6bee1b8bc64a8abfcc00022da66f0a:Score",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Score",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      },
                      {
                        "value": "Gefühl: neutral; feeling: neutral; Griffigkeit: neutral; grip: neutral; Berührung: neutral; touch: neutral; Taktil: neutral; Tactile: neutral; Widerstand: neutral; resistance: neutral; Haptik: neutral; feel: neutral; Anfassen: neutral; feelings: neutral; feels: neutral; surface: neutral; Grasp: neutral; Oberfläche: neutral; Greifen: neutral",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:6fb0b6712f6bee1b8bc64a8abfcc00022da66f0a:Sentiment",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Sentiment",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      }
                    ],
                    "kind": "Instance"
                  },
                  {
                    "ordered": true,
                    "allowDuplicates": true,
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:6fb0b6712f6bee1b8bc64a8abfcc00022da66f0a:General:Acustics",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Acustics",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "SubmodelElementCollection"
                    },
                    "value": [
                      {
                        "value": "0",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:6fb0b6712f6bee1b8bc64a8abfcc00022da66f0a:Score",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Score",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      },
                      {
                        "value": "Geräusche: neutral; noises: neutral; Lautstärke: neutral; volume: neutral; Leise: neutral; Quietly: neutral; Betriebsgeräusch: neutral; operating noise: neutral; Lärm: neutral; noise: neutral; Laut: neutral; According to: neutral; hörbar: neutral; audible: neutral; Audio: neutral; Ton: neutral; Akustik: neutral; acoustics: neutral; akustisch: neutral; acoustically: neutral; wahrnehmbar: neutral; perceptible: neutral; Schall: neutral; sound: neutral; Echo: neutral; Klang: neutral; Tonqualität: neutral; sound quality: neutral; Rauschen: neutral; rush: neutral; Krach: neutral",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:6fb0b6712f6bee1b8bc64a8abfcc00022da66f0a:Sentiment",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Sentiment",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      }
                    ],
                    "kind": "Instance"
                  },
                  {
                    "ordered": true,
                    "allowDuplicates": true,
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:6fb0b6712f6bee1b8bc64a8abfcc00022da66f0a:General:Assembly",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Assembly_Installation",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "SubmodelElementCollection"
                    },
                    "value": [
                      {
                        "value": "0",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:6fb0b6712f6bee1b8bc64a8abfcc00022da66f0a:Score",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Score",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      },
                      {
                        "value": "Montageschritte: neutral; assembly steps: neutral; Anfügen: neutral; append: neutral; Zusammenbau: neutral; assembly: neutral; Installation: neutral; Montage: neutral; Arbeitsschritte: neutral; work steps: neutral; Einbau: neutral; Einbauen: neutral; build in: neutral; installieren: neutral; to install: neutral; Inbetriebnahme: neutral; Aufbau: neutral; setup: neutral; Anschließen: neutral; Connect: neutral; Aufstellen: neutral; Set up: neutral; Auspacken: neutral; unpacking: neutral; Einsetzen: neutral; Deploy: neutral; Nutzen: neutral; To use: neutral; Montage und Installation: neutral",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:6fb0b6712f6bee1b8bc64a8abfcc00022da66f0a:Sentiment",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Sentiment",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      }
                    ],
                    "kind": "Instance"
                  },
                  {
                    "ordered": true,
                    "allowDuplicates": true,
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:6fb0b6712f6bee1b8bc64a8abfcc00022da66f0a:General:Material",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Material",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "SubmodelElementCollection"
                    },
                    "value": [
                      {
                        "value": "0",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:6fb0b6712f6bee1b8bc64a8abfcc00022da66f0a:Score",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Score",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      },
                      {
                        "value": "Material: neutral; Robust: neutral; Haltbar: neutral; Durable: neutral; Haltbarkeit: neutral; durability: neutral; Robustheit: neutral; robustness: neutral; Materialien: neutral; materials: neutral; Plastik: neutral; plastic: neutral; Metall: neutral; metal: neutral; Eisen: neutral; iron: neutral; Holz: neutral; wood: neutral; Stahl: neutral; steel: neutral; Oberflächenstruktur: neutral; surface structure: neutral; Rauheitsgrad: neutral; degree of roughness: neutral; Härtegrad: neutral; degree of hardness: neutral; Festigkeit: neutral; strength: neutral; Biegfestigkeit: neutral; flexural strength: neutral; Dichte: neutral; density: neutral; Probe: neutral; sample: neutral; Materialprobe: neutral; material sample: neutral",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:6fb0b6712f6bee1b8bc64a8abfcc00022da66f0a:Sentiment",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Sentiment",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      }
                    ],
                    "kind": "Instance"
                  }
                ],
                "kind": "Instance"
              }
            ],
            "kind": "Instance"
          },
          {
            "ordered": true,
            "allowDuplicates": true,
            "semanticId": {
              "keys": [
                {
                  "type": "GlobalReference",
                  "local": false,
                  "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:75a426dae2f7e3a170fbb3cfce97a25a5bb3cd4a",
                  "index": 0,
                  "idType": "IRI"
                }
              ]
            },
            "idShort": "75a426dae2f7e3a170fbb3cfce97a25a5bb3cd4a",
            "category": "VARIABLE",
            "modelType": {
              "name": "SubmodelElementCollection"
            },
            "value": [
              {
                "value": "03/01/2023 11:09:59",
                "semanticId": {
                  "keys": [
                    {
                      "type": "GlobalReference",
                      "local": false,
                      "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:75a426dae2f7e3a170fbb3cfce97a25a5bb3cd4a:createdAt",
                      "index": 0,
                      "idType": "IRI"
                    }
                  ]
                },
                "idShort": "createdAt",
                "category": "CONSTANT",
                "modelType": {
                  "name": "Property"
                },
                "valueType": {
                  "dataObjectType": {
                    "name": "string"
                  }
                },
                "kind": "Instance"
              },
              {
                "value": "75a426dae2f7e3a170fbb3cfce97a25a5bb3cd4a",
                "semanticId": {
                  "keys": [
                    {
                      "type": "GlobalReference",
                      "local": false,
                      "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:75a426dae2f7e3a170fbb3cfce97a25a5bb3cd4a:feedbackId",
                      "index": 0,
                      "idType": "IRI"
                    }
                  ]
                },
                "idShort": "feedbackId",
                "category": "CONSTANT",
                "modelType": {
                  "name": "Property"
                },
                "valueType": {
                  "dataObjectType": {
                    "name": "string"
                  }
                },
                "kind": "Instance"
              },
              {
                "value": "Becher war gut. Mir gefällt das Aussehen.",
                "semanticId": {
                  "keys": [
                    {
                      "type": "GlobalReference",
                      "local": false,
                      "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:75a426dae2f7e3a170fbb3cfce97a25a5bb3cd4a:message",
                      "index": 0,
                      "idType": "IRI"
                    }
                  ]
                },
                "idShort": "message",
                "category": "CONSTANT",
                "modelType": {
                  "name": "Property"
                },
                "valueType": {
                  "dataObjectType": {
                    "name": "string"
                  }
                },
                "kind": "Instance"
              },
              {
                "value": "5",
                "semanticId": {
                  "keys": [
                    {
                      "type": "GlobalReference",
                      "local": false,
                      "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:75a426dae2f7e3a170fbb3cfce97a25a5bb3cd4a:stars",
                      "index": 0,
                      "idType": "IRI"
                    }
                  ]
                },
                "idShort": "stars",
                "category": "CONSTANT",
                "modelType": {
                  "name": "Property"
                },
                "valueType": {
                  "dataObjectType": {
                    "name": "float"
                  }
                },
                "kind": "Instance"
              },
              {
                "ordered": true,
                "allowDuplicates": true,
                "semanticId": {
                  "keys": [
                    {
                      "type": "GlobalReference",
                      "local": false,
                      "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:75a426dae2f7e3a170fbb3cfce97a25a5bb3cd4a:Individual",
                      "index": 0,
                      "idType": "IRI"
                    }
                  ]
                },
                "idShort": "Individual",
                "category": "CONSTANT",
                "modelType": {
                  "name": "SubmodelElementCollection"
                },
                "value": [
                  {
                    "value": "no",
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:75a426dae2f7e3a170fbb3cfce97a25a5bb3cd4a:Individual:Deposit",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Deposit_appropriate",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "Property"
                    },
                    "valueType": {
                      "dataObjectType": {
                        "name": "string"
                      }
                    },
                    "kind": "Instance"
                  },
                  {
                    "value": "EveryDay",
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:75a426dae2f7e3a170fbb3cfce97a25a5bb3cd4a:Individual:Coffee",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Coffee_frequency",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "Property"
                    },
                    "valueType": {
                      "dataObjectType": {
                        "name": "string"
                      }
                    },
                    "kind": "Instance"
                  },
                  {
                    "value": "EveryDay",
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:75a426dae2f7e3a170fbb3cfce97a25a5bb3cd4a:Individual:Usage",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Usage_CUNACup",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "Property"
                    },
                    "valueType": {
                      "dataObjectType": {
                        "name": "string"
                      }
                    },
                    "kind": "Instance"
                  },
                  {
                    "value": "SFOWl",
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:75a426dae2f7e3a170fbb3cfce97a25a5bb3cd4a:Individual:Cafe",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Cafe_recommendation",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "Property"
                    },
                    "valueType": {
                      "dataObjectType": {
                        "name": "string"
                      }
                    },
                    "kind": "Instance"
                  }
                ],
                "kind": "Instance"
              },
              {
                "ordered": true,
                "allowDuplicates": true,
                "semanticId": {
                  "keys": [
                    {
                      "type": "GlobalReference",
                      "local": false,
                      "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:75a426dae2f7e3a170fbb3cfce97a25a5bb3cd4a:General",
                      "index": 0,
                      "idType": "IRI"
                    }
                  ]
                },
                "idShort": "General",
                "category": "CONSTANT",
                "modelType": {
                  "name": "SubmodelElementCollection"
                },
                "value": [
                  {
                    "ordered": true,
                    "allowDuplicates": true,
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:75a426dae2f7e3a170fbb3cfce97a25a5bb3cd4a:General:Form",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Form",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "SubmodelElementCollection"
                    },
                    "value": [
                      {
                        "value": "0",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:75a426dae2f7e3a170fbb3cfce97a25a5bb3cd4a:Score",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Score",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      },
                      {
                        "value": "Tiefe: neutral; depth: neutral; area: neutral; räumlich: neutral; spatial: neutral; Relation: neutral; Fläche: neutral; Gestalt: neutral; Form: neutral; Proportion: neutral; Breite: neutral; dimensions: neutral; Größe: neutral; Länge: neutral; Modell: neutral; structure: neutral; Gebilde: neutral; geometry: neutral; shape: neutral; size: neutral; length: neutral; Konstruktion: neutral; Abmaße: neutral; height: neutral; Geometrie: neutral; Abmessungen: neutral; Maße: neutral; Höhe: neutral; model: neutral; broad: neutral",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:75a426dae2f7e3a170fbb3cfce97a25a5bb3cd4a:Sentiment",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Sentiment",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      }
                    ],
                    "kind": "Instance"
                  },
                  {
                    "ordered": true,
                    "allowDuplicates": true,
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:75a426dae2f7e3a170fbb3cfce97a25a5bb3cd4a:General:Looks",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Looks",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "SubmodelElementCollection"
                    },
                    "value": [
                      {
                        "value": "0.02490083",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:75a426dae2f7e3a170fbb3cfce97a25a5bb3cd4a:Score",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Score",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      },
                      {
                        "value": "Farbe: neutral; color: neutral; colour: neutral; Lichtwirkung: neutral; Optik: neutral; optics: neutral; Design: neutral; Materialoptik: neutral; material look: neutral; Gelb: neutral; yellow: neutral; green: neutral; Rot: neutral; Red: neutral; Schwarz: neutral; black: neutral; Weiß: neutral; Bunt: neutral; Colorful: neutral; Hässlich: neutral; Ugly: neutral; Blau: neutral; blue: neutral; Aussehen: positive; Look: neutral; schön: neutral; beautiful: neutral; edel: neutral; lighting effect: neutral; modern: neutral; hochwertig: neutral; high-quality: neutral; Grün: neutral; Noble: neutral; colours: neutral",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:75a426dae2f7e3a170fbb3cfce97a25a5bb3cd4a:Sentiment",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Sentiment",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      }
                    ],
                    "kind": "Instance"
                  },
                  {
                    "ordered": true,
                    "allowDuplicates": true,
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:75a426dae2f7e3a170fbb3cfce97a25a5bb3cd4a:General:Interaction",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Interaction",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "SubmodelElementCollection"
                    },
                    "value": [
                      {
                        "value": "0",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:75a426dae2f7e3a170fbb3cfce97a25a5bb3cd4a:Score",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Score",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      },
                      {
                        "value": "Handhabung: neutral; handling: neutral; Benutzerfreundlichkeit: neutral; user friendliness: neutral; Usability: neutral; Intuitive: neutral; Natürlich: neutral; Simple: neutral; Bildschirm: neutral; screen: neutral; Tasten: neutral; Keys: neutral; Knöpfe: neutral; buttons: neutral; Hebel: neutral; lever: neutral; Intuitiv: neutral; Einfach: neutral; flap: neutral; Anzeige: neutral; Natural: neutral; Klappe: neutral; display: neutral; Ausgabe: neutral; input: neutral; output: neutral; Eingabe: neutral; Feedback: neutral; Benutzerschnittstelle: neutral; user interface: neutral; interaction: neutral; Interaktion: neutral",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:75a426dae2f7e3a170fbb3cfce97a25a5bb3cd4a:Sentiment",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Sentiment",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      }
                    ],
                    "kind": "Instance"
                  },
                  {
                    "ordered": true,
                    "allowDuplicates": true,
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:75a426dae2f7e3a170fbb3cfce97a25a5bb3cd4a:General:Structure",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Structure",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "SubmodelElementCollection"
                    },
                    "value": [
                      {
                        "value": "0",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:75a426dae2f7e3a170fbb3cfce97a25a5bb3cd4a:Score",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Score",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      },
                      {
                        "value": "Struktur: neutral;  structure: neutral; white: neutral; composition: neutral; generation: neutral; component: neutral; desert: neutral; components: neutral; voices: neutral; module: neutral; great: neutral; modules: neutral; female: neutral; dependencies: neutral; young: neutral; active structure: neutral; Artikel: neutral; Austausch: neutral; exchange: neutral; modular: neutral; item: neutral; vocals: neutral; hidden: neutral; construction: neutral",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:75a426dae2f7e3a170fbb3cfce97a25a5bb3cd4a:Sentiment",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Sentiment",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      }
                    ],
                    "kind": "Instance"
                  },
                  {
                    "ordered": true,
                    "allowDuplicates": true,
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:75a426dae2f7e3a170fbb3cfce97a25a5bb3cd4a:General:Haptics",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Haptics",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "SubmodelElementCollection"
                    },
                    "value": [
                      {
                        "value": "0",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:75a426dae2f7e3a170fbb3cfce97a25a5bb3cd4a:Score",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Score",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      },
                      {
                        "value": "surface: neutral; Oberfläche: neutral; Greifen: neutral; Grasp: neutral; Gefühl: neutral; feeling: neutral; Griffigkeit: neutral; grip: neutral; Berührung: neutral; touch: neutral; Taktil: neutral; Tactile: neutral; Widerstand: neutral; resistance: neutral; feel: neutral; Haptik: neutral; Anfassen: neutral; feels: neutral; feelings: neutral",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:75a426dae2f7e3a170fbb3cfce97a25a5bb3cd4a:Sentiment",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Sentiment",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      }
                    ],
                    "kind": "Instance"
                  },
                  {
                    "ordered": true,
                    "allowDuplicates": true,
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:75a426dae2f7e3a170fbb3cfce97a25a5bb3cd4a:General:Acustics",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Acustics",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "SubmodelElementCollection"
                    },
                    "value": [
                      {
                        "value": "0",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:75a426dae2f7e3a170fbb3cfce97a25a5bb3cd4a:Score",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Score",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      },
                      {
                        "value": "Geräusche: neutral; Lautstärke: neutral; volume: neutral; Leise: neutral; noises: neutral; Quietly: neutral; Betriebsgeräusch: neutral; operating noise: neutral; Lärm: neutral; noise: neutral; Laut: neutral; hörbar: neutral; audible: neutral; According to: neutral; Audio: neutral; Ton: neutral; Akustik: neutral; acoustics: neutral; akustisch: neutral; acoustically: neutral; wahrnehmbar: neutral; perceptible: neutral; sound: neutral; Echo: neutral; Klang: neutral; Tonqualität: neutral; sound quality: neutral; Rauschen: neutral; rush: neutral; Krach: neutral; Schall: neutral",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:75a426dae2f7e3a170fbb3cfce97a25a5bb3cd4a:Sentiment",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Sentiment",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      }
                    ],
                    "kind": "Instance"
                  },
                  {
                    "ordered": true,
                    "allowDuplicates": true,
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:75a426dae2f7e3a170fbb3cfce97a25a5bb3cd4a:General:Assembly",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Assembly_Installation",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "SubmodelElementCollection"
                    },
                    "value": [
                      {
                        "value": "0",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:75a426dae2f7e3a170fbb3cfce97a25a5bb3cd4a:Score",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Score",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      },
                      {
                        "value": "Montage: neutral; Installation: neutral; Montage und Installation: neutral; Montageschritte: neutral; assembly steps: neutral; append: neutral; Anfügen: neutral; Zusammenbau: neutral; assembly: neutral; Arbeitsschritte: neutral; work steps: neutral; Einbau: neutral; Einbauen: neutral; build in: neutral; installieren: neutral; to install: neutral; Inbetriebnahme: neutral; Aufbau: neutral; setup: neutral; Anschließen: neutral; Aufstellen: neutral; Auspacken: neutral; unpacking: neutral; Connect: neutral; Deploy: neutral; Einsetzen: neutral; Nutzen: neutral; To use: neutral; Set up: neutral",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:75a426dae2f7e3a170fbb3cfce97a25a5bb3cd4a:Sentiment",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Sentiment",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      }
                    ],
                    "kind": "Instance"
                  },
                  {
                    "ordered": true,
                    "allowDuplicates": true,
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:75a426dae2f7e3a170fbb3cfce97a25a5bb3cd4a:General:Material",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Material",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "SubmodelElementCollection"
                    },
                    "value": [
                      {
                        "value": "0",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:75a426dae2f7e3a170fbb3cfce97a25a5bb3cd4a:Score",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Score",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      },
                      {
                        "value": "Material: neutral; Robust: neutral; Haltbar: neutral; Durable: neutral; durability: neutral; Haltbarkeit: neutral; Robustheit: neutral; robustness: neutral; Materialien: neutral; materials: neutral; Plastik: neutral; plastic: neutral; Metall: neutral; metal: neutral; Eisen: neutral; iron: neutral; Holz: neutral; wood: neutral; Stahl: neutral; steel: neutral; Oberflächenstruktur: neutral; surface structure: neutral; degree of roughness: neutral; Rauheitsgrad: neutral; degree of hardness: neutral; Härtegrad: neutral; Festigkeit: neutral; Biegfestigkeit: neutral; Dichte: neutral; flexural strength: neutral; density: neutral; Probe: neutral; strength: neutral; sample: neutral; Materialprobe: neutral; material sample: neutral",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:75a426dae2f7e3a170fbb3cfce97a25a5bb3cd4a:Sentiment",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Sentiment",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      }
                    ],
                    "kind": "Instance"
                  }
                ],
                "kind": "Instance"
              }
            ],
            "kind": "Instance"
          },
          {
            "ordered": true,
            "allowDuplicates": true,
            "semanticId": {
              "keys": [
                {
                  "type": "GlobalReference",
                  "local": false,
                  "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:c41147e91f2164ddae7d217da8f38c76b28cba6f",
                  "index": 0,
                  "idType": "IRI"
                }
              ]
            },
            "idShort": "c41147e91f2164ddae7d217da8f38c76b28cba6f",
            "category": "VARIABLE",
            "modelType": {
              "name": "SubmodelElementCollection"
            },
            "value": [
              {
                "value": "03/01/2023 11:09:59",
                "semanticId": {
                  "keys": [
                    {
                      "type": "GlobalReference",
                      "local": false,
                      "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:c41147e91f2164ddae7d217da8f38c76b28cba6f:createdAt",
                      "index": 0,
                      "idType": "IRI"
                    }
                  ]
                },
                "idShort": "createdAt",
                "category": "CONSTANT",
                "modelType": {
                  "name": "Property"
                },
                "valueType": {
                  "dataObjectType": {
                    "name": "string"
                  }
                },
                "kind": "Instance"
              },
              {
                "value": "c41147e91f2164ddae7d217da8f38c76b28cba6f",
                "semanticId": {
                  "keys": [
                    {
                      "type": "GlobalReference",
                      "local": false,
                      "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:c41147e91f2164ddae7d217da8f38c76b28cba6f:feedbackId",
                      "index": 0,
                      "idType": "IRI"
                    }
                  ]
                },
                "idShort": "feedbackId",
                "category": "CONSTANT",
                "modelType": {
                  "name": "Property"
                },
                "valueType": {
                  "dataObjectType": {
                    "name": "string"
                  }
                },
                "kind": "Instance"
              },
              {
                "value": "Der Becher hat mir gar nicht gefallen.",
                "semanticId": {
                  "keys": [
                    {
                      "type": "GlobalReference",
                      "local": false,
                      "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:c41147e91f2164ddae7d217da8f38c76b28cba6f:message",
                      "index": 0,
                      "idType": "IRI"
                    }
                  ]
                },
                "idShort": "message",
                "category": "CONSTANT",
                "modelType": {
                  "name": "Property"
                },
                "valueType": {
                  "dataObjectType": {
                    "name": "string"
                  }
                },
                "kind": "Instance"
              },
              {
                "value": "1",
                "semanticId": {
                  "keys": [
                    {
                      "type": "GlobalReference",
                      "local": false,
                      "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:c41147e91f2164ddae7d217da8f38c76b28cba6f:stars",
                      "index": 0,
                      "idType": "IRI"
                    }
                  ]
                },
                "idShort": "stars",
                "category": "CONSTANT",
                "modelType": {
                  "name": "Property"
                },
                "valueType": {
                  "dataObjectType": {
                    "name": "float"
                  }
                },
                "kind": "Instance"
              },
              {
                "ordered": true,
                "allowDuplicates": true,
                "semanticId": {
                  "keys": [
                    {
                      "type": "GlobalReference",
                      "local": false,
                      "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:c41147e91f2164ddae7d217da8f38c76b28cba6f:Individual",
                      "index": 0,
                      "idType": "IRI"
                    }
                  ]
                },
                "idShort": "Individual",
                "category": "CONSTANT",
                "modelType": {
                  "name": "SubmodelElementCollection"
                },
                "value": [
                  {
                    "value": "no",
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:c41147e91f2164ddae7d217da8f38c76b28cba6f:Individual:Deposit",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Deposit_appropriate",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "Property"
                    },
                    "valueType": {
                      "dataObjectType": {
                        "name": "string"
                      }
                    },
                    "kind": "Instance"
                  },
                  {
                    "value": "EveryDay",
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:c41147e91f2164ddae7d217da8f38c76b28cba6f:Individual:Coffee",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Coffee_frequency",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "Property"
                    },
                    "valueType": {
                      "dataObjectType": {
                        "name": "string"
                      }
                    },
                    "kind": "Instance"
                  },
                  {
                    "value": "EveryDay",
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:c41147e91f2164ddae7d217da8f38c76b28cba6f:Individual:Usage",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Usage_CUNACup",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "Property"
                    },
                    "valueType": {
                      "dataObjectType": {
                        "name": "string"
                      }
                    },
                    "kind": "Instance"
                  },
                  {
                    "value": "",
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:c41147e91f2164ddae7d217da8f38c76b28cba6f:Individual:Cafe",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Cafe_recommendation",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "Property"
                    },
                    "valueType": {
                      "dataObjectType": {
                        "name": "string"
                      }
                    },
                    "kind": "Instance"
                  }
                ],
                "kind": "Instance"
              },
              {
                "ordered": true,
                "allowDuplicates": true,
                "semanticId": {
                  "keys": [
                    {
                      "type": "GlobalReference",
                      "local": false,
                      "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:c41147e91f2164ddae7d217da8f38c76b28cba6f:General",
                      "index": 0,
                      "idType": "IRI"
                    }
                  ]
                },
                "idShort": "General",
                "category": "CONSTANT",
                "modelType": {
                  "name": "SubmodelElementCollection"
                },
                "value": [
                  {
                    "ordered": true,
                    "allowDuplicates": true,
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:c41147e91f2164ddae7d217da8f38c76b28cba6f:General:Form",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Form",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "SubmodelElementCollection"
                    },
                    "value": [
                      {
                        "value": "0",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:c41147e91f2164ddae7d217da8f38c76b28cba6f:Score",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Score",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      },
                      {
                        "value": "Tiefe: neutral; depth: neutral; area: neutral; räumlich: neutral; spatial: neutral; Relation: neutral; Fläche: neutral; Gestalt: neutral; Form: neutral; Proportion: neutral; Breite: neutral; dimensions: neutral; Größe: neutral; Länge: neutral; Modell: neutral; structure: neutral; Gebilde: neutral; geometry: neutral; shape: neutral; size: neutral; length: neutral; Konstruktion: neutral; Abmaße: neutral; height: neutral; Geometrie: neutral; Abmessungen: neutral; Maße: neutral; Höhe: neutral; model: neutral; broad: neutral",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:c41147e91f2164ddae7d217da8f38c76b28cba6f:Sentiment",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Sentiment",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      }
                    ],
                    "kind": "Instance"
                  },
                  {
                    "ordered": true,
                    "allowDuplicates": true,
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:c41147e91f2164ddae7d217da8f38c76b28cba6f:General:Looks",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Looks",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "SubmodelElementCollection"
                    },
                    "value": [
                      {
                        "value": "0",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:c41147e91f2164ddae7d217da8f38c76b28cba6f:Score",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Score",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      },
                      {
                        "value": "Farbe: neutral; color: neutral; colour: neutral; Lichtwirkung: neutral; Optik: neutral; optics: neutral; Design: neutral; Materialoptik: neutral; material look: neutral; Gelb: neutral; yellow: neutral; green: neutral; Rot: neutral; Red: neutral; Schwarz: neutral; black: neutral; Weiß: neutral; Bunt: neutral; Colorful: neutral; Hässlich: neutral; Ugly: neutral; Blau: neutral; blue: neutral; Aussehen: neutral; Look: neutral; schön: neutral; beautiful: neutral; edel: neutral; lighting effect: neutral; modern: neutral; hochwertig: neutral; high-quality: neutral; Grün: neutral; Noble: neutral; colours: neutral",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:c41147e91f2164ddae7d217da8f38c76b28cba6f:Sentiment",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Sentiment",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      }
                    ],
                    "kind": "Instance"
                  },
                  {
                    "ordered": true,
                    "allowDuplicates": true,
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:c41147e91f2164ddae7d217da8f38c76b28cba6f:General:Interaction",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Interaction",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "SubmodelElementCollection"
                    },
                    "value": [
                      {
                        "value": "0",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:c41147e91f2164ddae7d217da8f38c76b28cba6f:Score",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Score",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      },
                      {
                        "value": "Handhabung: neutral; handling: neutral; Benutzerfreundlichkeit: neutral; user friendliness: neutral; Usability: neutral; Intuitive: neutral; Natürlich: neutral; Simple: neutral; Bildschirm: neutral; screen: neutral; Tasten: neutral; Keys: neutral; Knöpfe: neutral; buttons: neutral; Hebel: neutral; lever: neutral; Intuitiv: neutral; Einfach: neutral; flap: neutral; Anzeige: neutral; Natural: neutral; Klappe: neutral; display: neutral; Ausgabe: neutral; input: neutral; output: neutral; Eingabe: neutral; Feedback: neutral; Benutzerschnittstelle: neutral; user interface: neutral; interaction: neutral; Interaktion: neutral",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:c41147e91f2164ddae7d217da8f38c76b28cba6f:Sentiment",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Sentiment",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      }
                    ],
                    "kind": "Instance"
                  },
                  {
                    "ordered": true,
                    "allowDuplicates": true,
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:c41147e91f2164ddae7d217da8f38c76b28cba6f:General:Structure",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Structure",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "SubmodelElementCollection"
                    },
                    "value": [
                      {
                        "value": "0",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:c41147e91f2164ddae7d217da8f38c76b28cba6f:Score",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Score",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      },
                      {
                        "value": "Struktur: neutral;  structure: neutral; white: neutral; composition: neutral; generation: neutral; component: neutral; desert: neutral; components: neutral; voices: neutral; module: neutral; great: neutral; modules: neutral; female: neutral; dependencies: neutral; young: neutral; active structure: neutral; Artikel: neutral; Austausch: neutral; exchange: neutral; modular: neutral; item: neutral; vocals: neutral; hidden: neutral; construction: neutral",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:c41147e91f2164ddae7d217da8f38c76b28cba6f:Sentiment",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Sentiment",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      }
                    ],
                    "kind": "Instance"
                  },
                  {
                    "ordered": true,
                    "allowDuplicates": true,
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:c41147e91f2164ddae7d217da8f38c76b28cba6f:General:Haptics",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Haptics",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "SubmodelElementCollection"
                    },
                    "value": [
                      {
                        "value": "0",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:c41147e91f2164ddae7d217da8f38c76b28cba6f:Score",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Score",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      },
                      {
                        "value": "surface: neutral; Oberfläche: neutral; Greifen: neutral; Grasp: neutral; Gefühl: neutral; feeling: neutral; Griffigkeit: neutral; grip: neutral; Berührung: neutral; touch: neutral; Taktil: neutral; Tactile: neutral; Widerstand: neutral; resistance: neutral; feel: neutral; Haptik: neutral; Anfassen: neutral; feels: neutral; feelings: neutral",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:c41147e91f2164ddae7d217da8f38c76b28cba6f:Sentiment",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Sentiment",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      }
                    ],
                    "kind": "Instance"
                  },
                  {
                    "ordered": true,
                    "allowDuplicates": true,
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:c41147e91f2164ddae7d217da8f38c76b28cba6f:General:Acustics",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Acustics",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "SubmodelElementCollection"
                    },
                    "value": [
                      {
                        "value": "0",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:c41147e91f2164ddae7d217da8f38c76b28cba6f:Score",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Score",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      },
                      {
                        "value": "Geräusche: neutral; Lautstärke: neutral; volume: neutral; Leise: neutral; noises: neutral; Quietly: neutral; Betriebsgeräusch: neutral; operating noise: neutral; Lärm: neutral; noise: neutral; Laut: neutral; hörbar: neutral; audible: neutral; According to: neutral; Audio: neutral; Ton: neutral; Akustik: neutral; acoustics: neutral; akustisch: neutral; acoustically: neutral; wahrnehmbar: neutral; perceptible: neutral; sound: neutral; Echo: neutral; Klang: neutral; Tonqualität: neutral; sound quality: neutral; Rauschen: neutral; rush: neutral; Krach: neutral; Schall: neutral",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:c41147e91f2164ddae7d217da8f38c76b28cba6f:Sentiment",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Sentiment",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      }
                    ],
                    "kind": "Instance"
                  },
                  {
                    "ordered": true,
                    "allowDuplicates": true,
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:c41147e91f2164ddae7d217da8f38c76b28cba6f:General:Assembly",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Assembly_Installation",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "SubmodelElementCollection"
                    },
                    "value": [
                      {
                        "value": "0",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:c41147e91f2164ddae7d217da8f38c76b28cba6f:Score",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Score",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      },
                      {
                        "value": "Montage: neutral; Installation: neutral; Montage und Installation: neutral; Montageschritte: neutral; assembly steps: neutral; append: neutral; Anfügen: neutral; Zusammenbau: neutral; assembly: neutral; Arbeitsschritte: neutral; work steps: neutral; Einbau: neutral; Einbauen: neutral; build in: neutral; installieren: neutral; to install: neutral; Inbetriebnahme: neutral; Aufbau: neutral; setup: neutral; Anschließen: neutral; Aufstellen: neutral; Auspacken: neutral; unpacking: neutral; Connect: neutral; Deploy: neutral; Einsetzen: neutral; Nutzen: neutral; To use: neutral; Set up: neutral",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:c41147e91f2164ddae7d217da8f38c76b28cba6f:Sentiment",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Sentiment",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      }
                    ],
                    "kind": "Instance"
                  },
                  {
                    "ordered": true,
                    "allowDuplicates": true,
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:c41147e91f2164ddae7d217da8f38c76b28cba6f:General:Material",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Material",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "SubmodelElementCollection"
                    },
                    "value": [
                      {
                        "value": "0",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:c41147e91f2164ddae7d217da8f38c76b28cba6f:Score",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Score",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      },
                      {
                        "value": "Material: neutral; Robust: neutral; Haltbar: neutral; Durable: neutral; durability: neutral; Haltbarkeit: neutral; Robustheit: neutral; robustness: neutral; Materialien: neutral; materials: neutral; Plastik: neutral; plastic: neutral; Metall: neutral; metal: neutral; Eisen: neutral; iron: neutral; Holz: neutral; wood: neutral; Stahl: neutral; steel: neutral; Oberflächenstruktur: neutral; surface structure: neutral; degree of roughness: neutral; Rauheitsgrad: neutral; degree of hardness: neutral; Härtegrad: neutral; Festigkeit: neutral; Biegfestigkeit: neutral; Dichte: neutral; flexural strength: neutral; density: neutral; Probe: neutral; strength: neutral; sample: neutral; Materialprobe: neutral; material sample: neutral",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:c41147e91f2164ddae7d217da8f38c76b28cba6f:Sentiment",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Sentiment",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      }
                    ],
                    "kind": "Instance"
                  }
                ],
                "kind": "Instance"
              }
            ],
            "kind": "Instance"
          },
          {
            "ordered": true,
            "allowDuplicates": true,
            "semanticId": {
              "keys": [
                {
                  "type": "GlobalReference",
                  "local": false,
                  "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:6b4b3b179b149667979e5bab9279df90c4567fdd",
                  "index": 0,
                  "idType": "IRI"
                }
              ]
            },
            "idShort": "6b4b3b179b149667979e5bab9279df90c4567fdd",
            "category": "VARIABLE",
            "modelType": {
              "name": "SubmodelElementCollection"
            },
            "value": [
              {
                "value": "03/01/2023 11:09:59",
                "semanticId": {
                  "keys": [
                    {
                      "type": "GlobalReference",
                      "local": false,
                      "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:6b4b3b179b149667979e5bab9279df90c4567fdd:createdAt",
                      "index": 0,
                      "idType": "IRI"
                    }
                  ]
                },
                "idShort": "createdAt",
                "category": "CONSTANT",
                "modelType": {
                  "name": "Property"
                },
                "valueType": {
                  "dataObjectType": {
                    "name": "string"
                  }
                },
                "kind": "Instance"
              },
              {
                "value": "6b4b3b179b149667979e5bab9279df90c4567fdd",
                "semanticId": {
                  "keys": [
                    {
                      "type": "GlobalReference",
                      "local": false,
                      "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:6b4b3b179b149667979e5bab9279df90c4567fdd:feedbackId",
                      "index": 0,
                      "idType": "IRI"
                    }
                  ]
                },
                "idShort": "feedbackId",
                "category": "CONSTANT",
                "modelType": {
                  "name": "Property"
                },
                "valueType": {
                  "dataObjectType": {
                    "name": "string"
                  }
                },
                "kind": "Instance"
              },
              {
                "value": "Becher war ok. Die Akustik lässt zu wünschen übrig. Der Kaffee war aber gut. Das Aussehen und die Farbe gefallen mir ebenfalls.",
                "semanticId": {
                  "keys": [
                    {
                      "type": "GlobalReference",
                      "local": false,
                      "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:6b4b3b179b149667979e5bab9279df90c4567fdd:message",
                      "index": 0,
                      "idType": "IRI"
                    }
                  ]
                },
                "idShort": "message",
                "category": "CONSTANT",
                "modelType": {
                  "name": "Property"
                },
                "valueType": {
                  "dataObjectType": {
                    "name": "string"
                  }
                },
                "kind": "Instance"
              },
              {
                "value": "5",
                "semanticId": {
                  "keys": [
                    {
                      "type": "GlobalReference",
                      "local": false,
                      "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:6b4b3b179b149667979e5bab9279df90c4567fdd:stars",
                      "index": 0,
                      "idType": "IRI"
                    }
                  ]
                },
                "idShort": "stars",
                "category": "CONSTANT",
                "modelType": {
                  "name": "Property"
                },
                "valueType": {
                  "dataObjectType": {
                    "name": "float"
                  }
                },
                "kind": "Instance"
              },
              {
                "ordered": true,
                "allowDuplicates": true,
                "semanticId": {
                  "keys": [
                    {
                      "type": "GlobalReference",
                      "local": false,
                      "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:6b4b3b179b149667979e5bab9279df90c4567fdd:Individual",
                      "index": 0,
                      "idType": "IRI"
                    }
                  ]
                },
                "idShort": "Individual",
                "category": "CONSTANT",
                "modelType": {
                  "name": "SubmodelElementCollection"
                },
                "value": [
                  {
                    "value": "no",
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:6b4b3b179b149667979e5bab9279df90c4567fdd:Individual:Deposit",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Deposit_appropriate",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "Property"
                    },
                    "valueType": {
                      "dataObjectType": {
                        "name": "string"
                      }
                    },
                    "kind": "Instance"
                  },
                  {
                    "value": "EveryDay",
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:6b4b3b179b149667979e5bab9279df90c4567fdd:Individual:Coffee",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Coffee_frequency",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "Property"
                    },
                    "valueType": {
                      "dataObjectType": {
                        "name": "string"
                      }
                    },
                    "kind": "Instance"
                  },
                  {
                    "value": "EveryDay",
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:6b4b3b179b149667979e5bab9279df90c4567fdd:Individual:Usage",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Usage_CUNACup",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "Property"
                    },
                    "valueType": {
                      "dataObjectType": {
                        "name": "string"
                      }
                    },
                    "kind": "Instance"
                  },
                  {
                    "value": "SFOWL",
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:6b4b3b179b149667979e5bab9279df90c4567fdd:Individual:Cafe",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Cafe_recommendation",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "Property"
                    },
                    "valueType": {
                      "dataObjectType": {
                        "name": "string"
                      }
                    },
                    "kind": "Instance"
                  }
                ],
                "kind": "Instance"
              },
              {
                "ordered": true,
                "allowDuplicates": true,
                "semanticId": {
                  "keys": [
                    {
                      "type": "GlobalReference",
                      "local": false,
                      "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:6b4b3b179b149667979e5bab9279df90c4567fdd:General",
                      "index": 0,
                      "idType": "IRI"
                    }
                  ]
                },
                "idShort": "General",
                "category": "CONSTANT",
                "modelType": {
                  "name": "SubmodelElementCollection"
                },
                "value": [
                  {
                    "ordered": true,
                    "allowDuplicates": true,
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:6b4b3b179b149667979e5bab9279df90c4567fdd:General:Form",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Form",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "SubmodelElementCollection"
                    },
                    "value": [
                      {
                        "value": "0",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:6b4b3b179b149667979e5bab9279df90c4567fdd:Score",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Score",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      },
                      {
                        "value": "",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:6b4b3b179b149667979e5bab9279df90c4567fdd:Sentiment",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Sentiment",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      }
                    ],
                    "kind": "Instance"
                  },
                  {
                    "ordered": true,
                    "allowDuplicates": true,
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:6b4b3b179b149667979e5bab9279df90c4567fdd:General:Looks",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Looks",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "SubmodelElementCollection"
                    },
                    "value": [
                      {
                        "value": "0",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:6b4b3b179b149667979e5bab9279df90c4567fdd:Score",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Score",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      },
                      {
                        "value": "Aussehen: neutral; Farbe: neutral",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:6b4b3b179b149667979e5bab9279df90c4567fdd:Sentiment",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Sentiment",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      }
                    ],
                    "kind": "Instance"
                  },
                  {
                    "ordered": true,
                    "allowDuplicates": true,
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:6b4b3b179b149667979e5bab9279df90c4567fdd:General:Interaction",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Interaction",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "SubmodelElementCollection"
                    },
                    "value": [
                      {
                        "value": "0",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:6b4b3b179b149667979e5bab9279df90c4567fdd:Score",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Score",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      },
                      {
                        "value": "",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:6b4b3b179b149667979e5bab9279df90c4567fdd:Sentiment",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Sentiment",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      }
                    ],
                    "kind": "Instance"
                  },
                  {
                    "ordered": true,
                    "allowDuplicates": true,
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:6b4b3b179b149667979e5bab9279df90c4567fdd:General:Structure",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Structure",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "SubmodelElementCollection"
                    },
                    "value": [
                      {
                        "value": "0",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:6b4b3b179b149667979e5bab9279df90c4567fdd:Score",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Score",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      },
                      {
                        "value": "",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:6b4b3b179b149667979e5bab9279df90c4567fdd:Sentiment",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Sentiment",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      }
                    ],
                    "kind": "Instance"
                  },
                  {
                    "ordered": true,
                    "allowDuplicates": true,
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:6b4b3b179b149667979e5bab9279df90c4567fdd:General:Haptics",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Haptics",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "SubmodelElementCollection"
                    },
                    "value": [
                      {
                        "value": "0",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:6b4b3b179b149667979e5bab9279df90c4567fdd:Score",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Score",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      },
                      {
                        "value": "",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:6b4b3b179b149667979e5bab9279df90c4567fdd:Sentiment",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Sentiment",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      }
                    ],
                    "kind": "Instance"
                  },
                  {
                    "ordered": true,
                    "allowDuplicates": true,
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:6b4b3b179b149667979e5bab9279df90c4567fdd:General:Acustics",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Acustics",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "SubmodelElementCollection"
                    },
                    "value": [
                      {
                        "value": "0",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:6b4b3b179b149667979e5bab9279df90c4567fdd:Score",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Score",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      },
                      {
                        "value": "Akustik: neutral",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:6b4b3b179b149667979e5bab9279df90c4567fdd:Sentiment",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Sentiment",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      }
                    ],
                    "kind": "Instance"
                  },
                  {
                    "ordered": true,
                    "allowDuplicates": true,
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:6b4b3b179b149667979e5bab9279df90c4567fdd:General:Assembly",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Assembly_Installation",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "SubmodelElementCollection"
                    },
                    "value": [
                      {
                        "value": "0",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:6b4b3b179b149667979e5bab9279df90c4567fdd:Score",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Score",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      },
                      {
                        "value": "",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:6b4b3b179b149667979e5bab9279df90c4567fdd:Sentiment",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Sentiment",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      }
                    ],
                    "kind": "Instance"
                  },
                  {
                    "ordered": true,
                    "allowDuplicates": true,
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:6b4b3b179b149667979e5bab9279df90c4567fdd:General:Material",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Material",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "SubmodelElementCollection"
                    },
                    "value": [
                      {
                        "value": "0",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:6b4b3b179b149667979e5bab9279df90c4567fdd:Score",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Score",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      },
                      {
                        "value": "",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:6b4b3b179b149667979e5bab9279df90c4567fdd:Sentiment",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Sentiment",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      }
                    ],
                    "kind": "Instance"
                  }
                ],
                "kind": "Instance"
              }
            ],
            "kind": "Instance"
          },
          {
            "ordered": true,
            "allowDuplicates": true,
            "semanticId": {
              "keys": [
                {
                  "type": "GlobalReference",
                  "local": false,
                  "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:0027dca15784ea35ce873a98cbdf35053d7e2f78",
                  "index": 0,
                  "idType": "IRI"
                }
              ]
            },
            "idShort": "0027dca15784ea35ce873a98cbdf35053d7e2f78",
            "category": "VARIABLE",
            "modelType": {
              "name": "SubmodelElementCollection"
            },
            "value": [
              {
                "value": "03/01/2023 11:09:59",
                "semanticId": {
                  "keys": [
                    {
                      "type": "GlobalReference",
                      "local": false,
                      "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:0027dca15784ea35ce873a98cbdf35053d7e2f78:createdAt",
                      "index": 0,
                      "idType": "IRI"
                    }
                  ]
                },
                "idShort": "createdAt",
                "category": "CONSTANT",
                "modelType": {
                  "name": "Property"
                },
                "valueType": {
                  "dataObjectType": {
                    "name": "string"
                  }
                },
                "kind": "Instance"
              },
              {
                "value": "0027dca15784ea35ce873a98cbdf35053d7e2f78",
                "semanticId": {
                  "keys": [
                    {
                      "type": "GlobalReference",
                      "local": false,
                      "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:0027dca15784ea35ce873a98cbdf35053d7e2f78:feedbackId",
                      "index": 0,
                      "idType": "IRI"
                    }
                  ]
                },
                "idShort": "feedbackId",
                "category": "CONSTANT",
                "modelType": {
                  "name": "Property"
                },
                "valueType": {
                  "dataObjectType": {
                    "name": "string"
                  }
                },
                "kind": "Instance"
              },
              {
                "value": "Der Becher ist gut. Ich mag ihn wirklich sehr. Die Haptik gefällt mir auch sehr gut.",
                "semanticId": {
                  "keys": [
                    {
                      "type": "GlobalReference",
                      "local": false,
                      "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:0027dca15784ea35ce873a98cbdf35053d7e2f78:message",
                      "index": 0,
                      "idType": "IRI"
                    }
                  ]
                },
                "idShort": "message",
                "category": "CONSTANT",
                "modelType": {
                  "name": "Property"
                },
                "valueType": {
                  "dataObjectType": {
                    "name": "string"
                  }
                },
                "kind": "Instance"
              },
              {
                "value": "5",
                "semanticId": {
                  "keys": [
                    {
                      "type": "GlobalReference",
                      "local": false,
                      "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:0027dca15784ea35ce873a98cbdf35053d7e2f78:stars",
                      "index": 0,
                      "idType": "IRI"
                    }
                  ]
                },
                "idShort": "stars",
                "category": "CONSTANT",
                "modelType": {
                  "name": "Property"
                },
                "valueType": {
                  "dataObjectType": {
                    "name": "float"
                  }
                },
                "kind": "Instance"
              },
              {
                "ordered": true,
                "allowDuplicates": true,
                "semanticId": {
                  "keys": [
                    {
                      "type": "GlobalReference",
                      "local": false,
                      "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:0027dca15784ea35ce873a98cbdf35053d7e2f78:Individual",
                      "index": 0,
                      "idType": "IRI"
                    }
                  ]
                },
                "idShort": "Individual",
                "category": "CONSTANT",
                "modelType": {
                  "name": "SubmodelElementCollection"
                },
                "value": [
                  {
                    "value": "no",
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:0027dca15784ea35ce873a98cbdf35053d7e2f78:Individual:Deposit",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Deposit_appropriate",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "Property"
                    },
                    "valueType": {
                      "dataObjectType": {
                        "name": "string"
                      }
                    },
                    "kind": "Instance"
                  },
                  {
                    "value": "EveryDay",
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:0027dca15784ea35ce873a98cbdf35053d7e2f78:Individual:Coffee",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Coffee_frequency",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "Property"
                    },
                    "valueType": {
                      "dataObjectType": {
                        "name": "string"
                      }
                    },
                    "kind": "Instance"
                  },
                  {
                    "value": "More than 3 times a day",
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:0027dca15784ea35ce873a98cbdf35053d7e2f78:Individual:Usage",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Usage_CUNACup",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "Property"
                    },
                    "valueType": {
                      "dataObjectType": {
                        "name": "string"
                      }
                    },
                    "kind": "Instance"
                  },
                  {
                    "value": "SFOWL",
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:0027dca15784ea35ce873a98cbdf35053d7e2f78:Individual:Cafe",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Cafe_recommendation",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "Property"
                    },
                    "valueType": {
                      "dataObjectType": {
                        "name": "string"
                      }
                    },
                    "kind": "Instance"
                  }
                ],
                "kind": "Instance"
              },
              {
                "ordered": true,
                "allowDuplicates": true,
                "semanticId": {
                  "keys": [
                    {
                      "type": "GlobalReference",
                      "local": false,
                      "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:0027dca15784ea35ce873a98cbdf35053d7e2f78:General",
                      "index": 0,
                      "idType": "IRI"
                    }
                  ]
                },
                "idShort": "General",
                "category": "CONSTANT",
                "modelType": {
                  "name": "SubmodelElementCollection"
                },
                "value": [
                  {
                    "ordered": true,
                    "allowDuplicates": true,
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:0027dca15784ea35ce873a98cbdf35053d7e2f78:General:Form",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Form",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "SubmodelElementCollection"
                    },
                    "value": [
                      {
                        "value": "0",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:0027dca15784ea35ce873a98cbdf35053d7e2f78:Score",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Score",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      },
                      {
                        "value": "",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:0027dca15784ea35ce873a98cbdf35053d7e2f78:Sentiment",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Sentiment",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      }
                    ],
                    "kind": "Instance"
                  },
                  {
                    "ordered": true,
                    "allowDuplicates": true,
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:0027dca15784ea35ce873a98cbdf35053d7e2f78:General:Looks",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Looks",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "SubmodelElementCollection"
                    },
                    "value": [
                      {
                        "value": "0",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:0027dca15784ea35ce873a98cbdf35053d7e2f78:Score",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Score",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      },
                      {
                        "value": "",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:0027dca15784ea35ce873a98cbdf35053d7e2f78:Sentiment",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Sentiment",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      }
                    ],
                    "kind": "Instance"
                  },
                  {
                    "ordered": true,
                    "allowDuplicates": true,
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:0027dca15784ea35ce873a98cbdf35053d7e2f78:General:Interaction",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Interaction",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "SubmodelElementCollection"
                    },
                    "value": [
                      {
                        "value": "0",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:0027dca15784ea35ce873a98cbdf35053d7e2f78:Score",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Score",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      },
                      {
                        "value": "",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:0027dca15784ea35ce873a98cbdf35053d7e2f78:Sentiment",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Sentiment",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      }
                    ],
                    "kind": "Instance"
                  },
                  {
                    "ordered": true,
                    "allowDuplicates": true,
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:0027dca15784ea35ce873a98cbdf35053d7e2f78:General:Structure",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Structure",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "SubmodelElementCollection"
                    },
                    "value": [
                      {
                        "value": "0",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:0027dca15784ea35ce873a98cbdf35053d7e2f78:Score",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Score",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      },
                      {
                        "value": "",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:0027dca15784ea35ce873a98cbdf35053d7e2f78:Sentiment",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Sentiment",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      }
                    ],
                    "kind": "Instance"
                  },
                  {
                    "ordered": true,
                    "allowDuplicates": true,
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:0027dca15784ea35ce873a98cbdf35053d7e2f78:General:Haptics",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Haptics",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "SubmodelElementCollection"
                    },
                    "value": [
                      {
                        "value": "0.994278",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:0027dca15784ea35ce873a98cbdf35053d7e2f78:Score",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Score",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      },
                      {
                        "value": "Haptik: positive",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:0027dca15784ea35ce873a98cbdf35053d7e2f78:Sentiment",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Sentiment",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      }
                    ],
                    "kind": "Instance"
                  },
                  {
                    "ordered": true,
                    "allowDuplicates": true,
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:0027dca15784ea35ce873a98cbdf35053d7e2f78:General:Acustics",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Acustics",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "SubmodelElementCollection"
                    },
                    "value": [
                      {
                        "value": "0",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:0027dca15784ea35ce873a98cbdf35053d7e2f78:Score",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Score",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      },
                      {
                        "value": "",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:0027dca15784ea35ce873a98cbdf35053d7e2f78:Sentiment",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Sentiment",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      }
                    ],
                    "kind": "Instance"
                  },
                  {
                    "ordered": true,
                    "allowDuplicates": true,
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:0027dca15784ea35ce873a98cbdf35053d7e2f78:General:Assembly",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Assembly_Installation",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "SubmodelElementCollection"
                    },
                    "value": [
                      {
                        "value": "0",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:0027dca15784ea35ce873a98cbdf35053d7e2f78:Score",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Score",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      },
                      {
                        "value": "",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:0027dca15784ea35ce873a98cbdf35053d7e2f78:Sentiment",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Sentiment",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      }
                    ],
                    "kind": "Instance"
                  },
                  {
                    "ordered": true,
                    "allowDuplicates": true,
                    "semanticId": {
                      "keys": [
                        {
                          "type": "GlobalReference",
                          "local": false,
                          "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:0027dca15784ea35ce873a98cbdf35053d7e2f78:General:Material",
                          "index": 0,
                          "idType": "IRI"
                        }
                      ]
                    },
                    "idShort": "Material",
                    "category": "CONSTANT",
                    "modelType": {
                      "name": "SubmodelElementCollection"
                    },
                    "value": [
                      {
                        "value": "0",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:0027dca15784ea35ce873a98cbdf35053d7e2f78:Score",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Score",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      },
                      {
                        "value": "",
                        "semanticId": {
                          "keys": [
                            {
                              "type": "GlobalReference",
                              "local": false,
                              "value": "urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:CustomerFeedback:0027dca15784ea35ce873a98cbdf35053d7e2f78:Sentiment",
                              "index": 0,
                              "idType": "IRI"
                            }
                          ]
                        },
                        "idShort": "Sentiment",
                        "category": "CONSTANT",
                        "modelType": {
                          "name": "Property"
                        },
                        "valueType": {
                          "dataObjectType": {
                            "name": "string"
                          }
                        },
                        "kind": "Instance"
                      }
                    ],
                    "kind": "Instance"
                  }
                ],
                "kind": "Instance"
              }
            ],
            "kind": "Instance"
          }
        ]
      }
    ],
    "conceptDescriptions": []
  } as unknown as aasv2.AssetAdministrationShellEnvironment;