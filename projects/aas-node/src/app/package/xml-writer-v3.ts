/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { aas, convertToString, noop } from 'aas-core';
import camelCase from 'lodash-es/camelCase.js';
import { DOMImplementation, XMLSerializer } from '@xmldom/xmldom';
import { AASWriter } from './aas-writer.js';

export class XmlWriterV3 extends AASWriter {
    private readonly document: Document;

    public constructor() {
        super();

        this.document = new DOMImplementation().createDocument('https://admin-shell.io/aas/3/0', null, null);
    }

    public override write(env: aas.Environment): string {
        const envNode = this.appendChild(this.document, 'environment');
        const xmlns = this.document.createAttribute('xmlns');
        xmlns.value = 'https://admin-shell.io/aas/3/0';
        envNode.attributes.setNamedItem(xmlns);

        const shellsNode = this.appendChild(envNode, 'assetAdministrationShells');
        for (const aas of env.assetAdministrationShells) {
            this.writeAssetAdministrationShell(aas, this.appendChild(shellsNode, 'assetAdministrationShell'));
        }

        const submodelsNode = this.appendChild(envNode, 'submodels');
        for (const submodel of env.submodels) {
            this.writeSubmodel(submodel, this.appendChild(submodelsNode, 'submodel'));
        }

        const conceptDescriptionsNode = this.appendChild(envNode, 'conceptDescriptions');
        for (const conceptDescription of env.conceptDescriptions) {
            this.writeConceptDescription(
                conceptDescription,
                this.appendChild(conceptDescriptionsNode, 'conceptDescription'),
            );
        }

        return new XMLSerializer().serializeToString(this.document);
    }

    private writeKey(key: aas.Key, node: Node): void {
        this.writeTextNode(node, 'type', key.type);
        this.writeTextNode(node, 'value', key.value);
    }

    private writeReference(reference: aas.Reference, node: Node): void {
        this.writeTextNode(node, 'type', reference.type);
        if (reference.referredSemanticId) {
            this.writeReference(reference.referredSemanticId, this.appendChild(node, 'referredSemanticId'));
        }

        const keysElement = this.appendChild(node, 'keys');
        for (const key of reference.keys) {
            this.writeKey(key, this.appendChild(keysElement, 'key'));
        }
    }

    private writeExtension(extension: aas.Extension, node: Node): void {
        this.writeTextNode(node, 'name', extension.name);

        if (extension.refersTo) {
            extension.refersTo.forEach(item => this.writeReference(item, this.appendChild(node, 'refersTo')));
        }
    }

    private writeHasExtension(hasExtensions: aas.HasExtensions | undefined, node: Node): void {
        if (!hasExtensions?.extensions) return;

        const extensions = this.appendChild(node, 'extensions');
        for (const extension of hasExtensions.extensions) {
            this.writeExtension(extension, this.appendChild(extensions, 'extension'));
        }
    }

    private writeLangString(langString: aas.LangString, node: Node): void {
        this.writeTextNode(node, 'language', langString.language);
        this.writeTextNode(node, 'text', langString.text);
    }

    private writeLangStrings(langStrings: aas.LangString[] | undefined, node: Node, localName: string): void {
        if (!langStrings) return;

        for (const langString of langStrings) {
            this.writeLangString(langString, this.appendChild(node, localName));
        }
    }

    private writeReferable(referable: aas.Referable, node: Node): void {
        this.writeHasExtension(referable, node);
        this.writeTextNode(node, 'idShort', referable.idShort);
        this.writeTextNode(node, 'category', referable.category);

        if (referable.displayName) {
            this.writeLangStrings(referable.displayName, this.appendChild(node, 'displayName'), 'langStringNameType');
        }

        if (referable.description) {
            this.writeLangStrings(referable.description, this.appendChild(node, 'description'), 'langStringTextType');
        }
    }

    private writeValueReferencePair(pair: aas.ValueReferencePair, node: Node): void {
        this.writeTextNode(node, 'value', pair.value);
        this.writeReference(pair.valueId, this.appendChild(node, 'valueId'));
    }

