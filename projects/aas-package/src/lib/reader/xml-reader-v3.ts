/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { aas, determineType, extensionToMimeType, toBoolean } from 'aas-core';
import { useNamespaces, XPathSelect } from 'xpath';
import { DOMParser } from '@xmldom/xmldom';
import { AASReader } from '../aas-reader.js';
import { HTMLDocumentElement } from '../types.js';

export class XmlReaderV3 extends AASReader {
    private readonly select: XPathSelect;
    private readonly document: Document;

    public constructor(xmlSource: string | Document, createReferenceToParent?: boolean) {
        super(createReferenceToParent);

        this.document = typeof xmlSource === 'string' ? new DOMParser().parseFromString(xmlSource) : xmlSource;
        this.select = useNamespaces(this.getNamespaces());
    }

    public readEnvironment(): aas.Environment {
        const conceptDescriptions = this.readConceptDescriptions();
        const assetAdministrationShells = this.readAssetAdministrationShells();
        const submodels = this.readSubmodels();
        return { assetAdministrationShells, submodels, conceptDescriptions };
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public read(data: string | object): aas.Referable {
        throw new Error('Not implemented.');
    }

    private getNamespaces(): { [key: string]: string } {
        const nsMap = (this.document.documentElement as HTMLDocumentElement)._nsMap ?? {};
        const namespaces: { [key: string]: string } = {};
        for (const prefix in nsMap) {
            const uri = nsMap[prefix];
            if (uri === 'https://admin-shell.io/aas/3/0' || uri === 'https://admin-shell.io/aas/3/1') {
                namespaces['aas'] = uri;
            }
        }

        return namespaces;
    }

    private readAssetInformation(node: Element): aas.AssetInformation {
        const asset = this.selectNode('./aas:assetInformation', node);
        if (!asset) {
            return { assetKind: 'Instance' };
        }

        const value: aas.AssetInformation = {
            assetKind: this.getTextContent('./aas:assetKind', asset) as aas.AssetKind,
        };

        const globalAssetId = this.readTextContent('./aas:globalAssetId', asset);
        if (globalAssetId) {
            value.globalAssetId = globalAssetId;
        }

        const assetType = this.readTextContent('./aas:assetType', asset);
        if (assetType) {
            value.assetType = assetType;
        }

        const defaultThumbnail = this.readResource(this.selectNode('./aas:defaultThumbnail', asset));
        if (defaultThumbnail) {
            value.defaultThumbnail = defaultThumbnail;
        }

        const specificAssetIds = this.readSpecificAssetIds(this.selectNode('./aas:specificAssetIds', asset));
        if (specificAssetIds) {
            value.specificAssetIds = specificAssetIds;
        }

        return value;
    }

    private readResource(node: Element | undefined): aas.Resource | undefined {
        if (!node) {
            return undefined;
        }

        const value: aas.Resource = {
            path: this.getTextContent('./aas:path', node),
        };

        const contentType = this.readTextContent('./aas:contentType', node);
        if (contentType) {
            value.contentType = contentType;
        }

        return value;
    }

    private readSpecificAssetIds(node: Element | undefined): aas.SpecificAssetId[] | undefined {
        if (!node) {
            return undefined;
        }

        const values: aas.SpecificAssetId[] = [];
        for (const child of this.selectNodes('./aas:specificAssetId', node)) {
            const value = this.readSpecificAssetId(child);
            if (value) {
                values.push(value);
            }
        }

        return values;
    }

    private readSpecificAssetId(node: Element | undefined): aas.SpecificAssetId | undefined {
        if (!node) {
            return undefined;
        }

        const externalSubjectId = this.readReference(this.selectNode('./aas:externalSubjectId', node));
        if (!externalSubjectId) {
            throw new Error('SpecificAssetId.externalSubjectId');
        }

        const value: aas.SpecificAssetId = {
            ...this.readHasSemantics(node),
            name: this.getTextContent('./aas:name', node),
            value: this.getTextContent('./aas:value', node),
            externalSubjectId,
        };

        return value;
    }

    private readAssetAdministrationShells(): aas.AssetAdministrationShell[] {
        const shells: aas.AssetAdministrationShell[] = [];
        for (const node of this.selectNodes(
            '/aas:environment/aas:assetAdministrationShells/aas:assetAdministrationShell',
            this.document,
        )) {
            const shell = this.readAssetAdministrationShell(node);
            shells.push(shell);
        }

        return shells;
    }

    private readAssetAdministrationShell(node: Element): aas.AssetAdministrationShell {
        const assetInformation = this.readAssetInformation(node);
        if (!assetInformation) {
            throw new Error('AssetAdministrationShell.assetInformation');
        }

        const shell: aas.AssetAdministrationShell = {
            ...this.readIdentifiable(node),
            ...this.readHasDataSpecification(node),
            assetInformation,
        };

        const submodels = this.readReferences('./aas:submodels/aas:reference', node);
        if (submodels.length > 0) {
            shell.submodels = submodels;
        }

        const administration = this.readAdministrativeInformation(this.selectNode('./aas:administration', node));
        if (administration) {
            shell.administration = administration;
        }

        return shell;
    }

    private readSubmodels(): aas.Submodel[] {
        const submodels: aas.Submodel[] = [];
        for (const node of this.selectNodes('/aas:environment/aas:submodels/aas:submodel', this.document)) {
            const submodel = this.readSubmodel(node);
            submodels.push(submodel);
        }

        return submodels;
    }

    private readSubmodel(node: Element): aas.Submodel {
        const submodel: aas.Submodel = {
            ...this.readIdentifiable(node),
            ...this.readHasSemantics(node),
            ...this.readQualifiable(node),
            ...this.readHasKind(node),
            ...this.readHasDataSpecification(node),
        };

        const submodelElements = this.readSubmodelElements(node, [submodel]);

        if (submodelElements.length > 0) {
            submodel.submodelElements = submodelElements;
        }

        return submodel;
    }

    private readSubmodelElements(node: Element, ancestors: aas.Referable[]): aas.SubmodelElement[] {
        const submodelElements: aas.SubmodelElement[] = [];
        for (const child of this.selectNodes('./aas:submodelElements/*', node)) {
            submodelElements.push(this.readSubmodelElement(child, ancestors));
        }

        return submodelElements;
    }

    private readSubmodelElement(node: Element, ancestors: aas.Referable[]): aas.SubmodelElement {
        let submodelElement: aas.SubmodelElement;
        const modelType = this.getModelTypeFromLocalName(node);
        switch (modelType) {
            case 'AnnotatedRelationshipElement':
                submodelElement = this.readAnnotatedRelationshipElement(node, ancestors);
                break;
            case 'BasicEventElement':
                submodelElement = this.readBasicEventElement(node, ancestors);
                break;
            case 'Blob':
                submodelElement = this.readBlob(node, ancestors);
                break;
            case 'Entity':
                submodelElement = this.readEntity(node, ancestors);
                break;
            case 'File':
                submodelElement = this.readFile(node, ancestors);
                break;
            case 'MultiLanguageProperty':
                submodelElement = this.readMultiLanguageProperty(node, ancestors);
                break;
            case 'Operation':
                submodelElement = this.readOperation(node, ancestors);
                break;
            case 'Property':
                submodelElement = this.readProperty(node, ancestors);
                break;
            case 'Range':
                submodelElement = this.readRange(node, ancestors);
                break;
            case 'ReferenceElement':
                submodelElement = this.readReferenceElement(node, ancestors);
                break;
            case 'RelationshipElement':
                submodelElement = this.readRelationshipElement(node, ancestors);
                break;
            case 'SubmodelElementCollection':
                submodelElement = this.readSubmodelElementCollection(node, ancestors);
                break;
            case 'SubmodelElementList':
                submodelElement = this.readSubmodelElementList(node, ancestors);
                break;
            default:
                throw new Error(`Model type "${modelType}" is not supported.`);
        }

        return submodelElement;
    }

    private readAnnotatedRelationshipElement(
        node: Element,
        ancestors: aas.Referable[],
    ): aas.AnnotatedRelationshipElement {
        const base = this.readSubmodelElementType(node, ancestors);
        const first = this.readReference(this.selectNode('./aas:first', node));
        if (!first) {
            throw new Error('RelationshipElement.first');
        }

        const second = this.readReference(this.selectNode('./aas:second', node));
        if (!second) {
            throw new Error('RelationshipElement.second');
        }

        const relationship: aas.AnnotatedRelationshipElement = {
            ...base,
            first,
            second,
        };

        const annotations = this.readAnnotations(node, [...ancestors, relationship]);
        if (annotations.length > 0) {
            relationship.annotations = annotations;
        }

        return relationship;
    }

    private readAnnotations(node: Element, ancestors: aas.Referable[]): aas.DataElement[] {
        const dataElements: aas.DataElement[] = [];
        for (const child of this.selectNodes('./aas:annotations/*', node)) {
            const dataElement = this.readDataElement(child, ancestors);
            if (dataElement) {
                dataElements.push(dataElement);
            }
        }

        return dataElements;
    }

    private readDataElement(node: Element, ancestors: aas.Referable[]): aas.DataElement | undefined {
        let dataElement: aas.DataElement | undefined;
        const modelType = this.getModelTypeFromLocalName(node);
        switch (modelType) {
            case 'Blob':
                dataElement = this.readBlob(node, ancestors);
                break;
            case 'File':
                dataElement = this.readFile(node, ancestors);
                break;
            case 'MultiLanguageProperty':
                dataElement = this.readMultiLanguageProperty(node, ancestors);
                break;
            case 'Property':
                dataElement = this.readProperty(node, ancestors);
                break;
            case 'Range':
                dataElement = this.readRange(node, ancestors);
                break;
            case 'ReferenceElement':
                dataElement = this.readReferenceElement(node, ancestors);
                break;
            default:
                break;
        }

        return dataElement;
    }

    private readBasicEventElement(node: Element, ancestors: aas.Referable[]): aas.BasicEventElement {
        const observed = this.readReference(this.selectNode('./aas:observed', node));
        if (!observed) {
            throw new Error('BasicEventElement.observed');
        }

        const direction = this.readTextContent('./aas:direction', node) as aas.Direction | undefined;
        if (!direction) {
            throw new Error('BasicEventElement.direction');
        }

        const state = this.readTextContent('./aas:state', node) as aas.StateOfEvent | undefined;
        if (!state) {
            throw new Error('BasicEventElement.state');
        }

        const basicEvent: aas.BasicEventElement = {
            ...this.readSubmodelElementType(node, ancestors),
            observed,
            direction,
            state,
        };

        const messageTopic = this.readTextContent('./aas:messageTopic', node);
        if (messageTopic) {
            basicEvent.messageTopic = messageTopic;
        }

        const messageBroker = this.readReference(this.selectNode('./aas:messageBroker', node));
        if (messageBroker) {
            basicEvent.messageBroker = messageBroker;
        }

        const lastUpdate = this.readTextContent('./aas:lastUpdate', node);
        if (lastUpdate) {
            basicEvent.lastUpdate = lastUpdate;
        }

        const minInterval = this.readTextContent('./aas:minInterval', node);
        if (minInterval) {
            basicEvent.minInterval = minInterval;
        }

        const maxInterval = this.readTextContent('./aas:maxInterval', node);
        if (maxInterval) {
            basicEvent.maxInterval = maxInterval;
        }

        return basicEvent;
    }

    private readEntity(node: Element, ancestors: aas.Referable[]): aas.Entity {
        const entityType = this.selectNode('./aas:entityType', node)?.textContent as aas.EntityType;
        if (!entityType) {
            throw new Error('File.contentType');
        }

        const entity: aas.Entity = {
            ...this.readSubmodelElementType(node, ancestors),
            entityType,
        };

        const globalAssetId = this.selectNode('./aas:globalAssetId', node)?.textContent;
        if (globalAssetId) {
            entity.globalAssetId = globalAssetId;
        }

        const specificAssetIds = this.readSpecificAssetIds(this.selectNode('./aas:specificAssetIds', node));
        if (specificAssetIds) {
            entity.specificAssetIds = specificAssetIds;
        }

        const statements = this.readStatements(node, [...ancestors, entity]);
        if (statements.length > 0) {
            entity.statements = statements;
        }

        return entity;
    }

    private readStatements(node: Element, ancestors: aas.Referable[]): aas.SubmodelElement[] {
        const statements: aas.SubmodelElement[] = [];
        for (const child of this.selectNodes('./aas:statements/*', node)) {
            statements.push(this.readSubmodelElement(child, ancestors));
        }

        return statements;
    }

    private readBlob(node: Element, ancestors: aas.Referable[]): aas.Blob {
        const contentType = this.selectNode('./aas:contentType', node)?.textContent;
        if (!contentType) {
            throw new Error('File.contentType');
        }

        const blob: aas.Blob = {
            ...this.readSubmodelElementType(node, ancestors),
            contentType,
        };

        const value = this.selectNode('./aas:value', node)?.textContent;
        if (value) {
            blob.value = value;
        }

        return blob;
    }

    private readSubmodelElementCollection(node: Element, ancestors: aas.Referable[]): aas.SubmodelElementCollection {
        const collection: aas.SubmodelElementCollection = this.readSubmodelElementType(node, ancestors);
        const value = this.readCollectionValue(node, [...ancestors, collection]);
        if (value.length > 0) {
            collection.value = value;
        }

        return collection;
    }

    private readSubmodelElementList(node: Element, ancestors: aas.Referable[]): aas.SubmodelElementList {
        const list: aas.SubmodelElementList = {
            ...this.readSubmodelElementType(node, ancestors),
            typeValueListElement: this.getTextContent('./aas:typeValueListElement', node) as aas.AASSubmodelElements,
        };

        const value = this.readCollectionValue(node, [...ancestors, list]);
        if (value.length > 0) {
            list.value = value;
        }

        return list;
    }

    private readCollectionValue(node: Element, ancestors: aas.Referable[]): aas.SubmodelElement[] {
        const submodelElements: aas.SubmodelElement[] = [];
        for (const child of this.selectNodes('./aas:value/*', node)) {
            submodelElements.push(this.readSubmodelElement(child, ancestors));
        }

        return submodelElements;
    }

    private readProperty(node: Element, ancestors: aas.Referable[]): aas.Property {
        const valueNode = this.selectNode('./aas:value', node);
        const value = valueNode?.textContent;

        const valueTypeNode = this.selectNode('./aas:valueType', node);
        let valueType: aas.DataTypeDefXsd | undefined;
        if (valueTypeNode?.textContent) {
            valueType = valueTypeNode.textContent as aas.DataTypeDefXsd;
        }

        if (!valueType && value != null) {
            valueType = determineType(value);
        }

        if (!valueType) {
            valueType = 'xs:string';
        }

        const property: aas.Property = { ...this.readSubmodelElementType(node, ancestors), valueType };
        if (value) {
            property.value = value;
        }

        const valueId = this.readReference(this.selectNode('./aas:valueId', node));
        if (valueId) {
            property.valueId = valueId;
        }

        return property;
    }

    private readRange(node: Element, ancestors: aas.Referable[]): aas.Range {
        const range: aas.Range = {
            ...this.readSubmodelElementType(node, ancestors),
            valueType: this.getTextContent('./aas:valueType', node) as aas.DataTypeDefXsd,
        };

        const min = this.readTextContent('./aas:min', node);
        if (min) {
            range.min = min;
        }

        const max = this.readTextContent('./aas:max', node);
        if (max) {
            range.max = max;
        }

        return range;
    }

    private readRelationshipElement(node: Element, ancestors: aas.Referable[]): aas.RelationshipElement {
        const relationship: aas.RelationshipElement = this.readSubmodelElementType(node, ancestors);
        const first = this.readReference(this.selectNode('./aas:first', node));
        if (first) {
            relationship.first = first;
        }

        const second = this.readReference(this.selectNode('./aas:second', node));
        if (second) {
            relationship.second = second;
        }

        return relationship;
    }

    private readFile(node: Element, ancestors: aas.Referable[]): aas.File {
        let contentType = this.selectNode('./aas:mimeType', node)?.textContent;
        const value = this.selectNode('./aas:value', node)?.textContent;
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
            ...this.readSubmodelElementType(node, ancestors),
            contentType,
        };

        if (value) {
            file.value = value;
        }

        return file;
    }

