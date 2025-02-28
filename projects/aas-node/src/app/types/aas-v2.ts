/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

/** Defines the supported AAS element types. */
export type ModelTypes =
    | 'Asset'
    | 'AssetAdministrationShell'
    | 'ConceptDescription'
    | 'Submodel'
    | 'AccessPermissionRule'
    | 'AnnotatedRelationshipElement'
    | 'BasicEvent'
    | 'Blob'
    | 'Capability'
    | 'ConceptDictionary'
    | 'DataElement'
    | 'File'
    | 'Entity'
    | 'Event'
    | 'MultiLanguageProperty'
    | 'Operation'
    | 'Property'
    | 'Range'
    | 'ReferenceElement'
    | 'RelationshipElement'
    | 'SubmodelElement'
    | 'SubmodelElementCollection'
    | 'View'
    | 'GlobalReference'
    | 'FragmentReference'
    | 'Constraint'
    | 'Formula'
    | 'Qualifier';

/** Identifiable elements within an asset administration shell that are not identifiable (from AAS Metamodel). */
export type IdentifiableElements = 'Asset' | 'AssetAdministrationShell' | 'ConceptDescription' | 'Submodel';

/** Referable elements within an asset administration shell (from AAS Metamodel). */
export type ReferableElements =
    | IdentifiableElements
    | 'AccessPermissionRule'
    | 'AnnotatedRelationshipElement'
    | 'BasicEvent'
    | 'Blob'
    | 'Capability'
    | 'DataElement'
    | 'File'
    | 'Entity'
    | 'Event'
    | 'MultiLanguageProperty'
    | 'Operation'
    | 'Property'
    | 'Range'
    | 'View'
    | 'ReferenceElement'
    | 'RelationshipElement'
    | 'SubmodelElement'
    | 'SubmodelElementCollection';

/** Different key value types within a key (from AAS Metamodel). */
export type KeyElements = ReferableElements | 'GlobalReference' | 'FragmentReference';

/** Defines the different key value types within a key (from AAS Metamodel). */
export type KeyType = 'IRI' | 'IRDI' | 'Custom' | 'IdShort' | 'FragmentId';

/**  */
export type DataTypeDefXsd =
    | 'anyURI'
    | 'base64Binary'
    | 'boolean'
    | 'byte'
    | 'date'
    | 'dateTime'
    | 'dateTimeStamp'
    | 'dayTimeDuration'
    | 'decimal'
    | 'double'
    | 'duration'
    | 'float'
    | 'gDay'
    | 'gMonth'
    | 'gMonthDay'
    | 'gYear'
    | 'gYearMonth'
    | 'hexBinary'
    | 'int'
    | 'integer'
    | 'long'
    | 'negativeInteger'
    | 'nonNegativeInteger'
    | 'nonPositiveInteger'
    | 'positiveInteger'
    | 'short'
    | 'string'
    | 'time'
    | 'unsignedByte'
    | 'unsignedInt'
    | 'unsignedLong'
    | 'unsignedShort'
    | 'yearMonthDuration';

/** Enumeration of simple data types for a IEC61360 concept description
 * using the data specification template DataSpecificationIec61360 */
export type DataTypeIec61360 =
    | 'DATE'
    | 'STRING'
    | 'STRING_TRANSLATABLE'
    | 'INTEGER_MEASURE'
    | 'INTEGER_COUNT'
    | 'INTEGER_CURRENCY'
    | 'REAL_MEASURE'
    | 'REAL_COUNT'
    | 'REAL_CURRENCY'
    | 'BOOLEAN'
    | 'URL'
    | 'RATIONAL'
    | 'RATIONAL_MEASURE'
    | 'TIME'
    | 'TIMESTAMP';

/** Reference to an element by its id (from AAS Metamodel). */
export interface Key {
    type: KeyElements;
    idType: KeyType;
    value: string;
    local: boolean;
    index: number;
}

/** Denotes, whether reference is a global reference or a model reference. */
export type ReferenceTypes = 'GlobalReference' | 'ModelReference';

/** Reference to either a model element of the same or another AAS or to an external entity. */
export interface Reference {
    keys: Key[];
}

/** Represents a localizable text. */
export interface LangString {
    language: string;
    text: string;
}

export interface ModelType {
    name: ModelTypes;
}

/** Element that can have a semantic definition. */
export interface HasSemantic {
    semanticId?: Reference;
}