    private writeDataSpecificationIec61360(content: aas.DataSpecificationIec61360, node: Node): void {
        this.writeLangStrings(
            content.preferredName,
            this.appendChild(node, 'preferredName'),
            'langStringPreferredNameTypeIec61360',
        );

        if (content.shortName) {
            this.writeLangStrings(
                content.shortName,
                this.appendChild(node, 'shortName'),
                'langStringShortNameTypeIec61360',
            );
        }

        this.writeTextNode(node, 'unit', content.unit);

        if (content.unitId) {
            this.writeReference(content.unitId, this.appendChild(node, 'unitId'));
        }

        this.writeTextNode(node, 'sourceOfDefinition', content.sourceOfDefinition);
        this.writeTextNode(node, 'symbol', content.symbol);
        this.writeTextNode(node, 'dataType', content.dataType);

        if (content.definition) {
            this.writeLangStrings(
                content.definition,
                this.appendChild(node, 'definition'),
                'langStringDefinitionTypeIec61360',
            );
        }

        if (content.valueList) {
            const listNode = this.appendChild(node, 'valueList');
            const pairsNode = this.appendChild(listNode, 'valueReferencePairs');
            for (const valueReferencePair of content.valueList.valueReferencePairs) {
                this.writeValueReferencePair(valueReferencePair, this.appendChild(pairsNode, 'valueReferencePair'));
            }
        }

        if (content.valueFormat) {
            this.writeTextNode(node, 'valueFormat', content.valueFormat);
        }

        if (content.value) {
            this.writeTextNode(node, 'value', content.value);
        }

        if (content.levelType) {
            const levelType = this.appendChild(node, 'levelType');
            this.writeTextNode(levelType, 'min', convertToString(content.levelType.min));
            this.writeTextNode(levelType, 'max', convertToString(content.levelType.max));
            this.writeTextNode(levelType, 'nom', convertToString(content.levelType.nom));
            this.writeTextNode(levelType, 'typ', convertToString(content.levelType.typ));
        }
    }

    private writeEmbeddedDataSpecification(embeddedDataSpecification: aas.EmbeddedDataSpecification, node: Node): void {
        this.writeReference(embeddedDataSpecification.dataSpecification, this.appendChild(node, 'dataSpecification'));
        const contentNode = this.appendChild(node, 'dataSpecificationContent');
        const content = embeddedDataSpecification.dataSpecificationContent;
        if (content.modelType === 'DataSpecificationIec61360') {
            this.writeDataSpecificationIec61360(
                content as aas.DataSpecificationIec61360,
                this.appendChild(contentNode, 'dataSpecificationIec61360'),
            );
        }
    }

    private writeHasDataSpecification(hasDataSpecification: aas.HasDataSpecification, node: Node): void {
        if (hasDataSpecification.embeddedDataSpecifications) {
            const specsNode = this.appendChild(node, 'embeddedDataSpecifications');
            for (const embeddedDataSpecification of hasDataSpecification.embeddedDataSpecifications) {
                this.writeEmbeddedDataSpecification(
                    embeddedDataSpecification,
                    this.appendChild(specsNode, 'embeddedDataSpecification'),
                );
            }
        }
    }

    private writeAdministrativeInformation(info: aas.AdministrativeInformation, node: Node): void {
        this.writeHasDataSpecification(info, node);
    }

    private writeIdentifiable(identifiable: aas.Identifiable, node: Node): void {
        this.writeReferable(identifiable, node);
        this.writeTextNode(node, 'id', identifiable.id);
        if (identifiable.administration) {
            this.writeAdministrativeInformation(identifiable.administration, this.appendChild(node, 'administration'));
        }
    }

    private writeHasSemantic(hasSemantic: aas.HasSemantics, node: Node): void {
        if (hasSemantic.semanticId) {
            this.writeReference(hasSemantic.semanticId, this.appendChild(node, 'semanticId'));
        }

        if (hasSemantic.supplementalSemanticIds) {
            const child = this.appendChild(node, 'supplementalSemanticIds');
            hasSemantic.supplementalSemanticIds.forEach(item =>
                this.writeReference(item, this.appendChild(child, 'reference')),
            );
        }
    }

    private writeHasKind(hasKind: aas.HasKind, node: Node): void {
        this.writeTextNode(node, 'kind', hasKind.kind);
    }

    private writeQualifier(qualifier: aas.Qualifier, node: Node): void {
        this.writeHasSemantic(qualifier, node);
        this.writeTextNode(node, 'kind', qualifier.kind);
        this.writeTextNode(node, 'type', qualifier.type);
        this.writeTextNode(node, 'value', qualifier.value);
        this.writeTextNode(node, 'valueType', qualifier.valueType);

        if (qualifier.valueId) {
            this.writeReference(qualifier.valueId, this.appendChild(node, 'valueId'));
        }
    }

