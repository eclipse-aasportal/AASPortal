/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

export type AasSubmodelElements =
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

export interface AdministrativeInformation extends HasDataSpecification {
    version?: string;
    revision?: string;
    creator?: Reference;
    template?: string;
}

export interface AnnotatedRelationshipElement extends RelationshipElement {
    annotations: DataElement[];
}

export interface AssetAdministrationShell extends Identifiable, HasDataSpecification {
    derivedFrom?: Reference;
    assetInformation: AssetInformation;
    submodels?: Reference[];
}

export interface AssetInformation {
    assetKind: AssetKind;
    globalAssetId?: string;
    specificAssetIds?: SpecificAssetId[];
    assetType?: string;
    defaultThumbnail?: Resource;
}

export type AssetKind = 'Type' | 'NotApplicable' | 'Instance';

export interface BasicEventElement extends EventElement {
    observed: Reference;
    direction: Direction;
    state: StateOfEvent;
    messageTopic?: string;
    messageBroker?: Reference;
    lastUpdate?: string;
    minInterval?: string;
    maxInterval?: string;
}

export interface Blob extends DataElement {
    contentType: string;
    value?: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Capability extends SubmodelElement {}

export interface ConceptDescription extends Identifiable, HasDataSpecification {
    isCaseOf?: Reference[];
}

export interface DataElement extends SubmodelElement {
    /** OPC UA */
    nodeId?: string;
}

export interface DataSpecificationContent {
    modelType: ModelType;
}

export interface DataSpecificationIEC61360 extends DataSpecificationContent {
    preferredName: LangString[];
    shortName?: LangString[];
    unit?: string;
    unitId?: Reference;
    sourceOfDefinition?: string;
    symbol?: string;
    dataType?: DataTypeIEC61360;
    definition?: LangString[];
    valueFormat?: string;
    valueList?: ValueList;
    value?: string;
    levelType?: LevelType;
}

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

export type DataTypeIEC61360 =
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

export interface EmbeddedDataSpecification {
    dataSpecification: Reference;
    dataSpecificationContent: DataSpecificationContent;
}

export interface Entity extends SubmodelElement {
    statements?: SubmodelElement[];
    entityType: EntityType;
    globalAssetId?: string;
    specificAssetId?: SpecificAssetId;
}

export type EntityType = 'CoManagedEntity' | 'SelfManagedEntity';

export interface Environment {
    assetAdministrationShells: AssetAdministrationShell[];
    submodels: Submodel[];
    conceptDescriptions: ConceptDescription[];
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface EventElement extends SubmodelElement {}

export interface EventPayload extends SubmodelElement {
    source: Reference;
    sourceSemanticId?: Reference;
    observableReference: Reference;
    observableSemanticId?: Reference;
    topic?: string;
    subjectId?: Reference;
    timeStamp: string;
    payload?: string;
}

export interface Extension extends HasSemantic {
    name: string;
    valueType?: DataTypeDefXsd;
    value?: string;
    refersTo?: Reference;
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

export interface HasSemantic {
    semanticId?: Reference;
    supplementalSemanticIds?: Reference;
}

export interface Identifiable extends Referable {
    administration?: AdministrativeInformation;
    id: string;
}

export interface Key {
    type: KeyTypes;
    value: string;
}

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

export interface LangString {
    language: string;
    text: string;
}

export type LevelType = 'Max' | 'Min' | 'Nom' | 'Typ';

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

export type ModellingKind = 'Template' | 'Instance';

export interface MultiLanguageProperty extends DataElement {
    value: LangString[];
    valueId?: Reference;
}

export interface Operation extends SubmodelElement {
    inputVariables?: OperationVariable[];
    outputVariables?: OperationVariable[];
    inoutputVariables?: OperationVariable[];
    /** The node ID of the operation node. */
    methodId?: string;
    /** The node ID of the operation submodel element. */
    objectId?: string;
}

export interface OperationVariable {
    value: SubmodelElement;
}

export interface Property extends DataElement {
    valueType: DataTypeDefXsd;
    value?: string;
    valueId?: Reference;
}

export interface Qualifiable {
    qualifiers?: Qualifier[];
}

export interface Qualifier extends HasSemantic {
    kind?: QualifierKind;
    type: string;
    valueType: DataTypeDefXsd;
    value?: string;
    valueId?: Reference;
}

export type QualifierKind = 'ConceptQualifier' | 'TemplateQualifier' | 'ValueQualifier';

export interface Range extends DataElement {
    valueType: DataTypeDefXsd;
    min?: string;
    max?: string;
}

/** Metainformation if SubmodelElement is DataElement */
export type Category = 'CONSTANT' | 'PARAMETER' | 'VARIABLE';

export interface Referable {
    category?: string;
    idShort: string;
    displayName?: LangString[];
    descriptions?: LangString[];
    modelType: ModelType;
    /** For internal use. */
    parent?: Reference;
}

export interface Reference {
    type: ReferenceTypes;
    referredSemanticId?: Reference;
    keys: Key[];
}

export interface ReferenceElement extends DataElement {
    value: Reference;
}

export type ReferenceTypes = 'ExternalReference' | 'ModelReference';

export interface RelationshipElement extends SubmodelElement {
    first: Reference;
    second: Reference;
}

export interface Resource {
    path: string;
    contentType?: string;
}

export interface SpecificAssetId extends HasSemantic {
    name: string;
    value: string;
    externalSubjectId: Reference;
}

export type StateOfEvent = 'on' | 'off';

export interface Submodel extends Identifiable, HasKind, HasSemantic, Qualifiable, HasDataSpecification {
    submodelElements?: SubmodelElement[];
}

export interface SubmodelElement extends Referable, HasKind, HasSemantic, Qualifiable, HasDataSpecification {}

export interface SubmodelElementCollection extends SubmodelElement {
    value?: SubmodelElement[];
}

export interface SubmodelElementList extends SubmodelElement {
    orderRelevant?: boolean;
    semanticIdListElement?: Reference;
    typeValueListElement: AasSubmodelElements;
    valueTypeListElement?: DataTypeDefXsd;
    value?: SubmodelElement[];
}

export interface ValueList {
    valueReferencePairs: ValueReferencePair[];
}

export interface ValueReferencePair {
    value: string;
    valueId: Reference;
}
