/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { AASWriter } from './aas-writer.js';
import { aas, isSubmodelElement } from 'aas-core';
import * as aasv2 from '../types/aas-v2.js';

export class JsonWriterV2 extends AASWriter {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public override write(env: aas.Environment): string {
        throw new Error('Method not implemented.');
    }

    public convert<T extends aasv2.Referable>(source: aas.Referable): T {
        if (source.modelType === 'Submodel') {
            return this.writeSubmodel(source as aas.Submodel) as unknown as T;
        }

        return this.writeSubmodelElement(source as aas.SubmodelElement) as T;
    }

    private writeSubmodel(source: aas.Submodel): aasv2.Submodel {
        const submodel: aasv2.Submodel = {
            ...this.writeIdentifiable(source),
            ...this.writeHasDataSpecification(source),
            ...this.writeHasSemantic(source),
            ...this.writeQualifiable(source),
            ...this.writeHasKind(source),
        };

        if (source.submodelElements) {
            submodel.submodelElements = source.submodelElements.map(item => this.writeSubmodelElement(item));
        }

        return submodel;
    }

    private writeSubmodelElement(source: aas.SubmodelElement): aasv2.SubmodelElement {
        switch (source.modelType) {
            case 'AnnotatedRelationshipElement':
                return this.writeAnnotatedRelationshipElement(source as aas.AnnotatedRelationshipElement);
            case 'BasicEventElement':
                return this.writeBasicEvent(source as aas.BasicEventElement);
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
            default:
                throw new Error(`Unable to write model type "${source.modelType}".`);
        }
    }

    private writeAnnotatedRelationshipElement(
        source: aas.AnnotatedRelationshipElement,
    ): aasv2.AnnotatedRelationshipElement {
        if (!source.annotations) {
            throw new Error('AnnotatedRelationshipElement.annotation');
        }

        const relationship: aasv2.AnnotatedRelationshipElement = {
            ...this.writeRelationshipElement(source),
            annotation: source.annotations.map(item => this.writeSubmodelElement(item)),
        };

        return relationship;
    }

    private writeBasicEvent(source: aas.BasicEventElement): aasv2.BasicEvent {
        if (!source.observed) {
            throw new Error('BasicEventElement.observed');
        }

        const basicEvent: aasv2.BasicEvent = {
            ...this.writeSubmodelElementType(source),
            observed: this.writeReference(source.observed),
        };

        return basicEvent;
    }

    private writeBlob(source: aas.Blob): aasv2.Blob {
        let mimeType = source.contentType;
        if (!mimeType) {
            mimeType = '';
        }

        const blob: aasv2.Blob = {
            ...this.writeSubmodelElementType(source),
            mimeType,
        };

        if (source.value) {
            blob.value = source.value;
        }

        return blob;
    }

    private writeEntity(source: aas.Entity): aasv2.Entity {
        if (!source.entityType) {
            throw new Error('Entity.entityType');
        }

        const entity: aasv2.Entity = {
            ...this.writeSubmodelElementType(source),
            entityType: source.entityType,
        };

        if (source.globalAssetId) {
            throw new Error('Not implemented.');
            //entity.asset = this.writeReference(source.globalAssetId);
        }

        if (source.statements) {
            entity.statements = source.statements.map(item => this.writeSubmodelElement(item));
        }

        return entity;
    }

    private writeFile(source: aas.File): aasv2.File {
        let mimeType = source.contentType;
        if (!mimeType) {
            mimeType = '';
        }

        const file: aasv2.File = {
            ...this.writeSubmodelElementType(source),
            mimeType,
        };

        if (source.value) {
            file.value = source.value;
        }

        return file;
    }

    private writeMultiLanguageProperty(source: aas.MultiLanguageProperty): aasv2.MultiLanguageProperty {
        let langString: aasv2.LangString[] | undefined;
        if (Array.isArray(source.value)) {
            langString = source.value?.map(item => ({ language: item.language, text: item.text }));
        }

        if (!langString) {
            langString = [];
        }

        const property: aasv2.MultiLanguageProperty = {
            ...this.writeSubmodelElementType(source),
            value: { langString },
        };

        return property;
    }

