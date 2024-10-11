/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { AASReader } from './aas-reader.js';
import { aas, determineType, extensionToMimeType, isIdentifiable } from 'aas-core';
import cloneDeep from 'lodash-es/cloneDeep.js';
import { encodeBase64Url } from '../convert.js';

export class JsonReaderV3 extends AASReader {
    private readonly origin: aas.Environment;

    public constructor(origin?: aas.Environment | string) {
        super();

        if (origin) {
            if (typeof origin === 'string') {
                this.origin = JSON.parse(origin);
            } else {
                this.origin = origin;
            }
        } else {
            this.origin = { assetAdministrationShells: [], conceptDescriptions: [], submodels: [] };
        }
    }

    public readEnvironment(): aas.Environment {
        const conceptDescriptions = this.readConceptDescriptions();
        const assetAdministrationShells = this.readAssetAdministrationShells();
        const submodels = this.readSubmodels();
        return { assetAdministrationShells, submodels, conceptDescriptions };
    }

    /**
     * Deserializes a Submodel or SubmodelElement from the specified source.
     * @param data The serialized Submodel or SubmodelElement.
     * @returns The deserialized Submodel or SubmodelElement.
     */
    public read(data: string | object): aas.Referable {
        const source: aas.Referable = typeof data === 'string' ? JSON.parse(data) : data;
        switch (source.modelType) {
            case 'AssetAdministrationShell':
                throw new Error('Invalid operation.');
            case 'Submodel':
                return this.readSubmodel(source as aas.Submodel);
            default: {
                return this.readSubmodelElement(source as aas.SubmodelElement, []);
            }
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

    private readAssetAdministrationShell(source: aas.AssetAdministrationShell): aas.AssetAdministrationShell {
        if (!source.assetInformation) {
            throw new Error('AssetAdministrationShell.asset');
        }

        const shell: aas.AssetAdministrationShell = {
            ...this.readIdentifiable(source),
            ...this.readHasDataSpecification(source),
            assetInformation: this.readAssetInformation(source.assetInformation),
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

    private readAssetInformation(source: aas.AssetInformation): aas.AssetInformation {
        if (!source.assetKind) {
            throw new Error('AssetInformation.assetKind');
        }

        const asset: aas.AssetInformation = { assetKind: source.assetKind };
        if (source.globalAssetId) {
            asset.globalAssetId = source.globalAssetId;
        }

        if (source.specificAssetIds) {
            asset.specificAssetIds = source.specificAssetIds.map(item => this.readSpecificAssetId(item));
        }

        return asset;
    }

    private readSpecificAssetId(source: aas.SpecificAssetId): aas.SpecificAssetId {
        if (!source.name) {
            throw new Error('SpecificAssetId.name');
        }

        if (!source.value) {
            throw new Error('SpecificAssetId.value');
        }

        if (!source.externalSubjectId) {
            throw new Error('SpecificAssetId.externalSubjectId');
        }

        return {
            ...this.readHasSemantics,
            name: source.name,
            value: source.value,
            externalSubjectId: this.readReference(source.externalSubjectId),
        };
    }

    private readAdministrationInformation(source: aas.AdministrativeInformation): aas.AdministrativeInformation {
        const info: aas.AdministrativeInformation = {};
        if (source.revision) {
            info.revision = source.revision;
        }

        if (source.version) {
            info.version = source.version;
        }

        return info;
    }

    private readConceptDescription(source: aas.ConceptDescription): aas.ConceptDescription {
        const conceptDescription: aas.ConceptDescription = {
            ...this.readIdentifiable(source, 'ConceptDescription'),
            ...this.readHasDataSpecification(source),
        };

        if (source.isCaseOf) {
            conceptDescription.isCaseOf = source.isCaseOf.map(item => this.readReference(item));
        }

        return conceptDescription;
    }

    private readSubmodels(): aas.Submodel[] {
        const submodels: aas.Submodel[] = [];
        if (this.origin && this.origin.submodels) {
            for (const item of this.origin.submodels) {
                submodels.push(this.readSubmodel(item));
            }
        }

        return submodels;
    }

    private readSubmodel(source: aas.Submodel): aas.Submodel {
        const submodel: aas.Submodel = {
            ...this.readIdentifiable(source),
            ...this.readHasSemantics(source),
            ...this.readQualifiable(source),
            ...this.readHasKind(source),
            ...this.readHasDataSpecification(source),
        };

        if (source.submodelElements) {
            submodel.submodelElements = this.readSubmodelElements(source.submodelElements, [submodel]);
        }

        return submodel;
    }

    private readSubmodelElements(sources: aas.SubmodelElement[], ancestors: aas.Referable[]): aas.SubmodelElement[] {
        const submodelElements: aas.SubmodelElement[] = [];
        for (const source of sources) {
            submodelElements.push(this.readSubmodelElement(source, ancestors));
        }

        return submodelElements;
    }

    private readSubmodelElement(source: aas.SubmodelElement, ancestors: aas.Referable[]): aas.SubmodelElement {
        switch (source.modelType) {
            case 'AnnotatedRelationshipElement':
                return this.readAnnotatedRelationshipElement(source as aas.AnnotatedRelationshipElement, ancestors);
            case 'BasicEventElement':
                return this.readBasicEventElement(source as aas.BasicEventElement, ancestors);
            case 'Blob':
                return this.readBlob(source as aas.Blob, ancestors);
            case 'Entity':
                return this.readEntity(source as aas.Entity, ancestors);
            case 'File':
                return this.readFile(source as aas.File, ancestors);
            case 'MultiLanguageProperty':
                return this.readMultiLanguageProperty(source as aas.MultiLanguageProperty, ancestors);
            case 'Operation':
                return this.readOperation(source as aas.Operation, ancestors);
            case 'Property':
                return this.readProperty(source as aas.Property, ancestors);
            case 'Range':
                return this.readRange(source as aas.Range, ancestors);
            case 'ReferenceElement':
                return this.readReferenceElement(source as aas.ReferenceElement, ancestors);
            case 'RelationshipElement':
                return this.readRelationshipElement(source as aas.RelationshipElement, ancestors);
            case 'SubmodelElementCollection':
                return this.readSubmodelElementCollection(source as aas.SubmodelElementCollection, ancestors);
            case 'SubmodelElementList':
                return this.readSubmodelElementList(source as aas.SubmodelElementList, ancestors);
            default:
                return this.readSubmodelElementType(source, ancestors);
        }
    }

    private readSubmodelElementType(source: aas.SubmodelElement, ancestors: aas.Referable[]): aas.SubmodelElement {
        return {
            ...this.readReferable(source, ancestors),
            ...this.readHasSemantics(source),
            ...this.readHasDataSpecification(source),
            ...this.readQualifiable(source),
        };
    }

    private readAnnotatedRelationshipElement(
        source: aas.AnnotatedRelationshipElement,
        ancestors: aas.Referable[],
    ): aas.AnnotatedRelationshipElement {
        const relationship: aas.AnnotatedRelationshipElement = {
            ...this.readRelationshipElement(source, ancestors),
        };

        if (source.annotations) {
            relationship.annotations = this.readSubmodelElements(source.annotations, [...ancestors, relationship]);
        }

        return relationship;
    }

    private readEventElement(source: aas.EventElement, ancestor: aas.Referable[]): aas.EventElement {
        return { ...this.readSubmodelElementType(source, ancestor) };
    }

    private readBasicEventElement(source: aas.BasicEventElement, ancestors: aas.Referable[]): aas.BasicEventElement {
        if (!source.observed) {
            throw new Error('BasicEventElement.observed');
        }

        if (!source.direction) {
            throw new Error('BasicEventElement.direction');
        }

        if (!source.state) {
            throw new Error('BasicEventElement.state');
        }

        const eventElement: aas.BasicEventElement = {
            ...this.readEventElement(source, ancestors),
            observed: source.observed,
            direction: source.direction,
            state: source.state,
        };

        if (source.messageTopic) {
            eventElement.messageTopic = source.messageTopic;
        }

        if (source.messageBroker) {
            eventElement.messageBroker = this.readReference(source.messageBroker);
        }

        if (source.lastUpdate) {
            eventElement.lastUpdate = source.lastUpdate;
        }

        if (source.minInterval) {
            eventElement.minInterval = source.minInterval;
        }

        if (source.maxInterval) {
            eventElement.maxInterval = source.maxInterval;
        }

        return eventElement;
    }

    private readProperty(source: aas.Property, ancestors: aas.Referable[]): aas.Property {
        let valueType: aas.DataTypeDefXsd | undefined = source.valueType;
        if (!valueType && source.value) {
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
        source: aas.MultiLanguageProperty,
        ancestors: aas.Referable[],
    ): aas.MultiLanguageProperty {
        let value: aas.LangString[] | undefined;
        if (Array.isArray(source.value)) {
            value = source.value.map(item => ({ language: item.language, text: item.text }));
        }

        if (!value) {
            value = [];
        }

        return { ...this.readSubmodelElementType(source, ancestors), value };
    }

    private readOperation(source: aas.Operation, ancestors: aas.Referable[]): aas.Operation {
        const operation: aas.Operation = {
            ...this.readSubmodelElementType(source, ancestors),
        };

        if (source.inputVariables) {
            operation.inputVariables = source.inputVariables.map(item =>
                this.readOperationVariable(item, [...ancestors, operation]),
            );
        }

        if (source.inoutputVariables) {
            operation.inoutputVariables = source.inoutputVariables.map(item =>
                this.readOperationVariable(item, [...ancestors, operation]),
            );
        }

        if (source.outputVariables) {
            operation.outputVariables = source.outputVariables.map(item =>
                this.readOperationVariable(item, [...ancestors, operation]),
            );
        }

        return operation;
    }

    private readOperationVariable(source: aas.OperationVariable, ancestors: aas.Referable[]): aas.OperationVariable {
        return { value: this.readSubmodelElement(source.value, ancestors) };
    }

    private readFile(source: aas.File, ancestors: aas.Referable[]): aas.File {
        const value = source.value?.trim();
        let contentType: string | undefined = source.contentType?.trim();
        if (!contentType && value) {
            const i = value.lastIndexOf('.');
            if (i >= 0) {
                contentType = extensionToMimeType(value.substring(i));
            }
        }

        if (contentType == null) {
            contentType = '';
        }

        const file: aas.File = {
            ...this.readSubmodelElementType(source, ancestors),
            contentType,
        };

        if (value) {
            file.value = value;
        }

        return file;
    }

    private readBlob(source: aas.Blob, ancestors: aas.Referable[]): aas.Blob {
        const blob: aas.Blob = {
            ...this.readSubmodelElementType(source, ancestors),
            contentType: source.contentType ?? '',
        };

        if (source.value) {
            blob.value = source.value;
        }

        return blob;
    }

    private readEntity(source: aas.Entity, ancestors: aas.Referable[]): aas.Entity {
        if (!source.entityType) {
            throw new Error('Entity.entityType');
        }

        const entity: aas.Entity = {
            ...this.readSubmodelElementType(source, ancestors),
            entityType: source.entityType,
        };

        if (source.statements) {
            entity.statements = source.statements.map(item => this.readSubmodelElement(item, [...ancestors, entity]));
        }

        if (source.globalAssetId) {
            entity.globalAssetId = source.globalAssetId;
        }

        if (source.specificAssetIds) {
            entity.specificAssetIds = source.specificAssetIds.map(item => this.readSpecificAssetId(item));
        }

        return entity;
    }

    private readSubmodelElementCollection(
        source: aas.SubmodelElementCollection,
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

    private readSubmodelElementList(
        source: aas.SubmodelElementList,
        ancestors: aas.Referable[],
    ): aas.SubmodelElementCollection {
        if (!source.typeValueListElement) {
            throw new Error('SubmodelElement.typeValueListElement');
        }

        const list: aas.SubmodelElementList = {
            ...this.readSubmodelElementType(source, ancestors),
            typeValueListElement: source.typeValueListElement,
            valueTypeListElement: source.valueTypeListElement,
        };

        if (source.orderRelevant) {
            list.orderRelevant = source.orderRelevant;
        }

        if (source.semanticIdListElement) {
            list.semanticIdListElement = this.readReference(source.semanticIdListElement);
        }

        if (source.value) {
            list.value = this.readSubmodelElements(source.value, [...ancestors, list]);
        }

        return list;
    }

    private readReferenceElement(source: aas.ReferenceElement, ancestors: aas.Referable[]): aas.ReferenceElement {
        const reference: aas.ReferenceElement = {
            ...this.readSubmodelElementType(source, ancestors),
        };

        if (source.value) {
            reference.value = this.readReference(source.value);
        }

        return reference;
    }

    private readRelationshipElement(
        source: aas.RelationshipElement,
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

    private readRange(source: aas.Range, ancestors: aas.Referable[]): aas.Range {
        if (!source.valueType) {
            throw new Error('Range.valueType');
        }

        const range: aas.Range = {
            ...this.readSubmodelElementType(source, ancestors),
            valueType: source.valueType,
        };

        if (source.min) {
            range.min = source.min;
        }

        if (source.max) {
            range.max = source.max;
        }

        return range;
    }

    private readHasSemantics(source: aas.HasSemantics): aas.HasSemantics {
        const hasSemantics: aas.HasSemantics = {};
        if (source.semanticId && source.semanticId.keys.length > 0) {
            hasSemantics.semanticId = this.readReference(source.semanticId);
        }

        return hasSemantics;
    }

    private readHasKind(source: aas.HasKind): aas.HasKind {
        return { kind: source.kind ?? 'Instance' };
    }

    private readQualifiable(source: aas.Qualifiable): aas.Qualifiable {
        const qualifiable: aas.Qualifiable = {};
        if (source.qualifiers) {
            qualifiable.qualifiers = source.qualifiers.map(item => this.readQualifier(item));
        }

        return qualifiable;
    }

    private readQualifier(source: aas.Qualifier): aas.Qualifier {
        if (!source.type) {
            throw new Error('Qualifier.type');
        }

        if (!source.valueType) {
            throw new Error('Qualifier.valueType');
        }

        const qualifier: aas.Qualifier = {
            ...this.readHasSemantics(source),
            type: source.type,
            valueType: source.valueType,
        };

        if (source.kind) {
            qualifier.kind = source.kind;
        }

        if (source.value) {
            qualifier.value = source.value;
        }

        if (source.valueId) {
            qualifier.valueId = this.readReference(source.valueId);
        }

        return qualifier;
    }

    private readReferable(
        source: aas.Referable,
        ancestors?: aas.Referable[],
        id?: string,
        modelType?: aas.ModelType,
    ): aas.Referable {
        let idShort = source.idShort;
        if (idShort == null) {
            if (!id) {
                throw Error(`Referable.idShort`);
            }

            idShort = this.createIdShort(id);
        }

        if (!source.modelType && !modelType) {
            throw Error(`Referable.modelType`);
        }

        const referable: aas.Referable = { idShort, modelType: source.modelType ?? modelType };

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

        if (source.description) {
            referable.description = cloneDeep(source.description);
        }

        if (source.parent) {
            referable.parent = this.readReference(source.parent);
        }

        return referable;
    }

    private readIdentifiable(source: aas.Identifiable, modelType?: aas.ModelType): aas.Identifiable {
        if (!source.id) {
            throw new Error('Identifiable.id');
        }

        const identifiable: aas.Identifiable = {
            ...this.readReferable(source, undefined, source.id, modelType),
            id: source.id,
        };

        if (source.administration) {
            identifiable.administration = source.administration;
        }

        return identifiable;
    }

    private readReference(source: aas.Reference): aas.Reference {
        return {
            type: source.type,
            keys: source.keys.map(key => {
                if (!key.type) {
                    throw new Error(`Reference.type`);
                }

                return {
                    type: key.type,
                    value: key.value != null ? key.value : '',
                } as aas.Key;
            }),
        };
    }

    private readHasDataSpecification(source: aas.HasDataSpecification): aas.HasDataSpecification {
        const hasDataSpecification: aas.HasDataSpecification = {};
        if (source.embeddedDataSpecifications) {
            hasDataSpecification.embeddedDataSpecifications = source.embeddedDataSpecifications.map(item =>
                this.readEmbeddedDatSpecification(item),
            );
        }

        return hasDataSpecification;
    }

    private readEmbeddedDatSpecification(source: aas.EmbeddedDataSpecification): aas.EmbeddedDataSpecification {
        const dataSpecification = source.dataSpecification
            ? this.readReference(source.dataSpecification)
            : ({ type: 'ModelReference', keys: [] } as aas.Reference);

        if (!source.dataSpecificationContent) {
            throw new Error('EmbeddedDataSpecification.dataSpecificationContent');
        }

        let dataSpecificationContent: aas.DataSpecificationContent;
        if (
            !source.dataSpecificationContent.modelType ||
            source.dataSpecificationContent.modelType === 'DataSpecificationIec61360'
        ) {
            dataSpecificationContent = this.readDataSpecificationIEC61360(
                source.dataSpecificationContent as aas.DataSpecificationIec61360,
            );
        } else {
            throw new Error(
                `${source.dataSpecificationContent.modelType} is a not supported DataSpecificationContent.`,
            );
        }

        const specification: aas.EmbeddedDataSpecification = {
            dataSpecification,
            dataSpecificationContent,
        };

        return specification;
    }

    private readDataSpecificationIEC61360(source: aas.DataSpecificationIec61360): aas.DataSpecificationIec61360 {
        const iec61360: aas.DataSpecificationIec61360 = {
            modelType: source.modelType,
            preferredName: source.preferredName ? source.preferredName.map(item => this.readLangString(item)) : [],
        };

        if (source.dataType) {
            iec61360.dataType = source.dataType;
        }

        if (source.definition) {
            iec61360.definition = source.definition.map(item => this.readLangString(item));
        }

        if (source.levelType) {
            iec61360.levelType = source.levelType;
        }

        if (source.shortName) {
            iec61360.shortName = source.shortName;
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

    private readValueList(source: aas.ValueList): aas.ValueList {
        if (!source.valueReferencePairs) {
            throw new Error('ValueList.valueReferencePairs');
        }

        const valueList: aas.ValueList = {
            valueReferencePairs: source.valueReferencePairs.map(item => this.readValueReferencePair(item)),
        };

        return valueList;
    }

    private readValueReferencePair(source: aas.ValueReferencePair): aas.ValueReferencePair {
        if (!source.value) {
            throw new Error('ValueReferencePair.value');
        }

        if (!source.valueId) {
            throw new Error('ValueReferencePair.valueId');
        }

        return { value: source.value, valueId: this.readReference(source.valueId) };
    }

    private readLangString(source: aas.LangString): aas.LangString {
        return { language: source.language, text: source.text } as aas.LangString;
    }
}
