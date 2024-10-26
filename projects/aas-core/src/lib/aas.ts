/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

export type AASSubmodelElements =
    | 'AnnotatedRelationshipElement'
    | 'BasicEventElement'
    | 'Blob'
    | 'Capability'
    | 'DataElement'
    | 'Entity'
    | 'EventElement'
    | 'File'
    | 'MultiLanguageProperty'
    | 'Operation'
    | 'Property'
    | 'Range'
    | 'ReferenceElement'
    | 'RelationshipElement'
    | 'SubmodelElement'
    | 'SubmodelElementCollection'
    | 'SubmodelElementList';

export type AssetKind = 'Instance' | 'NotApplicable' | 'Type';

export type DataTypeDefXsd =
    | 'xs:anyURI'
    | 'xs:base64Binary'
    | 'xs:boolean'
    | 'xs:byte'
    | 'xs:date'
    | 'xs:dateTime'
    | 'xs:decimal'
    | 'xs:double'
    | 'xs:duration'
    | 'xs:float'
    | 'xs:gDay'
    | 'xs:gMonth'
    | 'xs:gMonthDay'
    | 'xs:gYear'
    | 'xs:gYearMonth'
    | 'xs:hexBinary'
    | 'xs:int'
    | 'xs:integer'
    | 'xs:long'
    | 'xs:negativeInteger'
    | 'xs:nonNegativeInteger'
    | 'xs:nonPositiveInteger'
    | 'xs:positiveInteger'
    | 'xs:short'
    | 'xs:string'
    | 'xs:time'
    | 'xs:unsignedByte'
    | 'xs:unsignedInt'
    | 'xs:unsignedLong'
    | 'xs:unsignedShort';

export type DataTypeIec61360 =
    | 'BLOB'
    | 'BOOLEAN'
    | 'DATE'
    | 'FILE'
    | 'HTML'
    | 'INTEGER_COUNT'
    | 'INTEGER_CURRENCY'
    | 'INTEGER_MEASURE'
    | 'IRDI'
    | 'IRI'
    | 'RATIONAL'
    | 'RATIONAL_MEASURE'
    | 'REAL_COUNT'
    | 'REAL_CURRENCY'
    | 'REAL_MEASURE'
    | 'STRING'
    | 'STRING_TRANSLATABLE'
    | 'TIME'
    | 'TIMESTAMP';

export type Direction = 'input' | 'output';

export type EntityType = 'CoManagedEntity' | 'SelfManagedEntity';

export type KeyTypes =
    | 'AnnotatedRelationshipElement'
    | 'AssetAdministrationShell'
    | 'BasicEventElement'
    | 'Blob'
    | 'Capability'
    | 'ConceptDescription'
    | 'DataElement'
    | 'Entity'
    | 'EventElement'
    | 'File'
    | 'FragmentReference'
    | 'GlobalReference'
    | 'Identifiable'
    | 'MultiLanguageProperty'
    | 'Operation'
    | 'Property'
    | 'Range'
    | 'Referable'
    | 'ReferenceElement'
    | 'RelationshipElement'
    | 'Submodel'
    | 'SubmodelElement'
    | 'SubmodelElementCollection'
    | 'SubmodelElementList';

export type ModelType =
    | 'AnnotatedRelationshipElement'
    | 'AssetAdministrationShell'
    | 'BasicEventElement'
    | 'Blob'
    | 'Capability'
    | 'ConceptDescription'
    | 'DataSpecificationIEC61360'
    | 'Entity'
    | 'File'
    | 'MultiLanguageProperty'
    | 'Operation'
    | 'Property'
    | 'Range'
    | 'ReferenceElement'
    | 'RelationshipElement'
    | 'Submodel'
    | 'SubmodelElementCollection'
    | 'SubmodelElementList';

export type ModellingKind = 'Instance' | 'Template';

export type QualifierKind = 'ConceptQualifier' | 'TemplateQualifier' | 'ValueQualifier';

export type ReferenceTypes = 'ExternalReference' | 'ModelReference';

export type StateOfEvent = 'off' | 'on';

export interface LangString {
    language: string;
    text: string;
}

export interface AdministrativeInformation extends HasDataSpecification {
    creator?: Reference;
    revision?: string;
    templateId?: string;
    version?: string;
}

export interface AnnotatedRelationshipElement extends RelationshipElement {
    annotations?: DataElement[];
}

export interface AssetAdministrationShell extends HasDataSpecification, Identifiable {
    assetInformation: AssetInformation;
    derivedFrom?: Reference;
    submodels?: Reference[];
}

export interface AssetInformation {
    assetKind: AssetKind;
    assetType?: string;
    defaultThumbnail?: Resource;
    globalAssetId?: string;
    specificAssetIds?: SpecificAssetId[];
}

export interface BasicEventElement extends EventElement {
    direction: Direction;
    lastUpdate?: string;
    maxInterval?: string;
    messageBroker?: Reference;
    messageTopic?: string;
    minInterval?: string;
    observed: Reference;
    state: StateOfEvent;
}