    private readMultiLanguageProperty(node: Element, ancestors: aas.Referable[]): aas.MultiLanguageProperty {
        const mlp: aas.MultiLanguageProperty = { ...this.readSubmodelElementType(node, ancestors) };
        const value = this.readLangStrings('./aas:value/aas:langStringTextType', node);
        if (value) {
            mlp.value = value;
        }

        const valueId = this.readReference(this.selectNode('./aas:valueId', node));
        if (valueId) {
            mlp.valueId = valueId;
        }

        return mlp;
    }

    private readOperation(node: Element, ancestors: aas.Referable[]): aas.Operation {
        const operation: aas.Operation = {
            ...this.readSubmodelElementType(node, ancestors),
        };

        const inputVariablesElement = this.selectNode('./aas:inputVariables', node);
        if (inputVariablesElement) {
            const inputVariables = this.readOperationVariables(inputVariablesElement, [...ancestors, operation]);

            if (inputVariables) {
                operation.inputVariables = inputVariables;
            }
        }

        const inoutputVariablesElement = this.selectNode('./aas:inoutputVariables', node);
        if (inoutputVariablesElement) {
            const inoutputVariables = this.readOperationVariables(inoutputVariablesElement, [...ancestors, operation]);

            if (inoutputVariables) {
                operation.inoutputVariables = inoutputVariables;
            }
        }

        const outputVariablesElement = this.selectNode('./aas:outputVariables', node);
        if (outputVariablesElement) {
            const outputVariables = this.readOperationVariables(outputVariablesElement, [...ancestors, operation]);

            if (outputVariables) {
                operation.outputVariables = outputVariables;
            }
        }

        return operation;
    }

