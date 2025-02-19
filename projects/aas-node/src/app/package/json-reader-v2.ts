/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { AASReader } from './aas-reader.js';
import { determineType, aas, isIdentifiable } from 'aas-core';
import { encodeBase64Url } from '../convert.js';
import * as aasv2 from '../types/aas-v2.js';

export class JsonReaderV2 extends AASReader {
    private readonly origin: aasv2.AssetAdministrationShellEnvironment;

    public constructor(origin?: aasv2.AssetAdministrationShellEnvironment | string) {
        super();

        if (origin) {
            this.origin = typeof origin === 'string' ? JSON.parse(origin) : origin;
        } else {
            this.origin = { assetAdministrationShells: [], assets: [], conceptDescriptions: [], submodels: [] };
        }
    }

    public readEnvironment(): aas.Environment {
        const conceptDescriptions = this.readConceptDescriptions();
        const assetAdministrationShells = this.readAssetAdministrationShells();
        const submodels = this.readSubmodels();
        return { assetAdministrationShells, submodels, conceptDescriptions };
    }

    public read(data: string | object): aas.Referable {
        const source: aasv2.Referable = typeof data === 'string' ? JSON.parse(data) : data;
        switch (source.modelType.name) {
            case 'Asset':
            case 'AssetAdministrationShell':
                throw new Error('Invalid operation.');
            case 'Submodel':
                return this.readSubmodel(source as aasv2.Submodel);
            default:
                return this.readSubmodelElement(source as aasv2.SubmodelElement, []);
        }
    }

    private readConceptDescriptions(): aas.ConceptDescription[] {
        const conceptDescriptions: aas.ConceptDescription[] = [];
        if (this.origin?.conceptDescriptions) {
            for (const source of this.origin.conceptDescriptions) {
                conceptDescriptions.push(this.readConceptDescription(source));
            }
        }

        return conceptDescriptions;
    }

    private readAssetAdministrationShells(): aas.AssetAdministrationShell[] {
        const shells: aas.AssetAdministrationShell[] = [];
        if (this.origin?.assetAdministrationShells) {
            for (const source of this.origin.assetAdministrationShells) {
                shells.push(this.readAssetAdministrationShell(source));
            }
        }

        return shells;
    }

    private readAssetAdministrationShell(source: aasv2.AssetAdministrationShell): aas.AssetAdministrationShell {
        if (!source.asset) {
            throw new Error('AssetAdministrationShell.asset');
        }

        const shell: aas.AssetAdministrationShell = {
            ...this.readIdentifiable(source),
            ...this.readHasDataSpecification(source),
            assetInformation: this.readAssetInformation(this.origin.assets[0]),
        };

        if (source.derivedFrom) {
            shell.derivedFrom = this.readReference(source.derivedFrom);
        }

        if (source.administration) {
            shell.administration = this.readAdministrationInformation(source.administration);
        }

        if (source.submodels) {
            shell.submodels = source.submodels.map(item => this.readReference(item));
        }

        return shell;
    }

    private readAdministrationInformation(source: aasv2.AdministrativeInformation): aas.AdministrativeInformation {
        const info: aas.AdministrativeInformation = {};
        if (source.revision) {
            info.revision = source.revision;
        }

        if (source.version) {
            info.version = source.version;
        }

        return info;
    }

    private readConceptDescription(source: aasv2.ConceptDescription): aas.ConceptDescription {
        const conceptDescription: aas.ConceptDescription = {
            ...this.readIdentifiable(source),
            ...this.readHasDataSpecification(source),
        };

        if (source.isCaseOf) {
            conceptDescription.isCaseOf = source.isCaseOf.map(item => this.readReference(item));
        }

        return conceptDescription;
    }

    private readAssetInformation(source: aasv2.Asset): aas.AssetInformation {
        const asset: aas.AssetInformation = {
            assetKind: source.kind ?? 'Instance',
            globalAssetId: source.identification.id,
        };

        return asset;
    }

    private readSubmodels(): aas.Submodel[] {
        const submodels: aas.Submodel[] = [];
        if (this.origin) {
            for (const item of this.origin.submodels) {
                submodels.push(this.readSubmodel(item));
            }
        }

        return submodels;
    }