    private writeOperation(source: aas.Operation): aasv2.Operation {
        const operation: aasv2.Operation = {
            ...this.writeSubmodelElementType(source),
        };

        if (source.inputVariables) {
            operation.inputVariable = source.inputVariables.map(item => this.writeOperationVariable(item));
        }

        if (source.inoutputVariables) {
            operation.inoutputVariable = source.inoutputVariables.map(item => this.writeOperationVariable(item));
        }

        if (source.outputVariables) {
            operation.outputVariable = source.outputVariables.map(item => this.writeOperationVariable(item));
        }

        return operation;
    }

    private writeOperationVariable(source: aas.OperationVariable): aasv2.OperationVariable {
        let value: aasv2.SubmodelElement | undefined;
        if (isSubmodelElement(source.value)) {
            value = this.writeSubmodelElementType(source.value);
        } else if ('submodelElement' in source.value) {
            const submodelElement = (source.value as { submodelElement: aasv2.SubmodelElement }).submodelElement;
            if (isSubmodelElement(submodelElement)) {
                value = this.writeSubmodelElement(submodelElement);
            }
        }

        if (!value) {
            throw new Error('OperationVariable.value');
        }

        return { value };
    }

    private writeProperty(source: aas.Property): aasv2.Property {
        const valueType = this.writeValueTypeDef(source.valueType);
        if (!valueType) {
            throw new Error('Property.valueType');
        }

        const property: aasv2.Property = {
            ...this.writeSubmodelElementType(source),
            valueType,
        };

        if (source.value) {
            property.value = source.value;
        }

        if (source.valueId) {
            property.valueId = this.writeReference(source.valueId);
        }

        return property;
    }

    private writeRange(source: aas.Range): aasv2.Range {
        if (!source.valueType) {
            throw new Error('Range.valueType');
        }

        const range: aasv2.Range = {
            ...this.writeSubmodelElementType(source),
            valueType: this.writeValueTypeDef(source.valueType)!,
        };

        if (source.min) {
            range.min = source.min;
        }

        if (source.max) {
            range.max = source.max;
        }

        return range;
    }

    private writeReferenceElement(source: aas.ReferenceElement): aasv2.ReferenceElement {
        if (!source.value) {
            throw new Error('ReferenceElement.value');
        }

        const reference: aasv2.ReferenceElement = {
            ...this.writeSubmodelElementType(source),
            value: this.writeReference(source.value),
        };

        return reference;
    }

    private writeRelationshipElement(source: aas.RelationshipElement): aasv2.RelationshipElement {
        if (!source.first) {
            throw new Error('RelationshipElement.first');
        }

        if (!source.second) {
            throw new Error('RelationshipElement.second');
        }

        const relationship: aasv2.RelationshipElement = {
            ...this.writeSubmodelElementType(source),
            first: this.writeReference(source.first),
            second: this.writeReference(source.second),
        };

        return relationship;
    }

    private writeSubmodelElementCollection(source: aas.SubmodelElementCollection): aasv2.SubmodelElementCollection {
        const collection: aasv2.SubmodelElementCollection = {
            ...this.writeSubmodelElementType(source),
        };

        if (source.value) {
            collection.value = source.value.map(item => this.writeSubmodelElement(item));
        }

        return collection;
    }

    private writeReference(source: aas.Reference): aasv2.Reference {
        return {
            keys: source.keys.map((key, index) => {
                if (!key.type) {
                    throw new Error(`Reference.type`);
                }

                if (!key.value) {
                    throw new Error(`Reference.value`);
                }

                return {
                    idType: this.writeKeyType(key),
                    type: key.type as aasv2.KeyElements,
                    value: key.value,
                    index: index,
                    local: true,
                } as aasv2.Key;
            }),
        };
    }

