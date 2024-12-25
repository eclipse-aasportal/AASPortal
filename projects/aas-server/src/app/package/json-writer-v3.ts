/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import path from 'path/posix';
import { aas, extensionToMimeType } from 'aas-core';
import { AASWriter } from './aas-writer.js';

/** */
export class JsonWriterV3 extends AASWriter {
    public override write(env: aas.Environment): string {
        const data: aas.Environment = {
            assetAdministrationShells: this.writeAssetAdministrationShells(env),
            submodels: this.writeSubmodels(env),
            conceptDescriptions: this.writeConceptDescriptions(env),
        };

        return JSON.stringify(data);
    }

    /**
     * Deserializes a Submodel or SubmodelElement from the specified source.
     * @param data The serialized Submodel or SubmodelElement.
     * @returns The deserialized Submodel or SubmodelElement.
     */
    public convert(source: aas.Referable): aas.Referable {
        switch (source.modelType) {
            case 'AssetAdministrationShell':
                throw new Error('Invalid operation.');
            case 'Submodel':
                return this.writeSubmodel(source as aas.Submodel);
            default:
                return this.writeSubmodelElement(source as aas.SubmodelElement);
        }
    }

    private writeConceptDescriptions(env: aas.Environment): aas.ConceptDescription[] {
        const conceptDescriptions: aas.ConceptDescription[] = [];
        if (env.conceptDescriptions) {
            for (const source of env.conceptDescriptions) {
                conceptDescriptions.push(this.writeConceptDescription(source));
            }
        }

        return conceptDescriptions;
    }

    private writeAssetAdministrationShells(env: aas.Environment): aas.AssetAdministrationShell[] {
        const shells: aas.AssetAdministrationShell[] = [];
        if (env.assetAdministrationShells) {
            for (const source of env.assetAdministrationShells) {
                shells.push(this.writeAssetAdministrationShell(source));
            }
        }

        return shells;
    }

    private writeAssetAdministrationShell(source: aas.AssetAdministrationShell): aas.AssetAdministrationShell {
        if (!source.assetInformation) {
            throw new Error('AssetAdministrationShell.asset');
        }

        const shell: aas.AssetAdministrationShell = {
            ...this.writeIdentifiable(source),
            ...this.writeHasDataSpecification(source),
            assetInformation: this.writeAssetInformation(source.assetInformation),
        };

        if (source.derivedFrom) {
            shell.derivedFrom = this.writeReference(source.derivedFrom);
        }

        if (source.administration) {
            shell.administration = this.writeAdministrationInformation(source.administration);
        }

        if (source.submodels) {
            shell.submodels = source.submodels.map(item => this.writeReference(item));
        }

        return shell;
    }

    private writeAssetInformation(source: aas.AssetInformation): aas.AssetInformation {
        if (!source.assetKind) {
            throw new Error('AssetInformation.assetKind');
        }

        const asset: aas.AssetInformation = { assetKind: source.assetKind };
        if (source.globalAssetId) {
            asset.globalAssetId = source.globalAssetId;
        }

        if (source.specificAssetIds) {
            asset.specificAssetIds = source.specificAssetIds.map(item => this.writeSpecificAssetId(item));
        }

        return asset;
    }