    private readSubmodel(source: aasv2.Submodel): aas.Submodel {
        const submodel: aas.Submodel = {
            ...this.readIdentifiable(source),
            ...this.readHasSemantic(source),
            ...this.readQualifiable(source),
            ...this.readHasKind(source),
            ...this.readHasDataSpecification(source),
        };

        if (source.submodelElements) {
            submodel.submodelElements = this.readSubmodelElements(source.submodelElements, [submodel]);
        }

        return submodel;
    }

    private readSubmodelElements(sources: aasv2.SubmodelElement[], ancestors: aas.Referable[]): aas.SubmodelElement[] {
        const submodelElements: aas.SubmodelElement[] = [];
        for (const source of sources) {
            submodelElements.push(this.readSubmodelElement(source, ancestors));
        }

        return submodelElements;
    }

    private readSubmodelElement(source: aasv2.SubmodelElement, ancestors: aas.Referable[]): aas.SubmodelElement {
        switch (source.modelType.name) {
            case 'AnnotatedRelationshipElement':
                return this.readAnnotatedRelationshipElement(source as aasv2.AnnotatedRelationshipElement, ancestors);
            case 'BasicEvent':
                return this.readBasicEvent(source as aasv2.BasicEvent, ancestors);
            case 'Blob':
                return this.readBlob(source as aasv2.Blob, ancestors);
            case 'Entity':
                return this.readEntity(source as aasv2.Entity, ancestors);
            case 'File':
                return this.readFile(source as aasv2.File, ancestors);
            case 'MultiLanguageProperty':
                return this.readMultiLanguageProperty(source as aasv2.MultiLanguageProperty, ancestors);
            case 'Operation':
                return this.readOperation(source as aasv2.Operation, ancestors);
            case 'Property':
                return this.readProperty(source as aasv2.Property, ancestors);
            case 'Range':
                return this.readRange(source as aasv2.Range, ancestors);
            case 'ReferenceElement':
                return this.readReferenceElement(source as aasv2.ReferenceElement, ancestors);
            case 'RelationshipElement':
                return this.readRelationshipElement(source as aasv2.RelationshipElement, ancestors);
            case 'SubmodelElementCollection':
                return this.readSubmodelElementCollection(source as aasv2.SubmodelElementCollection, ancestors);
            default:
                return this.readSubmodelElementType(source, ancestors);
        }
    }

    private readSubmodelElementType(source: aasv2.SubmodelElement, ancestors: aas.Referable[]): aas.SubmodelElement {
        return {
            ...this.readReferable(source, undefined, ancestors),
            ...this.readHasSemantic(source),
            ...this.readHasKind(source),
            ...this.readHasDataSpecification(source),
            ...this.readQualifiable(source),
        };
    }

    private readAnnotatedRelationshipElement(
        source: aasv2.AnnotatedRelationshipElement,
        ancestors: aas.Referable[],
    ): aas.AnnotatedRelationshipElement {
        const relationship: aas.AnnotatedRelationshipElement = {
            ...this.readRelationshipElement(source, ancestors),
        };

        if (source.annotation) {
            relationship.annotations = source.annotation.map(item =>
                this.readSubmodelElementType(item, [...ancestors, relationship]),
            );
        }

        return relationship;
    }

    private readBasicEvent(source: aasv2.BasicEvent, ancestors: aas.Referable[]): aas.BasicEventElement {
        if (!source.observed) {
            throw new Error('BasicEvent.observed');
        }

        const basicEvent: aas.BasicEventElement = {
            ...this.readSubmodelElementType(source, ancestors),
            observed: this.readReference(source.observed),
            direction: 'input',
            state: 'off',
        };

        return basicEvent;
    }

    private readProperty(source: aasv2.Property, ancestors: aas.Referable[]): aas.Property {
        let valueType = this.readValueTypeDef(source.valueType);
        if (!valueType && source.value != null) {
            valueType = determineType(source.value);
        }

        if (!valueType) {
            throw new Error('Property.valueType');
        }

        const property: aas.Property = {
            ...this.readSubmodelElementType(source, ancestors),
            valueType,
        };

        if (source.value) {
            property.value = source.value;
        }

        if (ancestors && (!property.category || property.category === 'VARIABLE')) {
            const smId = encodeBase64Url((ancestors[0] as aas.Submodel).id);
            property.nodeId = `${smId}.${[...ancestors, property].map(item => item.idShort).join('/')}`;
        }

        return property;
    }

