/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Pojo } from 'node-opcua-client-crawler';
import { aas, AASDocument, LiveValue } from 'aas-core';
import {
    NodeIdLike,
    DataValueOptions,
    LocalizedTextOptions,
    NodeId,
    ClientSession,
    AttributeIds,
    QualifiedName,
} from 'node-opcua';

export type BaseTypeDefinition = 'Operation' | 'FolderType' | 'FileType';

export type AASTypeDefinition =
    | 'AASEnvironmentType'
    | 'AASAssetInformationType'
    | 'AASAssetAdministrationShellType'
    | 'AASAssetType'
    | 'AASEventType'
    | 'AASBlobType'
    | 'AASCapabilityType'
    | 'AASEntityType'
    | 'AASSubmodelType'
    | 'AASSubmodelElementCollectionType'
    | 'AASOrderedSubmodelElementCollectionType'
    | 'AASPropertyType'
    | 'AASFileType'
    | 'AASViewType'
    | 'AASContainedElementRefType'
    | 'AASQualifierList'
    | 'AASRangeType'
    | 'AASReferenceElementType'
    | 'AASReferenceType'
    | 'AASReferenceList'
    | 'AASRelationshipElementType'
    | 'AASMultiLanguagePropertyType'
    | 'AASOperationType';

export interface AssetInformation {
    kind: aas.AssetKind;
    globalAssetId: aas.Reference;
    category?: string;
    billOfMaterial?: aas.Reference[];
    specificAssetId?: aas.Reference[];
}

export type TypeDefinition = BaseTypeDefinition | AASTypeDefinition;

export interface OPCUANode extends Pojo {
    nodeId: NodeId;
    browseName: string;
    typeDefinition: TypeDefinition;
}

export interface OPCUAProperty extends OPCUANode {
    dataType: NodeIdLike;
    dataValue: DataValueOptions;
}

export enum UAKeyElements {
    AccessPermissionRule = 0,
    AnnotatedRelationshipElement = 1,
    Asset = 2,
    AssetAdministrationShell = 3,
    Blob = 4,
    Capability = 5,
    ConceptDescription = 6,
    ConceptDictionary = 7,
    DataElement = 8,
    Entity = 9,
    Event = 10,
    File = 11,
    FragmentReference = 12,
    GlobalReference = 13,
    MultiLanguageProperty = 14,
    Operation = 15,
    Property = 16,
    Range = 17,
    ReferenceElement = 18,
    RelationshipElement = 19,
    Submodel = 20,
    SubmodelElement = 21,
    SubmodelElementCollection = 22,
    View = 23,
}

export enum ValueType {
    Boolean = 0,
    SByte = 1,
    Byte = 2,
    Int16 = 3,
    UInt16 = 4,
    Int32 = 5,
    UInt32 = 6,
    Int64 = 7,
    UInt64 = 8,
    Float = 9,
    Double = 10,
    String = 11,
    DateTime = 12,
    ByteString = 13,
    LocalizedText = 14,
    UtcTime = 15,
}

export enum PropertyValueType {
    AnyType,
    AllComplexTypes,
    AnySimpleType,
    AnyAtomicType,
    AnyURI,
    Base64Binary,
    Boolean,
    Date,
    DateTime,
    DateTimeStamp,
    Decimal,
    Integer,
    Long,
    Int,
    Short,
    Byte,
    NonNegativeInteger,
    PositiveInteger,
    UnsignedLong,
    UnsignedInt,
    UnsignedShort,
    UnsignedByte,
    NonPositiveInteger,
    NegativeInteger,
    Double,
    Duration,
    DayTimeDuration,
    YearMonthDuration,
    Float,
    GDay,
    GMonth,
    GMonthDay,
    GYear,
    GYearMonth,
    HexBinary,
    NOTATION,
    QName,
    String,
    NormalizedString,
    Token,
    Language,
    Name,
    NCName,
    ENTITY,
    ID,
    IDREF,
    NMTOKEN,
    Time,
    ENTITIES,
    IDREFS,
    NMTOKENS,
}

export enum DataTypeIEC61360Type {
    DATE,
    STRING,
    STRING_TRANSLATABLE,
    INTEGER_MEASURE,
    INTEGER_COUNT,
    INTEGER_CURRENCY,
    REAL_MEASURE,
    REAL_COUNT,
    REAL_CURRENCY,
    BOOLEAN,
    URL,
    RATIONAL,
    RATIONAL_MEASURE,
    TIME,
    TIMESTAMP,
}

export enum UAIdentifierType {
    IRDI = 0,
    IRI = 1,
    Custom = 2,
}

export enum UAKeyType {
    idShort = 0,
    FragmentId = 1,
    Custom = 2,
    IRDI = 3,
    IRI = 4,
}

export interface UAKey {
    idType: UAKeyType;
    type: UAKeyElements;
    locale: boolean;
    value: string;
}

export enum UAEntityType {
    CoManagedEntity,
    SelfManagedEntity,
}

export interface OPCUAComponent extends OPCUANode {
    displayName: LocalizedTextOptions;
    hasComponent?: OPCUAComponent[];
    hasAddIn?: OPCUAComponent[];
    hasProperty: OPCUAProperty[];
    aaSReference?: OPCUAProperty[];
    nodeClass: string;
}

export interface OPCUAReadRequest {
    aas: AASDocument;
    nodes: LiveValue[];
}

export interface AASKeyDataType {
    type: UAKeyElements;
    value: unknown;
    idType: UAKeyType;
}

export async function readDataTypeAsync(session: ClientSession, dataType: NodeIdLike): Promise<string> {
    const qualifiedName: QualifiedName = (
        await session.read({
            nodeId: dataType,
            attributeId: AttributeIds.BrowseName,
        })
    ).value.value;

    if (typeof qualifiedName.name === 'string') {
        return qualifiedName.name;
    }

    throw new Error('Invalid operation.');
}