    private readOperationVariables(node: Element, ancestors: aas.Referable[]): aas.OperationVariable[] {
        const variables: aas.OperationVariable[] = [];
        for (const element of this.selectNodes('./aas:operationVariable', node)) {
            const variable = this.readOperationVariable(element, ancestors);
            if (variable) {
                variables.push(variable);
            }
        }

        return variables;
    }

    private readOperationVariable(node: Element, ancestors: aas.Referable[]): aas.OperationVariable | undefined {
        for (const element of this.selectNodes('./aas:value/*', node)) {
            return { value: this.readSubmodelElement(element, ancestors) };
        }

        return undefined;
    }

    private readReferenceElement(node: Element, ancestors: aas.Referable[]): aas.ReferenceElement {
        const reference: aas.ReferenceElement = {
            ...this.readSubmodelElementType(node, ancestors),
        };

        const value = this.readReference(this.selectNode('./aas:value', node));
        if (value) {
            reference.value = value;
        }

        return reference;
    }

    private readSubmodelElementType(node: Element, ancestors: aas.Referable[]): aas.SubmodelElement {
        return {
            ...this.readReferable(node, ancestors),
            ...this.readHasSemantics(node),
            ...this.readHasKind(node),
            ...this.readHasDataSpecification(node),
            ...this.readQualifiable(node),
        };
    }