    private readMultiLanguageProperty(
        source: aasv2.MultiLanguageProperty,
        ancestors: aas.Referable[],
    ): aas.MultiLanguageProperty {
        const value = this.readLangStringSet(source.value.langString);
        const property: aas.MultiLanguageProperty = {
            ...this.readSubmodelElementType(source, ancestors),
            value,
        };

        return property;
    }

    private readFile(source: aasv2.File, ancestors: aas.Referable[]): aas.File {
        let contentType = source.mimeType;
        if (!contentType) {
            contentType = '';
        }

        const file: aas.File = {
            ...this.readSubmodelElementType(source, ancestors),
            contentType,
        };

        if (source.value) {
            file.value = source.value;
        }

        return file;
    }

    private readBlob(source: aasv2.Blob, ancestors: aas.Referable[]): aas.Blob {
        let contentType = source.mimeType;
        if (!contentType) {
            contentType = '';
        }

        const blob: aas.Blob = {
            ...this.readSubmodelElementType(source, ancestors),
            contentType,
        };

        if (source.value) {
            blob.value = source.value;
        }

        return blob;
    }

    private readSubmodelElementCollection(
        source: aasv2.SubmodelElementCollection,
        ancestors: aas.Referable[],
    ): aas.SubmodelElementCollection {
        const collection: aas.SubmodelElementCollection = {
            ...this.readSubmodelElementType(source, ancestors),
        };

        if (source.value) {
            collection.value = this.readSubmodelElements(source.value, [...ancestors, collection]);
        }

        return collection;
    }

    private readReferenceElement(source: aasv2.ReferenceElement, ancestors: aas.Referable[]): aas.ReferenceElement {
        if (!source.value) {
            throw new Error('ReferenceElement.value');
        }

        const reference: aas.ReferenceElement = {
            ...this.readSubmodelElementType(source, ancestors),
            value: this.readReference(source.value),
        };

        return reference;
    }

    private readRelationshipElement(
        source: aasv2.RelationshipElement,
        ancestors: aas.Referable[],
    ): aas.RelationshipElement {
        if (!source.first) {
            throw new Error('RelationshipElement.first');
        }

        if (!source.second) {
            throw new Error('RelationshipElement.second');
        }

        const relationship: aas.RelationshipElement = {
            ...this.readSubmodelElementType(source, ancestors),
            first: this.readReference(source.first),
            second: this.readReference(source.second),
        };

        return relationship;
    }

    private readOperation(source: aasv2.Operation, ancestors: aas.Referable[]): aas.Operation {
        const operation: aas.Operation = {
            ...this.readSubmodelElementType(source, ancestors),
        };

        if (source.inputVariable) {
            operation.inputVariables = source.inputVariable.map(item =>
                this.readOperationVariable(item, [...ancestors, operation]),
            );
        }

        if (source.inoutputVariable) {
            operation.inoutputVariables = source.inoutputVariable.map(item =>
                this.readOperationVariable(item, [...ancestors, operation]),
            );
        }

        if (source.outputVariable) {
            operation.outputVariables = source.outputVariable.map(item =>
                this.readOperationVariable(item, [...ancestors, operation]),
            );
        }

        return operation;
    }

    private readOperationVariable(source: aasv2.OperationVariable, ancestors: aas.Referable[]): aas.OperationVariable {
        let value: aas.SubmodelElement | undefined;
        if (this.isSubmodelElement(source.value)) {
            value = this.readSubmodelElement(source.value, ancestors);
        } else if ('submodelElement' in source.value) {
            const submodelElement = (source.value as { submodelElement: aasv2.SubmodelElement }).submodelElement;
            if (this.isSubmodelElement(submodelElement)) {
                value = this.readSubmodelElement(submodelElement, ancestors);
            }
        }

        if (!value) {
            throw new Error('OperationVariable.value');
        }

        return { value };
    }

    private readEntity(source: aasv2.Entity, ancestors: aas.Referable[]): aas.Entity {
        if (source.entityType == null) {
            throw new Error('Entity.entityType');
        }

        const entity: aas.Entity = {
            ...this.readSubmodelElementType(source, ancestors),
            entityType: source.entityType,
        };

        if (source.asset) {
            entity.globalAssetId = source.asset.keys[0].value;
        }

        if (source.statements) {
            entity.statements = this.readSubmodelElements(source.statements, [...ancestors, entity]);
        }

        return entity;
    }