export type ModellingKind = 'Template' | 'Instance';

/** An element with a kind is an element that can either represent a template or an instance. */
export interface HasKind {
    kind?: ModellingKind;
}

/** Element that can be extended by using data specification templates. */
export interface HasDataSpecification {
    embeddedDataSpecifications?: EmbeddedDataSpecification[];
}

export interface ValueObject {
    valueType?: DataTypeDefXsd;
    value?: string;
    valueId?: Reference;
}

/** A constraint is used to further qualify or restrict an element. */
export interface Constraint {
    modelType: ModelType;
}

/** A qualifier is a type-value-pair that makes additional statements w.r.t. the value of the element. */
export interface Qualifier extends Constraint, HasSemantic, ValueObject {
    type: string;
}

/** A formula is used to describe constraints by a logical expression. */
export interface Formula extends Constraint {
    dependsOn?: Reference[];
}

/** The value of a qualifiable element may be further qualified by one or more qualifiers or complex formulas. */
export interface Qualifiable {
    qualifiers?: Constraint[];
}

/** Metainformation of a property (from AAS Metamodel). */
export type Category = 'CONSTANT' | 'PARAMETER' | 'VARIABLE';

/** An element that is referable by its idShort. This id is not globally unique.
 * This id is unique within the name space of the element. */
export interface Referable {
    modelType: ModelType;
    idShort: string;
    category?: Category;
    descriptions?: LangString[];
    parent?: Reference;
}

/** Used to uniquely identify an element by using an identifier (from AAS Metamodel). */
export interface Identifier {
    idType: KeyType;
    id: string;
}

/** Administrative metainformation for an element like version information (from AAS Metamodel). */
export interface AdministrativeInformation {
    /** Version of the element. */
    version?: string;
    /** Revision of the element. */
    revision?: string;
}

/** An element that has a globally unique identifier. */
export interface Identifiable extends Referable {
    administration?: AdministrativeInformation;
    identification: Identifier;
}

export type DataSpecificationContent = object;

/** Content of data specification template for concept descriptions for properties,
 * values and value lists conformant to IEC 61360. */
export interface DataSpecificationIec61360Content extends DataSpecificationContent {
    preferredName: LangString[];
    shortName?: LangString[];
    unit?: string;
    unitId?: Reference;
    sourceOfDefinition?: string;
    symbol?: string;
    dataType?: DataTypeIec61360;
    definition?: LangString[];
    valueFormat?: string;
    valueList?: ValueList;
    value?: string;
    levelType?: LevelType;
}

export interface LevelType {
    max: boolean;
    min: boolean;
    nom: boolean;
    typ: boolean;
}

/** Content of data specification template for concept descriptions for physical units
 * conformant to IEC 61360. */
export interface DataSpecificationPhysicalUnitContent extends DataSpecificationContent {
    unitName: string;
    unitSymbol: string;
    definition: LangString[];
    siNotation?: string;
    siName?: string;
    dinNotation?: string;
    eceName?: string;
    eceCode?: string;
    nistName?: string;
    sourceOfDefinition?: string;
    conversionFactor?: string;
    registrationAuthorityId?: string;
    supplier?: string;
}

export interface ValueList {
    valueReferencePairTypes: ValueReferencePairType[];
}

export type ValueReferencePairType = ValueObject;

export interface EmbeddedDataSpecification {
    dataSpecification: Reference;
    dataSpecificationContent: DataSpecificationContent;
}

/** An Asset describes meta data of an asset that is represented by an AAS and 
    is identical for all AAS representing this asset. */
export interface Asset extends Identifiable, HasDataSpecification {
    kind: AssetKind;
    assetIdentificationModel?: Reference;
    billOfMaterial?: Reference;
}

export type AssetKind = 'Type' | 'Instance';

/** A submodel element is an element suitable for the description and differentiation of assets. */
export interface SubmodelElement extends Referable, HasDataSpecification, HasSemantic, Qualifiable, HasKind {}

export interface SubmodelElementCollection extends SubmodelElement {
    ordered?: boolean;
    allowDuplicates?: boolean;
    value?: SubmodelElement[];
}

/** An event element. */
export type Event = SubmodelElement;

/** A basic event element. */
export interface BasicEvent extends Event {
    observed: Reference;
}

