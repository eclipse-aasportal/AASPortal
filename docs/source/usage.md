# Usage

## Filter AAS Collection
This feature displays AAS in which a certain search text occurs. The search refers to the name, the identification and the endpoint type of the AAS.

A search within the structure of an AAS is started if the search text begins with a `#`. It is possible to search for a specific model type with a specific name and, depending on the model type, a specific value. The search text has the following format:

`#<abbreviation>:<idShort>[=, !=, <, <=, >=, >]<value>`
 
`#<abbreviation>:<idShort>=<min>...<max>`

*Supported Model Types:*

   | Abbreviation | Model Type                   |
   | ------------ | ---------------------------- |
   | AAS          | Asset Administration Shell   |
   | Asset        | Asset                        |
   | Cap          | Capability                   |
   | CD           | Concept Description          |
   | DE           | DataElement                  |
   | DST          | DataSpecification Template   |
   | InOut        | inoutputVariable             |
   | In           | inputVariable                |
   | Id           | Identifier/id                |
   | Prop         | Property                     |
   | MLP          | MultiLanguageProperty        |
   | Range        | Range                        |
   | Ent          | Entity                       |
   | Evt          | Event                        |
   | File         | File                         |
   | Blob         | Blob                         |
   | Opr          | Operation                    |
   | Out          | outputVariable               |
   | Qfr          | Qualifier                    |
   | Ref          | ReferenceElement             |
   | Rel          | RelationshipElement          |
   | RelA         | AnnotatedRelationshipElement |
   | SM           | Submodel                     |
   | SMC          | SubmodelElementCollection    |
   | SME          | SubmodelElement              |
   | View         | View                         |

By using the logical operators `||` and / or `&&` several expressions can be combined in the search text.

## Examples
All AAS that contain at least one operation element:

`#Opr`

All AAS that contain at least one submodel with the name *Nameplate*:

`#SM:Nameplate`

All AAS that contain at least one property with the value *SmartFactoryOWL*:

`#Prop=SmartFactoryOWL`

All AAS that contain at least one property with the name *Producer* and the value *SmartFactoryOWL*:

`#Prop:producer=SmartFactoryOWL`

All AAS where *RotationSpeed* is greater or equal then *5000*:

`#Prop=RotationSpeed >= 5000`

All AAS where *ProductionDate* is between *12/24/2022* and *12/31/2022*:

`#Prop=ProductionDate = 12/24/2022...12/31/2022`

## Supported Endpoints

| Endpoint       | Format                                                           |
| -------------- | ---------------------------------------------------------------- |
| AASXServer     | `http://<Host IP>:51310`                                         |
| AAS Registry   | `http://<Host IP>:50000/registry/api/v1/registry/`               |
| OPC UA (I4AAS) | `opc.tcp://<Host IP>:30001/I4AASServer`                     |
| Files          | `file:///samples`                                                |