    private readRange(source: aasv2.Range, ancestors: aas.Referable[]): aas.Range {
        if (source.valueType == null) {
            throw new Error('Range.valueType');
        }

        const range: aas.Range = {
            ...this.readSubmodelElementType(source, ancestors),
            valueType: this.readDataTypeDefXsd(source.valueType.dataObjectType.name) as aas.DataTypeDefXsd,
        };

        if (source.min) {
            range.min = source.min;
        }

        if (source.max) {
            range.max = source.max;
        }

        return range;
    }

    private readValueTypeDef(source: aasv2.ValueTypeDef): aas.DataTypeDefXsd | undefined {
        return this.readDataTypeDefXsd(source.dataObjectType?.name) as aas.DataTypeDefXsd;
    }

    private readHasSemantic(source: aasv2.HasSemantic): aas.HasSemantics {
        const hasSemantic: aas.HasSemantics = {};
        if (source.semanticId) {
            hasSemantic.semanticId = this.readReference(source.semanticId);
        }

        return hasSemantic;
    }

    private readHasKind(source: aasv2.HasKind): aasv2.HasKind {
        return { kind: source.kind ?? 'Instance' };
    }

    private readQualifiable(source: aasv2.Qualifiable): aas.Qualifiable {
        const qualifiable: aas.Qualifiable = {};

        if (source.qualifiers) {
            qualifiable.qualifiers = source.qualifiers.map(item => this.readQualifier(item));
        }

        return qualifiable;
    }

    private readQualifier(source: aasv2.Constraint): aas.Qualifier {
        let qualifier: aas.Qualifier;
        if (source.modelType.name === 'Qualifier') {
            const sourceQualifier = source as aasv2.Qualifier;
            if (sourceQualifier.valueType == null) {
                throw new Error('Qualifier.valueType');
            }

            qualifier = {
                type: sourceQualifier.type,
                valueType: this.readDataTypeDefXsd(sourceQualifier.valueType),
            };

            if (sourceQualifier.value) {
                qualifier.value = sourceQualifier.value;
            }

            if (sourceQualifier.valueId) {
                qualifier.valueId = this.readReference(sourceQualifier.valueId);
            }
        } else {
            throw new Error('Not implemented.');
        }

        return qualifier;
    }

    private readReferable(source: aasv2.Referable, id?: string, ancestors?: aas.Referable[]): aas.Referable {
        let idShort = source.idShort;
        if (!idShort) {
            if (!id) {
                throw Error(`Referable.idShort.`);
            }

            idShort = this.createIdShort(id);
        }

        if (!source.modelType?.name) {
            throw Error(`Referable.modelType.name.`);
        }

        const referable: aas.Referable = {
            idShort,
            modelType: this.readModelType(source.modelType.name) as aas.ModelType,
        };

        if (ancestors) {
            referable.parent = {
                type: 'ModelReference',
                keys: ancestors.map(ancestor => {
                    if (isIdentifiable(ancestor)) {
                        return {
                            type: ancestor.modelType,
                            value: ancestor.id,
                        } as aas.Key;
                    } else {
                        return {
                            type: ancestor.modelType,
                            value: ancestor.idShort,
                        } as aas.Key;
                    }
                }),
            };
        }

        if (source.category) {
            referable.category = source.category;
        }

        if (source.descriptions) {
            referable.description = this.readLangStringSet(source.descriptions);
        }

        if (source.parent) {
            referable.parent = this.readReference(source.parent);
        }

        return referable;
    }

    private readIdentifiable(source: aasv2.Identifiable): aas.Identifiable {
        if (!source.identification) {
            throw new Error('Identifiable.identification');
        }

        const id = this.readIdentifier(source.identification);
        const identifiable: aas.Identifiable = {
            ...this.readReferable(source, id),
            id: id,
        };

        if (source.administration) {
            identifiable.administration = source.administration;
        }

        return identifiable;
    }

    private readIdentifier(source: aasv2.Identifier): string {
        if (typeof source.id !== 'string') {
            return '';
        }

        return source.id;
    }