    private writeSubmodelElementType(source: aas.SubmodelElement): aasv2.SubmodelElement {
        return {
            ...this.writeReferable(source),
            ...this.writeHasSemantic(source),
            ...this.writeHasDataSpecification(source),
            ...this.writeQualifiable(source),
        };
    }

    private writeIdentifiable(source: aas.Identifiable): aasv2.Identifiable {
        if (!source.id) {
            throw new Error('Identifiable.id');
        }

        const identification = this.writeIdentifier(source.id);
        const identifiable: aasv2.Identifiable = {
            ...this.writeReferable(source),
            identification,
        };

        if (source.administration) {
            identifiable.administration = source.administration;
        }

        return identifiable;
    }

    private writeIdentifier(id: string): aasv2.Identifier {
        let idType: aasv2.KeyType;
        try {
            new URL(id);
            idType = 'IRI';
        } catch {
            idType = 'IRDI';
        }

        return { id, idType };
    }

    private writeReferable(source: aas.Referable): aasv2.Referable {
        const referable: aasv2.Referable = {
            idShort: source.idShort,
            modelType: { name: this.writeModelTypes(source.modelType) },
        };

        if (source.category) {
            referable.category = source.category as aasv2.Category;
        }

        if (source.description) {
            referable.descriptions = source.description.map(item => ({ language: item.language, text: item.text }));
        }

        return referable;
    }

    private writeHasDataSpecification(source: aas.HasDataSpecification): aasv2.HasDataSpecification {
        const hasDataSpecification: aasv2.HasDataSpecification = {};
        if (source.embeddedDataSpecifications) {
            hasDataSpecification.embeddedDataSpecifications = source.embeddedDataSpecifications.map(item =>
                this.writeEmbeddedDatSpecification(item),
            );
        }

        return hasDataSpecification;
    }

    private writeEmbeddedDatSpecification(source: aas.EmbeddedDataSpecification): aasv2.EmbeddedDataSpecification {
        if (!source.dataSpecification) {
            throw new Error('EmbeddedDataSpecification.dataSpecification');
        }

        if (!source.dataSpecificationContent) {
            throw new Error('EmbeddedDataSpecification.dataSpecificationContent');
        }

        const dataSpecificationContent = this.writeDataSpecificationIEC61360(
            source.dataSpecificationContent as aas.DataSpecificationIec61360,
        );

        const specification: aasv2.EmbeddedDataSpecification = {
            dataSpecification: this.writeReference(source.dataSpecification),
            dataSpecificationContent,
        };

        return specification;
    }