    private readIdentifiable(node: Element): aas.Identifiable {
        const id = this.getTextContent('./aas:id', node);
        const identifiable: aas.Identifiable = { ...this.readReferable(node, []), id };

        const administration = this.readAdministrativeInformation(this.selectNode('./aas:administration', node));
        if (administration) {
            identifiable.administration = administration;
        }

        return identifiable;
    }

    private readReferable(node: Element, ancestors: aas.Referable[]): aas.Referable {
        const idShort = this.readTextContent('./aas:idShort', node) ?? '';
        const referable: aas.Referable = {
            ...this.readHasExtensions(node),
            idShort,
            modelType: this.getModelTypeFromLocalName(node),
        };

        if (ancestors && this.createReferenceToParent) {
            referable.parent = this.createParentReference(ancestors);
        }

        const category = this.readTextContent('./aas:category', node);
        if (category) {
            referable.category = category;
        }

        const displayName = this.readLangStrings('./aas:displayName/aas:langStringNameType', node);
        if (displayName) {
            referable.displayName = displayName;
        }

        const description = this.readLangStrings('./aas:description/aas:langStringTextType', node);
        if (description) {
            referable.description = description;
        }

        return referable;
    }

    private readHasExtensions(node: Element): aas.HasExtensions {
        const values: aas.HasExtensions = {};
        const extensions: aas.Extension[] = [];
        for (const child of this.selectNodes('./aas:extensions/aas:extension', node)) {
            extensions.push(this.readExtension(child));
        }

        if (extensions.length > 0) {
            values.extensions = extensions;
        }

        return values;
    }