    private writeQualifiable(qualifiable: aas.Qualifiable, node: Node): void {
        if (qualifiable.qualifiers) {
            const qualifiersNode = this.appendChild(node, 'qualifiers');
            for (const qualifier of qualifiable.qualifiers) {
                this.writeQualifier(qualifier, this.appendChild(qualifiersNode, 'qualifier'));
            }
        }
    }

    private writeSpecificAssetId(specificAssetId: aas.SpecificAssetId, node: Node): void {
        this.writeHasSemantic(specificAssetId, node);
        this.writeTextNode(node, 'name', specificAssetId.name);
        this.writeTextNode(node, 'value', specificAssetId.value);

        if (specificAssetId.externalSubjectId) {
            this.writeReference(specificAssetId.externalSubjectId, this.appendChild(node, 'externalSubjectId'));
        }
    }

    private writeResource(resource: aas.Resource, node: Node): void {
        this.writeTextNode(node, 'contentType', resource.contentType);
        this.writeTextNode(node, 'path', resource.path);
    }

    private writeAssetInformation(information: aas.AssetInformation, node: Node): void {
        this.writeTextNode(node, 'assetKind', information.assetKind);
        this.writeTextNode(node, 'assetType', information.assetType);
        this.writeTextNode(node, 'globalAssetId', information.globalAssetId);

        if (information.specificAssetIds) {
            const nodes = this.appendChild(node, 'specificAssetIds');
            for (const specificAssetId of information.specificAssetIds) {
                this.writeSpecificAssetId(specificAssetId, this.appendChild(nodes, 'specificAssetId'));
            }
        }

        if (information.defaultThumbnail) {
            this.writeResource(information.defaultThumbnail, this.appendChild(node, 'defaultThumbnail'));
        }
    }

    private writeAssetAdministrationShell(aas: aas.AssetAdministrationShell, node: Node): void {
        this.writeIdentifiable(aas, node);
        this.writeHasDataSpecification(aas, node);

        if (aas.derivedFrom) {
            this.writeReference(aas.derivedFrom, this.appendChild(node, 'derivedFrom'));
        }

        this.writeAssetInformation(aas.assetInformation, this.appendChild(node, 'assetInformation'));

        if (aas.submodels) {
            const submodelsNode = this.appendChild(node, 'submodels');
            for (const submodel of aas.submodels) {
                this.writeReference(submodel, this.appendChild(submodelsNode, 'reference'));
            }
        }
    }

    private writeSubmodelElement(submodelElement: aas.SubmodelElement, node: Node): void {
        this.writeReferable(submodelElement, node);
        this.writeHasSemantic(submodelElement, node);
        this.writeQualifiable(submodelElement, node);
        this.writeHasDataSpecification(submodelElement, node);

        switch (submodelElement.modelType) {
            case 'AnnotatedRelationshipElement':
                this.writeAnnotatedRelationshipElement(submodelElement as aas.AnnotatedRelationshipElement, node);
                break;
            case 'BasicEventElement':
                this.writeBasicEventElement(submodelElement as aas.BasicEventElement, node);
                break;
            case 'Blob':
                this.writeBlob(submodelElement as aas.Blob, node);
                break;
            case 'Capability':
                this.writeCapability(submodelElement as aas.Capability, node);
                break;
            case 'Entity':
                this.writeEntity(submodelElement as aas.Entity, node);
                break;
            case 'File':
                this.writeFile(submodelElement as aas.File, node);
                break;
            case 'MultiLanguageProperty':
                this.writeMultiLanguageProperty(submodelElement as aas.MultiLanguageProperty, node);
                break;
            case 'Operation':
                this.writeOperation(submodelElement as aas.Operation, node);
                break;
            case 'Property':
                this.writeProperty(submodelElement as aas.Property, node);
                break;
            case 'Range':
                this.writeRange(submodelElement as aas.Range, node);
                break;
            case 'ReferenceElement':
                this.writeReferenceElement(submodelElement as aas.ReferenceElement, node);
                break;
            case 'RelationshipElement':
                this.writeRelationshipElement(submodelElement as aas.RelationshipElement, node);
                break;
            case 'SubmodelElementCollection':
                this.writeSubmodelElementCollection(submodelElement as aas.SubmodelElementCollection, node);
                break;
            case 'SubmodelElementList':
                this.writeSubmodelElementList(submodelElement as aas.SubmodelElementList, node);
                break;
        }
    }