    private readReference(source: aasv2.Reference): aas.Reference {
        return {
            type: this.determineReferenceType(source),
            keys: source.keys.map(key => {
                if (key.type == null) {
                    throw new Error(`Reference.type`);
                }

                if (key.value == null) {
                    throw new Error(`Reference.value`);
                }

                return { type: key.type, value: key.value } as aas.Key;
            }),
        };
    }

    private determineReferenceType(reference: aasv2.Reference): aas.ReferenceTypes {
        return reference.keys.length === 0 || reference.keys[0].local ? 'ModelReference' : 'ExternalReference';
    }

    private readHasDataSpecification(source: aasv2.HasDataSpecification): aas.HasDataSpecification {
        const hasDataSpecification: aas.HasDataSpecification = {};
        if (source.embeddedDataSpecifications) {
            hasDataSpecification.embeddedDataSpecifications = source.embeddedDataSpecifications.map(item =>
                this.readEmbeddedDatSpecification(item),
            );
        }

        return hasDataSpecification;
    }

    private readEmbeddedDatSpecification(source: aasv2.EmbeddedDataSpecification): aas.EmbeddedDataSpecification {
        if (!source.dataSpecification) {
            throw new Error('EmbeddedDataSpecification.dataSpecification');
        }

        if (!source.dataSpecificationContent) {
            throw new Error('EmbeddedDataSpecification.dataSpecificationContent');
        }

        let dataSpecificationContent: aas.DataSpecificationContent;
        if ((source.dataSpecificationContent as aasv2.DataSpecificationIec61360Content).preferredName) {
            dataSpecificationContent = this.readDataSpecificationIec61360(
                source.dataSpecificationContent as aasv2.DataSpecificationIec61360Content,
            );
        } else {
            throw new Error('Not implemented.');
        }

        const specification: aas.EmbeddedDataSpecification = {
            dataSpecification: this.readReference(source.dataSpecification),
            dataSpecificationContent,
        };

        return specification;
    }

    private readDataSpecificationIec61360(
        source: aasv2.DataSpecificationIec61360Content,
    ): aas.DataSpecificationIec61360 {
        if (!source.preferredName) {
            throw new Error(`DataSpecificationIEC61360.preferredName`);
        }

        const iec61360: aas.DataSpecificationIec61360 = {
            modelType: 'DataSpecificationIec61360',
            preferredName: this.readLangStringSet(source.preferredName),
        };

        if (source.dataType) {
            iec61360.dataType = this.readDataTypeIEC61360(source.dataType);
        }

        if (source.definition) {
            iec61360.definition = this.readLangStringSet(source.definition);
        }

        if (source.levelType) {
            iec61360.levelType = { ...source.levelType };
        }

        if (source.shortName) {
            iec61360.shortName = this.readLangStringSet(source.shortName);
        }

        if (source.sourceOfDefinition) {
            iec61360.sourceOfDefinition = source.sourceOfDefinition;
        }

        if (source.symbol) {
            iec61360.symbol = source.symbol;
        }

        if (source.unit) {
            iec61360.unit = source.unit;
        }

        if (source.unitId) {
            iec61360.unitId = this.readReference(source.unitId);
        }

        if (source.value) {
            iec61360.value = source.value;
        }

        if (source.valueFormat) {
            iec61360.valueFormat = source.valueFormat;
        }

        if (source.valueList) {
            iec61360.valueList = this.readValueList(source.valueList);
        }

        return iec61360;
    }

    private readValueList(source: aasv2.ValueList): aas.ValueList {
        if (!source.valueReferencePairTypes) {
            throw new Error('ValueList.valueReferencePairTypes');
        }

        return {
            valueReferencePairs: source.valueReferencePairTypes.map(item => this.readValueReferencePairType(item)),
        };
    }

    private readLangStringSet(source: aasv2.LangString[]): aas.LangString[] {
        if (!source) {
            return [];
        } else if (typeof source === 'string') {
            return [{ language: 'en', text: source }];
        } else {
            return source.map(item => ({ language: item.language, text: item.text }));
        }
    }

    private readValueReferencePairType(source: aasv2.ValueReferencePairType): aas.ValueReferencePair {
        if (!source.value) {
            throw new Error('ValueObject.value');
        }

        if (!source.valueId) {
            throw new Error('ValueObject.valueId');
        }

        return { value: source.value, valueId: this.readReference(source.valueId) } as aas.ValueReferencePair;
    }