    private readExtension(node: Element): aas.Extension {
        const extension: aas.Extension = {
            ...this.readHasSemantics(node),
            name: this.getTextContent('./aas:name', node),
        };

        return extension;
    }

    private readHasSemantics(node: Element): aas.HasSemantics {
        const hasSemantics: aas.HasSemantics = {};
        const semanticId = this.readReference(this.selectNode('./aas:semanticId', node));
        if (semanticId) {
            hasSemantics.semanticId = semanticId;
        }

        const supplementalSemanticIds = this.readReferences('./aas:supplementalSemanticIds/aas:reference', node);
        if (supplementalSemanticIds.length > 0) {
            hasSemantics.supplementalSemanticIds = supplementalSemanticIds;
        }

        return hasSemantics;
    }

    private readHasKind(node: Element): aas.HasKind {
        let kind = this.selectNode('./aas:kind', node)?.textContent as aas.ModellingKind;
        if (!kind) {
            kind = 'Instance';
        }

        return { kind };
    }

    private readHasDataSpecification(node: Element): aas.HasDataSpecification {
        const value: aas.HasDataSpecification = {};
        const parent = this.selectNode('./aas:embeddedDataSpecifications', node);
        if (!parent) {
            return value;
        }

        const embeddedDataSpecifications: aas.EmbeddedDataSpecification[] = [];
        for (const child of this.selectNodes('./aas:embeddedDataSpecification', parent)) {
            embeddedDataSpecifications.push(this.readEmbeddedDataSpecification(child));
        }

        if (embeddedDataSpecifications.length > 0) {
            value.embeddedDataSpecifications = embeddedDataSpecifications;
        }

        return value;
    }