    private writeDataElement(dataElement: aas.DataElement, node: Node): void {
        this.writeReferable(dataElement, node);
        this.writeHasSemantic(dataElement, node);
        this.writeQualifiable(dataElement, node);
        this.writeHasDataSpecification(dataElement, node);

        switch (dataElement.modelType) {
            case 'Blob':
                this.writeBlob(dataElement as aas.Blob, node);
                break;
            case 'File':
                this.writeFile(dataElement as aas.File, node);
                break;
            case 'MultiLanguageProperty':
                this.writeMultiLanguageProperty(dataElement as aas.MultiLanguageProperty, node);
                break;
            case 'Property':
                this.writeProperty(dataElement as aas.Property, node);
                break;
            case 'Range':
                this.writeRange(dataElement as aas.Range, node);
                break;
            case 'ReferenceElement':
                this.writeReferenceElement(dataElement as aas.ReferenceElement, node);
                break;
        }
    }

    private writeAnnotatedRelationshipElement(relationship: aas.AnnotatedRelationshipElement, node: Node) {
        this.writeRelationshipElement(relationship, node);

        if (relationship.annotations) {
            const annotationsNode = this.appendChild(node, 'annotations');
            for (const annotation of relationship.annotations) {
                this.writeDataElement(annotation, this.appendChild(annotationsNode, camelCase(annotation.modelType)));
            }
        }
    }

    private writeBasicEventElement(event: aas.BasicEventElement, node: Node) {
        this.writeReference(event.observed, this.appendChild(node, 'observed'));
        this.writeTextNode(node, 'direction', event.direction);
        this.writeTextNode(node, 'state', event.state);
        this.writeTextNode(node, 'messageTopic', event.messageTopic);

        if (event.messageBroker) {
            this.writeReference(event.messageBroker, this.appendChild(node, 'messageBroker'));
        }

        this.writeTextNode(node, 'lastUpdate', event.lastUpdate);
        this.writeTextNode(node, 'minInterval', event.minInterval);
        this.writeTextNode(node, 'maxInterval', event.maxInterval);
    }

    private writeBlob(blob: aas.Blob, node: Node) {
        this.writeTextNode(node, 'contentType', blob.contentType);
        this.writeTextNode(node, 'value', blob.value);
    }

    private writeCapability(capability: aas.Capability, node: Node) {
        noop(capability, node);
    }

    private writeEntity(entity: aas.Entity, node: Node) {
        this.writeTextNode(node, 'entityType', entity.entityType);
        this.writeTextNode(node, 'globalAssetId', entity.globalAssetId);

        if (entity.specificAssetIds) {
            const child = this.appendChild(node, 'specificAssetIds');
            entity.specificAssetIds.forEach(item =>
                this.writeSpecificAssetId(item, this.appendChild(child, 'specificAssetId')),
            );
        }

        if (entity.statements) {
            const statementsNode = this.appendChild(node, 'statements');
            for (const statement of entity.statements) {
                this.writeSubmodelElement(statement, this.appendChild(statementsNode, camelCase(statement.modelType)));
            }
        }
    }

    private writeFile(file: aas.File, node: Node) {
        this.writeTextNode(node, 'contentType', file.contentType);
        this.writeTextNode(node, 'value', file.value);
    }

    private writeMultiLanguageProperty(property: aas.MultiLanguageProperty, node: Node) {
        const valueNode = this.appendChild(node, 'value');
        this.writeLangStrings(property.value, valueNode, 'langStringTextType');

        if (property.valueId) {
            this.writeReference(property.valueId, this.appendChild(node, 'valueId'));
        }
    }

    private writeOperationVariable(variable: aas.OperationVariable, node: Node): void {
        const valueNode = this.appendChild(node, 'value');
        const modelTypeNode = this.appendChild(valueNode, this.getLocalNameFromModelType(variable.value.modelType));
        this.writeSubmodelElement(variable.value, modelTypeNode);
    }