    private writeSpecificAssetId(source: aas.SpecificAssetId): aas.SpecificAssetId {
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
            ...this.writeHasSemantic,
            name: source.name,
            value: source.value,
            externalSubjectId: this.writeReference(source.externalSubjectId),
        };
    }

    private writeAdministrationInformation(source: aas.AdministrativeInformation): aas.AdministrativeInformation {
        const info: aas.AdministrativeInformation = {};
        if (source.revision) {
            info.revision = source.revision;
        }

        if (source.version) {
            info.version = source.version;
        }

        return info;
    }

    private writeConceptDescription(source: aas.ConceptDescription): aas.ConceptDescription {
        const conceptDescription: aas.ConceptDescription = {
            ...this.writeIdentifiable(source),
            ...this.writeHasDataSpecification(source),
        };

        if (source.isCaseOf) {
            conceptDescription.isCaseOf = source.isCaseOf.map(item => this.writeReference(item));
        }

        return conceptDescription;
    }

    private writeSubmodels(env: aas.Environment): aas.Submodel[] {
        const submodels: aas.Submodel[] = [];
        if (env.submodels) {
            for (const item of env.submodels) {
                submodels.push(this.writeSubmodel(item));
            }
        }

        return submodels;
    }

    private writeSubmodel(source: aas.Submodel): aas.Submodel {
        const submodel: aas.Submodel = {
            ...this.writeIdentifiable(source),
            ...this.writeHasSemantic(source),
            ...this.writeQualifiable(source),
            ...this.writeHasKind(source),
            ...this.writeHasDataSpecification(source),
        };

        if (source.submodelElements) {
            submodel.submodelElements = this.writeSubmodelElements(source.submodelElements);
        }

        return submodel;
    }

    private writeSubmodelElements(sources: aas.SubmodelElement[]): aas.SubmodelElement[] {
        const submodelElements: aas.SubmodelElement[] = [];
        for (const source of sources) {
            submodelElements.push(this.writeSubmodelElement(source));
        }

        return submodelElements;
    }

    private writeSubmodelElement(source: aas.SubmodelElement): aas.SubmodelElement {
        switch (source.modelType) {
            case 'AnnotatedRelationshipElement':
                return this.writeAnnotatedRelationshipElement(source as aas.AnnotatedRelationshipElement);
            case 'BasicEventElement':
                return this.writeBasicEventElement(source as aas.BasicEventElement);
            case 'Blob':
                return this.writeBlob(source as aas.Blob);
            case 'Entity':
                return this.writeEntity(source as aas.Entity);
            case 'File':
                return this.writeFile(source as aas.File);
            case 'MultiLanguageProperty':
                return this.writeMultiLanguageProperty(source as aas.MultiLanguageProperty);
            case 'Operation':
                return this.writeOperation(source as aas.Operation);
            case 'Property':
                return this.writeProperty(source as aas.Property);
            case 'Range':
                return this.writeRange(source as aas.Range);
            case 'ReferenceElement':
                return this.writeReferenceElement(source as aas.ReferenceElement);
            case 'RelationshipElement':
                return this.writeRelationshipElement(source as aas.RelationshipElement);
            case 'SubmodelElementCollection':
                return this.writeSubmodelElementCollection(source as aas.SubmodelElementCollection);
            case 'SubmodelElementList':
                throw this.writeSubmodelElementList(source as aas.SubmodelElementList);
            default:
                throw new Error('Not implemented.');
        }
    }

    private writeSubmodelElementType(source: aas.SubmodelElement): aas.SubmodelElement {
        return {
            ...this.writeReferable(source),
            ...this.writeHasSemantic(source),
            ...this.writeHasDataSpecification(source),
            ...this.writeQualifiable(source),
        };
    }

    private writeAnnotatedRelationshipElement(
        source: aas.AnnotatedRelationshipElement,
    ): aas.AnnotatedRelationshipElement {
        const relationship: aas.AnnotatedRelationshipElement = {
            ...this.writeRelationshipElement(source),
        };

        if (source.annotations) {
            relationship.annotations = this.writeSubmodelElements(source.annotations);
        }

        return relationship;
    }

    private writeEventElement(source: aas.EventElement): aas.EventElement {
        return { ...this.writeSubmodelElementType(source) };
    }

    private writeBasicEventElement(source: aas.BasicEventElement): aas.BasicEventElement {
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
            ...this.writeEventElement(source),
            observed: source.observed,
            direction: source.direction,
            state: source.state,
        };

        if (source.messageTopic) {
            eventElement.messageTopic = source.messageTopic;
        }

        if (source.messageBroker) {
            eventElement.messageBroker = this.writeReference(source.messageBroker);
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

    private writeProperty(source: aas.Property): aas.Property {
        if (!source.valueType) {
            throw new Error('Property.valueType');
        }

        const property: aas.Property = {
            ...this.writeSubmodelElementType(source),
            valueType: source.valueType,
        };

        if (source.value) {
            property.value = source.value;
        }

        return property;
    }

    private writeMultiLanguageProperty(source: aas.MultiLanguageProperty): aas.MultiLanguageProperty {
        let value: aas.LangString[] | undefined;
        if (Array.isArray(source.value)) {
            value = source.value.map(item => ({ language: item.language, text: item.text }));
        }

        if (!value) {
            value = [];
        }

        return { ...this.writeSubmodelElementType(source), value };
    }

    private writeOperation(source: aas.Operation): aas.Operation {
        const operation: aas.Operation = {
            ...this.writeSubmodelElementType(source),
        };

        if (source.inputVariables) {
            operation.inputVariables = source.inputVariables.map(item => this.writeOperationVariable(item));
        }

        if (source.inoutputVariables) {
            operation.inoutputVariables = source.inoutputVariables.map(item => this.writeOperationVariable(item));
        }

        if (source.outputVariables) {
            operation.outputVariables = source.outputVariables.map(item => this.writeOperationVariable(item));
        }

        return operation;
    }

    private writeOperationVariable(source: aas.OperationVariable): aas.OperationVariable {
        if (!source.value) {
            throw new Error('OperationVariable.value');
        }

        return { value: this.writeSubmodelElementType(source.value) };
    }

    private writeFile(source: aas.File): aas.File {
        let contentType: string | undefined = source.contentType;
        if (source.value && !contentType) {
            contentType = extensionToMimeType(path.extname(source.value.trim()));
            if (!contentType) {
                throw new Error('File.contentType');
            }
        }

        const file: aas.File = {
            ...this.writeSubmodelElementType(source),
            contentType,
        };

        if (source.value) {
            file.value = source.value;
        }

        return file;
    }

    private writeBlob(source: aas.Blob): aas.Blob {
        if (source.value && !source.contentType) {
            throw new Error('Blob.contentType');
        }

        const blob: aas.Blob = {
            ...this.writeSubmodelElementType(source),
            contentType: source.contentType,
        };

        if (source.value) {
            blob.value = source.value;
        }

        return blob;
    }

    private writeEntity(source: aas.Entity): aas.Entity {
        if (!source.entityType) {
            throw new Error('Entity.entityType');
        }

        const entity: aas.Entity = {
            ...this.writeSubmodelElementType(source),
            entityType: source.entityType,
        };

        if (source.statements) {
            entity.statements = source.statements.map(item => this.writeSubmodelElement(item)!);
        }

        if (source.globalAssetId) {
            entity.globalAssetId = source.globalAssetId;
        }

        if (source.specificAssetIds) {
            entity.specificAssetIds = source.specificAssetIds.map(item => this.writeSpecificAssetId(item));
        }

        return entity;
    }

    private writeSubmodelElementCollection(source: aas.SubmodelElementCollection): aas.SubmodelElementCollection {
        const collection: aas.SubmodelElementCollection = {
            ...this.writeSubmodelElementType(source),
        };

        if (source.value) {
            collection.value = this.writeSubmodelElements(source.value);
        }

        return collection;
    }

    private writeSubmodelElementList(source: aas.SubmodelElementList): aas.SubmodelElementCollection {
        if (!source.typeValueListElement) {
            throw new Error('SubmodelElement.typeValueListElement');
        }

        const list: aas.SubmodelElementList = {
            ...this.writeSubmodelElementType(source),
            typeValueListElement: source.typeValueListElement,
            valueTypeListElement: source.valueTypeListElement,
        };

        if (source.orderRelevant) {
            list.orderRelevant = source.orderRelevant;
        }

        if (source.semanticIdListElement) {
            list.semanticIdListElement = this.writeReference(source.semanticIdListElement);
        }

        if (source.value) {
            list.value = this.writeSubmodelElements(source.value);
        }

        return list;
    }

    private writeReferenceElement(source: aas.ReferenceElement): aas.ReferenceElement {
        if (!source.value) {
            throw new Error('ReferenceElement.value');
        }

        const reference: aas.ReferenceElement = {
            ...this.writeSubmodelElementType(source),
            value: this.writeReference(source.value),
        };

        return reference;
    }

    private writeRelationshipElement(source: aas.RelationshipElement): aas.RelationshipElement {
        if (!source.first) {
            throw new Error('RelationshipElement.first');
        }

        if (!source.second) {
            throw new Error('RelationshipElement.second');
        }

        const relationship: aas.RelationshipElement = {
            ...this.writeSubmodelElementType(source),
            first: this.writeReference(source.first),
            second: this.writeReference(source.second),
        };

        return relationship;
    }

    private writeRange(source: aas.Range): aas.Range {
        if (!source.valueType) {
            throw new Error('Range.valueType');
        }

        const range: aas.Range = {
            ...this.writeSubmodelElementType(source),
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

    private writeHasSemantic(source: aas.HasSemantics): aas.HasSemantics {
        const hasSemantic: aas.HasSemantics = {};
        if (source.semanticId) {
            hasSemantic.semanticId = this.writeReference(source.semanticId);
        }

        return hasSemantic;
    }

    private writeHasKind(source: aas.HasKind): aas.HasKind {
        return { kind: source.kind ?? 'Instance' };
    }

    private writeQualifiable(source: aas.Qualifiable): aas.Qualifiable {
        const qualifiable: aas.Qualifiable = {};
        if (source.qualifiers) {
            qualifiable.qualifiers = source.qualifiers.map(item => this.writeQualifier(item));
        }

        return qualifiable;
    }

    private writeQualifier(source: aas.Qualifier): aas.Qualifier {
        if (!source.type) {
            throw new Error('Qualifier.type');
        }

        if (!source.valueType) {
            throw new Error('Qualifier.valueType');
        }

        const qualifier: aas.Qualifier = {
            ...this.writeHasSemantic(source),
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
            qualifier.valueId = this.writeReference(source.valueId);
        }

        return qualifier;
    }

    private writeReferable(source: aas.Referable): aas.Referable {
        if (!source.modelType) {
            throw Error(`Referable.modelType.`);
        }

        const referable: aas.Referable = { idShort: source.idShort, modelType: source.modelType };

        if (source.category) {
            referable.category = source.category;
        }

        if (source.description) {
            referable.description = source.description.map(item => ({ text: item.text, language: item.language }));
        }

        return referable;
    }

    private writeIdentifiable(source: aas.Identifiable): aas.Identifiable {
        if (!source.id) {
            throw new Error('Identifiable.identification');
        }

        const identifiable: aas.Identifiable = {
            ...this.writeReferable(source),
            id: source.id,
        };

        if (source.administration) {
            identifiable.administration = source.administration;
        }

        return identifiable;
    }

    private writeReference(source: aas.Reference): aas.Reference {
        return {
            type: source.type,
            keys: source.keys.map(key => {
                if (!key.type) {
                    throw new Error(`Reference.type`);
                }

                if (!key.value) {
                    throw new Error(`Reference.value`);
                }

                return {
                    type: key.type,
                    value: key.value,
                } as aas.Key;
            }),
        };
    }

    private writeHasDataSpecification(source: aas.HasDataSpecification): aas.HasDataSpecification {
        const hasDataSpecification: aas.HasDataSpecification = {};
        if (source.embeddedDataSpecifications) {
            hasDataSpecification.embeddedDataSpecifications = source.embeddedDataSpecifications.map(item =>
                this.writeEmbeddedDatSpecification(item),
            );
        }

        return hasDataSpecification;
    }

    private writeEmbeddedDatSpecification(source: aas.EmbeddedDataSpecification): aas.EmbeddedDataSpecification {
        if (!source.dataSpecification) {
            throw new Error('EmbeddedDataSpecification.dataSpecification');
        }

        if (!source.dataSpecificationContent) {
            throw new Error('EmbeddedDataSpecification.dataSpecificationContent');
        }

        let dataSpecificationContent: aas.DataSpecificationContent;
        if (source.dataSpecificationContent.modelType === 'DataSpecificationIEC61360') {
            dataSpecificationContent = this.writeDataSpecificationIEC61360(
                source.dataSpecificationContent as aas.DataSpecificationIec61360,
            );
        } else {
            throw new Error(
                `${source.dataSpecificationContent.modelType} is a not supported DataSpecificationContent.`,
            );
        }

        const specification: aas.EmbeddedDataSpecification = {
            dataSpecification: this.writeReference(source.dataSpecification),
            dataSpecificationContent,
        };

        return specification;
    }

    private writeDataSpecificationIEC61360(source: aas.DataSpecificationIec61360): aas.DataSpecificationIec61360 {
        if (!source.preferredName) {
            throw new Error(`DataSpecificationIec61360.preferredName`);
        }

        const iec61360: aas.DataSpecificationIec61360 = {
            modelType: source.modelType,
            preferredName: source.preferredName,
        };

        if (source.dataType) {
            iec61360.dataType = source.dataType;
        }

        if (source.definition) {
            iec61360.definition = source.definition;
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
            iec61360.unitId = this.writeReference(source.unitId);
        }

        if (source.value) {
            iec61360.value = source.value;
        }

        if (source.valueFormat) {
            iec61360.valueFormat = source.valueFormat;
        }

        if (source.valueList) {
            iec61360.valueList = this.writeValueList(source.valueList);
        }

        return iec61360;
    }

    private writeValueList(source: aas.ValueList): aas.ValueList {
        if (!source.valueReferencePairs) {
            throw new Error('ValueList.valueReferencePairs');
        }

        const valueList: aas.ValueList = {
            valueReferencePairs: source.valueReferencePairs.map(item => this.writeValueReferencePair(item)),
        };

        return valueList;
    }

    private writeValueReferencePair(source: aas.ValueReferencePair): aas.ValueReferencePair {
        if (!source.value) {
            throw new Error('ValueReferencePair.value');
        }

        if (!source.valueId) {
            throw new Error('ValueReferencePair.valueId');
        }

        return { value: source.value, valueId: this.writeReference(source.valueId) };
    }
}