    private readEmbeddedDataSpecification(node: Element): aas.EmbeddedDataSpecification {
        let dataSpecification = this.readReference(this.selectNode('./aas:dataSpecification', node));
        if (!dataSpecification) {
            dataSpecification = {
                type: 'ExternalReference',
                keys: [
                    {
                        type: 'GlobalReference',
                        value: 'http://admin-shell.io/DataSpecificationTemplates/DataSpecificationIEC61360/3/0',
                    },
                ],
            };
        }

        const dataSpecificationContent = this.readDataSpecificationContent(node);
        if (!dataSpecificationContent) {
            throw new Error('EmbeddedDataSpecification.dataSpecificationContent');
        }

        return { dataSpecification, dataSpecificationContent };
    }

    private readDataSpecificationContent(node: Element): aas.DataSpecificationContent | undefined {
        const child = this.selectNode('./aas:dataSpecificationContent/aas:dataSpecificationIec61360', node);
        if (child) {
            return this.readDataSpecificationIec61360(child);
        }

        return undefined;
    }

    private readDataSpecificationIec61360(node: Element): aas.DataSpecificationIec61360 {
        const preferredName = this.readLangStrings('./aas:preferredName/aas:langStringPreferredNameTypeIec61360', node);
        if (!preferredName) {
            throw new Error('DataSpecificationIec61360Content.preferredName');
        }

        const dataSpecification: aas.DataSpecificationIec61360 = {
            modelType: 'DataSpecificationIec61360',
            preferredName,
        };

        const shortName = this.readLangStrings('./aas:shortName/aas:langStringShortNameTypeIec61360', node);
        if (shortName && shortName.length > 0) {
            dataSpecification.shortName = shortName;
        }

        const unit = this.readTextContent('./aas:unit', node);
        if (unit) {
            dataSpecification.unit = unit;
        }

        const unitId = this.readReference(this.selectNode('./aas:unitId', node));
        if (unitId) {
            dataSpecification.unitId = unitId;
        }

        const sourceOfDefinition = this.readTextContent('./aas:sourceOfDefinition', node);
        if (sourceOfDefinition) {
            dataSpecification.sourceOfDefinition = sourceOfDefinition;
        }

        const symbol = this.readTextContent('./aas:symbol', node);
        if (symbol) {
            dataSpecification.symbol = symbol;
        }

        const dataType = this.readTextContent('./aas:dataType', node) as aas.DataTypeIec61360;
        if (dataType) {
            dataSpecification.dataType = dataType;
        }

        const definition = this.readLangStrings('./aas:definition/aas:langStringDefinitionTypeIec61360', node);
        if (definition && definition.length > 0) {
            dataSpecification.definition = definition;
        }

        const valueFormat = this.readTextContent('./aas:valueFormat', node);
        if (valueFormat) {
            dataSpecification.valueFormat = valueFormat;
        }

        const valueList = this.readValueList(this.selectNode('./aas:valueList/aas:valueReferencePairs', node));
        if (valueList) {
            dataSpecification.valueList = valueList;
        }

        const value = this.readTextContent('./aas:value', node);
        if (value) {
            dataSpecification.value = value;
        }

        const levelType = this.selectNode('./aas:levelType', node);
        if (levelType) {
            dataSpecification.levelType = {
                min: toBoolean(this.getTextContent('./min', levelType)),
                max: toBoolean(this.getTextContent('./max', levelType)),
                nom: toBoolean(this.getTextContent('./nom', levelType)),
                typ: toBoolean(this.getTextContent('./typ', levelType)),
            };
        }

        return dataSpecification;
    }