/** A data element is a submodel element that has a value. The type of value differs for 
different subtypes of data elements. */
export interface DataElement extends SubmodelElement {
    /** OPC UA */
    nodeId?: string;
}

/** A property is a data element that has a single value. */
export interface Property extends DataElement {
    valueType: ValueTypeDef;
    value?: string;
    valueId?: Reference;
}

/** A range data element is a data element that defines a range with min and max. */
export interface Range extends DataElement {
    valueType: ValueTypeDef;
    min?: string;
    max?: string;
}

export interface ValueTypeDef {
    dataObjectType: DataObjectType;
}

export interface DataObjectType {
    name: DataTypeDefXsd;
}

/** A property is a data element that has a multi-language value. */
export interface MultiLanguageProperty extends DataElement {
    value: LangStringSet;
    valueId?: Reference;
}

export type LangStringSet = {
    langString: LangString[];
};

/** A File is a data element that represents an address to a file.
 * The value is an URI that can represent an absolute or relative path. */
export interface File extends DataElement {
    mimeType: string;
    value?: string;
}

/** A BLOB is a data element that represents a file that is contained with its source code in the
 * value attribute. */
export interface Blob extends DataElement {
    mimeType: string;
    value?: string;
}

/** A reference element is a data element that defines a logical reference to another element
 * within the same or another AAS or a reference to an external object or entity. */
export interface ReferenceElement extends DataElement {
    value: Reference;
}

/** A relationship element is used to define a relationship between two referable elements. */
export interface RelationshipElement extends SubmodelElement {
    first: Reference;
    second: Reference;
}

/** An annotated relationship element is a relationship element that can be annotated
 * with additional data elements.*/
export interface AnnotatedRelationshipElement extends RelationshipElement {
    annotation: DataElement[];
}

/** Enumeration for denoting whether an entity is a self-managed entity or a co-managed entity. */
export type EntityType =
    /** For co-managed entities there is no separate AAS. Co-managed entities need to be part of a self-managed entity. */
    | 'CoManagedEntity'
    /** Self-Managed Entities have their own AAS but can be part of the bill of material of a composite self-managed entity. */
    | 'SelfManagedEntity';

/** An IdentifierKeyValuePair describes a generic identifier as key-value pair. */
export interface IdentifierKeyValuePair {
    key: string;
    value: string;
    externalSubjectId: Reference;
}

/** An entity is a submodel element that is used to model entities. */
export interface Entity extends SubmodelElement {
    entityType: EntityType;
    asset?: Reference;
    statements?: SubmodelElement[];
}

/** A capability is the implementation-independent description of the potential of an
 * asset to achieve a certain effect in the physical or virtual world.  */
export type Capability = SubmodelElement;

/** An operation variable is a submodel element that is used as input or output variable of an operation. */
export interface OperationVariable {
    value: SubmodelElement;
}

/** An operation is a submodel element with input and output variables. */
export interface Operation extends SubmodelElement {
    inputVariable?: OperationVariable[];
    outputVariable?: OperationVariable[];
    inoutputVariable?: OperationVariable[];
    /** The node ID of the operation node. */
    methodId?: string;
    /** The node ID of the operation submodel element. */
    objectId?: string;
}

/** A submodel defines a specific aspect of the asset represented by the AAS. */
export interface Submodel extends Identifiable, HasDataSpecification, HasSemantic, Qualifiable, HasKind {
    submodelElements?: SubmodelElement[];
}

export interface View extends Referable, HasDataSpecification, HasSemantic {
    containedElements?: Reference[];
}

/** The semantics of a property or other elements that may have a semantic description is defined by
 * a concept description. */
export interface ConceptDescription extends Identifiable, HasDataSpecification {
    isCaseOf?: Reference[];
}

export interface ConceptDictionary extends Referable, HasDataSpecification {
    conceptDescriptions?: Reference[];
}

/** The Asset Administration Shell. */
export interface AssetAdministrationShell extends Identifiable, HasDataSpecification {
    asset: Reference;
    derivedFrom?: Reference;
    submodels?: Reference[];
    views?: View[];
    conceptDictionaries?: ConceptDictionary[];
}

/** Asset Administration Shell environment */
export interface AssetAdministrationShellEnvironment {
    assetAdministrationShells: AssetAdministrationShell[];
    assets: Asset[];
    submodels: Submodel[];
    conceptDescriptions: ConceptDescription[];
}