export interface Blob extends DataElement {
    contentType: string;
    value?: string;
}

export type Capability = SubmodelElement;

export interface ConceptDescription extends HasDataSpecification, Identifiable {
    isCaseOf?: Reference[];
}

export interface DataElement extends SubmodelElement {
    nodeId?: string;
}

export interface DataSpecificationContent {
    modelType: ModelType;
}

export interface DataSpecificationIec61360 extends DataSpecificationContent {
    dataType?: DataTypeIec61360;
    definition?: LangString[];
    levelType?: LevelType;
    preferredName: LangString[];
    shortName?: LangString[];
    sourceOfDefinition?: string;
    symbol?: string;
    unit?: string;
    unitId?: Reference;
    value?: string;
    valueFormat?: string;
    valueList?: ValueList;
}

export interface EmbeddedDataSpecification {
    dataSpecification: Reference;
    dataSpecificationContent: DataSpecificationContent;
}

export interface Entity extends SubmodelElement {
    entityType: EntityType;
    globalAssetId?: string;
    specificAssetIds?: SpecificAssetId[];
    statements?: SubmodelElement[];
}

export interface Environment {
    assetAdministrationShells: AssetAdministrationShell[];
    conceptDescriptions: ConceptDescription[];
    submodels: Submodel[];
}

export type EventElement = SubmodelElement;

export interface EventPayload {
    observableReference: Reference;
    observableSemanticId?: Reference;
    payload?: string;
    source: Reference;
    sourceSemanticId?: Reference;
    subjectId?: Reference;
    timeStamp: string;
    topic?: string;
}

export interface Extension extends HasSemantics {
    name: string;
    refersTo?: Reference[];
    value?: string;
    valueType?: DataTypeDefXsd;
}

export interface File extends DataElement {
    contentType: string;
    value?: string;
}

export interface HasDataSpecification {
    embeddedDataSpecifications?: EmbeddedDataSpecification[];
}

export interface HasExtensions {
    extensions?: Extension[];
}

export interface HasKind {
    kind?: ModellingKind;
}

export interface HasSemantics {
    semanticId?: Reference;
    supplementalSemanticIds?: Reference[];
}

export interface Identifiable extends Referable {
    administration?: AdministrativeInformation;
    id: string;
}

export interface Key {
    type: KeyTypes;
    value: string;
}

export interface LevelType {
    max: boolean;
    min: boolean;
    nom: boolean;
    typ: boolean;
}

export interface MultiLanguageProperty extends DataElement {
    value?: LangString[];
    valueId?: Reference;
}

export interface Operation extends SubmodelElement {
    inoutputVariables?: OperationVariable[];
    inputVariables?: OperationVariable[];
    methodId?: string;
    objectId?: string;
    outputVariables?: OperationVariable[];
}

export interface OperationVariable {
    value: SubmodelElement;
}

export interface Property extends DataElement {
    value?: string;
    valueId?: Reference;
    valueType: DataTypeDefXsd;
}

export interface Qualifiable {
    qualifiers?: Qualifier[];
}

export interface Qualifier extends HasSemantics {
    kind?: QualifierKind;
    type: string;
    value?: string;
    valueId?: Reference;
    valueType: DataTypeDefXsd;
}

export interface Range extends DataElement {
    max?: string;
    min?: string;
    valueType: DataTypeDefXsd;
}

export interface Referable extends HasExtensions {
    category?: string;
    description?: LangString[];
    displayName?: LangString[];
    idShort: string;
    modelType: ModelType;
    parent?: Reference;
}

export interface Reference {
    keys: Key[];
    referredSemanticId?: Reference;
    type: ReferenceTypes;
}

export interface ReferenceElement extends DataElement {
    value?: Reference;
}

export interface RelationshipElement extends SubmodelElement {
    first: Reference;
    second: Reference;
}

export interface Resource {
    contentType?: string;
    path: string;
}

export interface SpecificAssetId extends HasSemantics {
    externalSubjectId?: Reference;
    name: string;
    value: string;
}

export interface Submodel extends Qualifiable, HasKind, HasSemantics, HasDataSpecification, Identifiable {
    submodelElements?: SubmodelElement[];
}

export interface SubmodelElement extends Qualifiable, HasDataSpecification, HasSemantics, Referable {}

export interface SubmodelElementCollection extends SubmodelElement {
    value?: SubmodelElement[];
}

export interface SubmodelElementList extends SubmodelElement {
    orderRelevant?: boolean;
    semanticIdListElement?: Reference;
    typeValueListElement: AASSubmodelElements;
    value?: SubmodelElement[];
    valueTypeListElement?: DataTypeDefXsd;
}

export interface ValueList {
    valueReferencePairs: ValueReferencePair[];
}

export interface ValueReferencePair {
    value: string;
    valueId: Reference;
}