    private writeDataSpecificationIEC61360(
        source: aas.DataSpecificationIec61360,
    ): aasv2.DataSpecificationIec61360Content {
        if (!source.preferredName) {
            throw new Error(`DataSpecificationIec61360.preferredName`);
        }

        const iec61360: aasv2.DataSpecificationIec61360Content = {
            preferredName: source.preferredName,
        };

        if (source.dataType) {
            iec61360.dataType = this.writeDataTypeIEC61360(source.dataType);
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

    private writeValueList(source: aas.ValueList): aasv2.ValueList {
        if (!source.valueReferencePairs) {
            throw new Error('ValueList.valueReferencePairs');
        }

        return {
            valueReferencePairTypes: source.valueReferencePairs.map(item => {
                const pair: aasv2.ValueReferencePairType = {};
                if (item.value) {
                    pair.value = item.value;
                }

                if (item.valueId) {
                    pair.valueId = this.writeReference(item.valueId);
                }

                return pair;
            }),
        };
    }

    private writeDataTypeIEC61360(source: aas.DataTypeIec61360): aasv2.DataTypeIec61360 {
        switch (source) {
            case 'IRDI':
            case 'IRI':
                return 'URL';
            default:
                return source as aasv2.DataTypeIec61360;
        }
    }

    private writeHasSemantic(source: aas.HasSemantics): aasv2.HasSemantic {
        const hasSemantic: aasv2.HasSemantic = {};
        if (source.semanticId) {
            hasSemantic.semanticId = this.writeReference(source.semanticId);
        }

        return hasSemantic;
    }

    private writeQualifiable(source: aas.Qualifiable): aasv2.Qualifiable {
        const qualifiable: aasv2.Qualifiable = {};

        if (source.qualifiers) {
            qualifiable.qualifiers = source.qualifiers.map(item => this.writeQualifier(item));
        }

        return qualifiable;
    }

    private writeQualifier(source: aas.Qualifier): aasv2.Qualifier {
        if (!source.valueType) {
            throw new Error('Qualifier.valueType');
        }

        const qualifier: aasv2.Qualifier = {
            modelType: { name: 'Qualifier' },
            type: source.type,
            valueType: this.writeDataTypeDefXsd(source.valueType),
        };

        if (source.value) {
            qualifier.value = source.value;
        }

        if (source.valueId) {
            qualifier.valueId = this.writeReference(source.valueId);
        }

        return qualifier;
    }

    private writeValueTypeDef(source: aas.DataTypeDefXsd): aasv2.ValueTypeDef {
        return { dataObjectType: { name: this.writeDataTypeDefXsd(source) } };
    }

    private writeDataTypeDefXsd(source: aas.DataTypeDefXsd): aasv2.DataTypeDefXsd {
        switch (source) {
            case 'xs:anyURI':
                return 'anyURI';
            case 'xs:base64Binary':
                return 'base64Binary';
            case 'xs:boolean':
                return 'boolean';
            case 'xs:byte':
                return 'byte';
            case 'xs:date':
                return 'date';
            case 'xs:dateTime':
                return 'dateTime';
            case 'xs:decimal':
                return 'decimal';
            case 'xs:double':
                return 'double';
            case 'xs:duration':
                return 'duration';
            case 'xs:float':
                return 'float';
            case 'xs:gDay':
                return 'gDay';
            case 'xs:gMonth':
                return 'gMonth';
            case 'xs:gMonthDay':
                return 'gMonthDay';
            case 'xs:gYear':
                return 'gYear';
            case 'xs:gYearMonth':
                return 'gYearMonth';
            case 'xs:hexBinary':
                return 'hexBinary';
            case 'xs:int':
                return 'int';
            case 'xs:integer':
                return 'integer';
            case 'xs:long':
                return 'long';
            case 'xs:negativeInteger':
                return 'negativeInteger';
            case 'xs:nonNegativeInteger':
                return 'nonNegativeInteger';
            case 'xs:nonPositiveInteger':
                return 'nonPositiveInteger';
            case 'xs:positiveInteger':
                return 'positiveInteger';
            case 'xs:short':
                return 'short';
            case 'xs:string':
                return 'string';
            case 'xs:time':
                return 'time';
            case 'xs:unsignedByte':
                return 'unsignedByte';
            case 'xs:unsignedInt':
                return 'unsignedInt';
            case 'xs:unsignedLong':
                return 'unsignedLong';
            case 'xs:unsignedShort':
                return 'unsignedShort';
            default:
                return source as aasv2.DataTypeDefXsd;
        }
    }

    private writeHasKind(source: aas.HasKind): aasv2.HasKind {
        return { kind: source.kind ?? 'Instance' };
    }

    private writeKeyType(source: aas.Key): aasv2.KeyType {
        if (
            source.type === 'Submodel' ||
            source.type === 'AssetAdministrationShell' ||
            source.type === 'ConceptDescription'
        ) {
            try {
                new URL(source.value);
                return 'IRI';
            } catch {
                return 'IRDI';
            }
        }

        return 'IdShort';
    }

    private writeModelTypes(source: aas.ModelType): aasv2.ModelTypes {
        switch (source) {
            case 'BasicEventElement':
                return 'BasicEvent';
            default:
                return source as aasv2.ModelTypes;
        }
    }
}