    private readValueList(node: Element | undefined): aas.ValueList | undefined {
        if (!node) {
            return undefined;
        }

        const valueReferencePairs: aas.ValueReferencePair[] = [];
        for (const child of this.selectNodes('./aas:valueReferencePair', node)) {
            valueReferencePairs.push(this.readReferenceValuePairs(child));
        }

        const value: aas.ValueList = {
            valueReferencePairs,
        };

        return value;
    }

    private readReferenceValuePairs(node: Element): aas.ValueReferencePair {
        const value = this.readTextContent('./aas:value', node);
        if (!value) {
            throw new Error('ValueReferencePair.value');
        }

        const valueId = this.readReference(this.selectNode('./aas:valueId', node));
        if (!valueId) {
            throw new Error('ValueReferencePair.valueId');
        }

        const pair: aas.ValueReferencePair = {
            value: value,
            valueId: valueId,
        };

        return pair;
    }

    private readQualifiable(node: Element): aas.Qualifiable {
        const qualifiable: aas.Qualifiable = {};
        const qualifiers = this.readQualifiers('./aas:qualifiers/aas:qualifier', node);
        if (qualifiers) {
            qualifiable.qualifiers = qualifiers;
        }

        return qualifiable;
    }

    private readQualifiers(path: string, parent: Element): aas.Qualifier[] | undefined {
        const qualifiers: aas.Qualifier[] = [];
        for (const node of this.selectNodes(path, parent)) {
            qualifiers.push(this.readQualifier(node));
        }

        if (qualifiers.length === 0) {
            return undefined;
        }

        return qualifiers;
    }

    private readQualifier(node: Element): aas.Qualifier {
        const type = this.getTextContent('./aas:type', node);
        const valueType = this.getTextContent('./aas:valueType', node) as aas.DataTypeDefXsd;
        const qualifier: aas.Qualifier = {
            type,
            valueType,
        };

        const kind = this.readTextContent('./aas:kind', node) as aas.QualifierKind;
        if (kind) {
            qualifier.kind = kind;
        }

        const value = this.readTextContent('./aas:value', node);
        if (value != null) {
            qualifier.value = value;
        }

        const valueId = this.readReference(this.selectNode('./aas:valueId', node));
        if (valueId) {
            qualifier.valueId = valueId;
        }

        return qualifier;
    }

    private readReference(node: Element | undefined): aas.Reference | undefined {
        if (!node) {
            return undefined;
        }

        const reference: aas.Reference = {
            type: this.getTextContent('./aas:type', node) as aas.ReferenceTypes,
            keys: [],
        };

        for (const keyNode of this.selectNodes('./aas:keys/aas:key', node)) {
            const key = this.readKey(keyNode);
            if (!key) {
                return undefined;
            }

            reference.keys.push(key);
        }

        return reference;
    }

    private readReferences(expression: string, parent: Element): aas.Reference[] {
        const references: aas.Reference[] = [];
        for (const node of this.selectNodes(expression, parent)) {
            const reference = this.readReference(node);
            if (reference) {
                references.push(reference);
            }
        }

        return references;
    }