    private writeOperation(operation: aas.Operation, node: Node) {
        if (operation.inputVariables) {
            const variablesNode = this.appendChild(node, 'inputVariables');
            for (const variable of operation.inputVariables) {
                this.writeOperationVariable(variable, this.appendChild(variablesNode, 'operationVariable'));
            }
        }

        if (operation.inoutputVariables) {
            const variablesNode = this.appendChild(node, 'inoutputVariables');
            for (const variable of operation.inoutputVariables) {
                this.writeOperationVariable(variable, this.appendChild(variablesNode, 'operationVariable'));
            }
        }

        if (operation.outputVariables) {
            const variablesNode = this.appendChild(node, 'outputVariables');
            for (const variable of operation.outputVariables) {
                this.writeOperationVariable(variable, this.appendChild(variablesNode, 'operationVariable'));
            }
        }
    }

    private writeProperty(property: aas.Property, node: Node) {
        this.writeTextNode(node, 'valueType', property.valueType);
        this.writeTextNode(node, 'value', property.value);

        if (property.valueId) {
            this.writeReference(property.valueId, this.appendChild(node, 'valueId'));
        }
    }

    private writeRange(range: aas.Range, node: Node) {
        this.writeTextNode(node, 'valueType', range.valueType);
        this.writeTextNode(node, 'min', range.min);
        this.writeTextNode(node, 'max', range.max);
    }

    private writeReferenceElement(reference: aas.ReferenceElement, node: Node) {
        if (reference.value) {
            this.writeReference(reference.value, this.appendChild(node, 'value'));
        }
    }

    private writeRelationshipElement(relationship: aas.RelationshipElement, node: Node) {
        this.writeReference(relationship.first, this.appendChild(node, 'first'));
        this.writeReference(relationship.second, this.appendChild(node, 'second'));
    }

    private writeSubmodelElementCollection(collection: aas.SubmodelElementCollection, node: Node) {
        if (collection.value) {
            const valueNode = this.appendChild(node, 'value');
            for (const value of collection.value) {
                const elementNode = this.appendChild(valueNode, camelCase(value.modelType));
                this.writeSubmodelElement(value, elementNode);
            }
        }
    }

    private writeSubmodelElementList(list: aas.SubmodelElementList, node: Node) {
        if (typeof list.orderRelevant === 'boolean') {
            this.writeTextNode(node, 'orderRelevant', list.orderRelevant ? 'true' : 'false');
        }

        this.writeTextNode(node, 'typeValueListElement', list.typeValueListElement);
        this.writeTextNode(node, '', list.valueTypeListElement);

        if (list.semanticIdListElement) {
            this.writeReference(list.semanticIdListElement, this.appendChild(node, 'semanticIdListElement'));
        }

        if (list.value) {
            const valueNode = this.appendChild(node, 'value');
            for (const value of list.value) {
                const elementNode = this.appendChild(valueNode, camelCase(value.modelType));
                this.writeSubmodelElement(value, elementNode);
            }
        }
    }

    private writeSubmodel(submodel: aas.Submodel, node: Node): void {
        this.writeIdentifiable(submodel, node);
        this.writeHasKind(submodel, node);
        this.writeHasSemantic(submodel, node);
        this.writeQualifiable(submodel, node);
        this.writeHasDataSpecification(submodel, node);

        if (submodel.submodelElements) {
            const elementsNode = this.appendChild(node, 'submodelElements');
            for (const submodelElement of submodel.submodelElements) {
                const elementNode = this.appendChild(elementsNode, camelCase(submodelElement.modelType));
                this.writeSubmodelElement(submodelElement, elementNode);
            }
        }
    }

    private writeConceptDescription(conceptDescription: aas.ConceptDescription, node: Node): void {
        this.writeIdentifiable(conceptDescription, node);
        this.writeHasDataSpecification(conceptDescription, node);

        if (conceptDescription.isCaseOf) {
            const isCaseOfNode = this.appendChild(node, 'isCaseOf');
            for (const reference of conceptDescription.isCaseOf) {
                this.writeReference(reference, this.appendChild(isCaseOfNode, 'reference'));
            }
        }
    }

    private writeTextNode(node: Node, localName: string, value?: string) {
        if (value !== undefined && value !== null) {
            node.appendChild(this.document.createElement(localName)).textContent = value;
        }
    }

    private appendChild(parent: Node, localName: string): Element {
        return parent.appendChild(this.document.createElement(localName));
    }

    private getLocalNameFromModelType(modelType: aas.ModelType): string {
        return modelType.charAt(0).toLowerCase() + modelType.substring(1);
    }
}