    private readModelType(source: aasv2.ModelTypes): aas.ModelType {
        return source === 'BasicEvent' ? 'BasicEventElement' : (source as aas.ModelType);
    }

    private readDataTypeDefXsd(source: aasv2.DataTypeDefXsd): aas.DataTypeDefXsd {
        switch (source) {
            case 'anyURI':
                return 'xs:anyURI';
            case 'base64Binary':
                return 'xs:base64Binary';
            case 'boolean':
                return 'xs:boolean';
            case 'byte':
                return 'xs:byte';
            case 'date':
                return 'xs:date';
            case 'dateTime':
                return 'xs:dateTime';
            case 'dateTimeStamp':
                return 'xs:dateTime';
            case 'dayTimeDuration':
                return 'xs:duration';
            case 'decimal':
                return 'xs:decimal';
            case 'double':
                return 'xs:double';
            case 'duration':
                return 'xs:duration';
            case 'float':
                return 'xs:float';
            case 'gDay':
                return 'xs:gDay';
            case 'gMonth':
                return 'xs:gMonth';
            case 'gMonthDay':
                return 'xs:gMonthDay';
            case 'gYear':
                return 'xs:gYear';
            case 'gYearMonth':
                return 'xs:gYearMonth';
            case 'hexBinary':
                return 'xs:hexBinary';
            case 'int':
                return 'xs:int';
            case 'integer':
                return 'xs:integer';
            case 'long':
                return 'xs:long';
            case 'negativeInteger':
                return 'xs:negativeInteger';
            case 'nonNegativeInteger':
                return 'xs:nonNegativeInteger';
            case 'nonPositiveInteger':
                return 'xs:nonPositiveInteger';
            case 'positiveInteger':
                return 'xs:positiveInteger';
            case 'short':
                return 'xs:short';
            case 'string':
                return 'xs:string';
            case 'time':
                return 'xs:time';
            case 'unsignedByte':
                return 'xs:unsignedByte';
            case 'unsignedInt':
                return 'xs:unsignedInt';
            case 'unsignedLong':
                return 'xs:unsignedLong';
            case 'unsignedShort':
                return 'xs:unsignedShort';
            case 'yearMonthDuration':
                return 'xs:duration';
            default:
                return source as aas.DataTypeDefXsd;
        }
    }

    private readDataTypeIEC61360(source: string): aas.DataTypeIec61360 {
        switch (source) {
            case 'DATE':
                return 'DATE';
            case 'STRING':
                return 'STRING';
            case 'STRING_TRANSLATABLE':
                return 'STRING_TRANSLATABLE';
            case 'INTEGER_MEASURE':
                return 'INTEGER_MEASURE';
            case 'INTEGER_COUNT':
                return 'INTEGER_COUNT';
            case 'INTEGER_CURRENCY':
                return 'INTEGER_CURRENCY';
            case 'REAL_MEASURE':
                return 'REAL_MEASURE';
            case 'REAL_COUNT':
                return 'REAL_COUNT';
            case 'REAL_CURRENCY':
                return 'REAL_CURRENCY';
            case 'BOOLEAN':
                return 'BOOLEAN';
            case 'URL':
                return 'IRI';
            case 'RATIONAL':
                return 'RATIONAL';
            case 'RATIONAL_MEASURE':
                return 'RATIONAL_MEASURE';
            case 'TIME':
                return 'TIME';
            case 'TIMESTAMP':
                return 'TIMESTAMP';
            default:
                return source as aas.DataTypeIec61360;
        }
    }

    private isSubmodelElement(value: unknown): value is aasv2.SubmodelElement {
        if (value && (value as aasv2.Referable)?.modelType?.name) {
            switch ((value as aasv2.Referable).modelType.name) {
                case 'ReferenceElement':
                case 'Property':
                case 'MultiLanguageProperty':
                case 'Range':
                case 'Blob':
                case 'File':
                case 'RelationshipElement':
                case 'Capability':
                case 'SubmodelElementCollection':
                case 'Operation':
                case 'Entity':
                case 'AnnotatedRelationshipElement':
                    return true;
                default:
                    return false;
            }
        }

        return false;
    }
}