    private readAdministrativeInformation(node: Element | undefined): aas.AdministrativeInformation | undefined {
        if (!node) {
            return undefined;
        }

        const value: aas.AdministrativeInformation = {
            ...this.readHasDataSpecification(node),
        };

        const version = this.readTextContent('./aas:version', node);
        if (version) {
            value.version = version;
        }
        const revision = this.readTextContent('./aas:revision', node);
        if (revision) {
            value.revision = revision;
        }

        return value;
    }

    private readLangStrings(expression: string, node: Element | undefined): aas.LangString[] | undefined {
        if (!node) {
            return undefined;
        }

        const values: aas.LangString[] = [];
        for (const child of this.selectNodes(expression, node)) {
            values.push({
                language: this.getTextContent('./aas:language', child, ''),
                text: this.getTextContent('./aas:text', child, ''),
            });
        }

        if (values.length === 0) {
            return undefined;
        }

        return values;
    }

    private readConceptDescriptions(): aas.ConceptDescription[] {
        const conceptDescriptions: aas.ConceptDescription[] = [];
        for (const node of this.selectNodes(
            '/aas:environment/aas:conceptDescriptions/aas:conceptDescription',
            this.document,
        )) {
            conceptDescriptions.push(this.readConceptDescription(node));
        }

        return conceptDescriptions;
    }

    private readConceptDescription(node: Element): aas.ConceptDescription {
        const conceptDescription: aas.ConceptDescription = {
            ...this.readIdentifiable(node),
            ...this.readHasDataSpecification(node),
        };

        const isCaseOf: aas.Reference[] = [];
        for (const refNode of this.selectNodes('./aas:isCaseOf/aas:reference', node)) {
            isCaseOf.push(this.readReference(refNode)!);
        }

        if (isCaseOf.length > 0) {
            conceptDescription.isCaseOf = isCaseOf;
        }

        return conceptDescription;
    }

    private getModelTypeFromLocalName(node: Element): aas.ModelType {
        switch (node.localName.toLowerCase()) {
            case 'annotatedrelationshipelement':
                return 'AnnotatedRelationshipElement';
            case 'assetadministrationshell':
                return 'AssetAdministrationShell';
            case 'basiceventelement':
                return 'BasicEventElement';
            case 'blob':
                return 'Blob';
            case 'capability':
                return 'Capability';
            case 'conceptdescription':
                return 'ConceptDescription';
            case 'dataspecificationiec61360':
                return 'DataSpecificationIec61360';
            case 'entity':
                return 'Entity';
            case 'file':
                return 'File';
            case 'multilanguageproperty':
                return 'MultiLanguageProperty';
            case 'operation':
                return 'Operation';
            case 'property':
                return 'Property';
            case 'range':
                return 'Range';
            case 'referenceelement':
                return 'ReferenceElement';
            case 'relationshipelement':
                return 'RelationshipElement';
            case 'submodel':
                return 'Submodel';
            case 'submodelelementcollection':
                return 'SubmodelElementCollection';
            case 'submodelelementlist':
                return 'SubmodelElementList';
            default:
                throw new Error(`"${node.localName}" is an invalid model type.`);
        }
    }

    private selectNode(expression: string, node: Node): Element | undefined {
        const value = this.select(expression, node, true);
        if (value === null) {
            return undefined;
        }

        return value as Element;
    }

    private selectNodes(query: string, node: Node): Element[] {
        const values = this.select(query, node);
        return Array.isArray(values) ? (values as Element[]) : [];
    }

    private readTextContent(expression: string, node: Element): string | undefined {
        const value = (this.select(expression, node, true) as Node)?.textContent;
        if (value == null) {
            return undefined;
        }

        return value;
    }

    private getTextContent(expression: string, node: Element, defaultValue?: string): string {
        const value = this.readTextContent(expression, node) ?? defaultValue;
        if (value === undefined) {
            throw new Error(`${expression} has no valid text content.`);
        }

        return value;
    }

    private readKey(node: Element): aas.Key | undefined {
        const type = this.getTextContent('./aas:type', node) as aas.KeyTypes;
        const value = this.getTextContent('./aas:value', node);
        if (!type || !value) {
            return undefined;
        }

        return { type, value };
    }
}
