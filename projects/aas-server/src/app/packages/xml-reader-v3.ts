/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { aas, determineType, extensionToMimeType, toBoolean } from 'aas-core';
import { useNamespaces, XPathSelect } from 'xpath';
import { DOMParser } from '@xmldom/xmldom';
import { AASReader } from './aas-reader.js';
import { HTMLDocumentElement } from '../types/html-document-element.js';

export class XmlReaderV3 extends AASReader {
    private readonly select: XPathSelect;
    private readonly document: Document;

    public constructor(xmlSource: string | Document) {
        super();

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
            if (uri === 'https://admin-shell.io/aas/3/0') {
                namespaces['aas'] = uri;
            }
        }

        return namespaces;
    }

    private readAssetInformation(node: Node): aas.AssetInformation {
        const asset = this.selectNode('/aas:assetInformation', node);
        if (!asset) {
            return { assetKind: 'Instance' };
        }

        const value: aas.AssetInformation = {
            assetKind: this.getTextContent('./aas:kind', asset) as aas.AssetKind,
        };

        const globalAssetId = this.selectTextContent('./aas:identification', asset);
        if (globalAssetId) {
            value.globalAssetId = globalAssetId;
        }

        const assetType = this.selectTextContent('./aas:assetKind', asset);
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

    private readResource(node: Node | undefined): aas.Resource | undefined {
        if (!node) {
            return undefined;
        }

        const value: aas.Resource = {
            path: this.getTextContent('./aas:path', node),
        };

        const contentType = this.selectTextContent('./aas:contentType', node);
        if (contentType) {
            value.contentType = contentType;
        }

        return value;
    }

    private readSpecificAssetIds(node: Node | undefined): aas.SpecificAssetId[] | undefined {
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

    private readSpecificAssetId(node: Node | undefined): aas.SpecificAssetId | undefined {
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

    private readAssetAdministrationShell(node: Node): aas.AssetAdministrationShell {
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

    private readSubmodel(node: Node): aas.Submodel {
        const submodel: aas.Submodel = {
            ...this.readIdentifiable(node),
            ...this.readHasSemantics(node),
            ...this.readQualifiable(node),
            ...this.readHasKind(node),
            ...this.readHasDataSpecification(node),
        };

        const submodelElements = this.readSubmodelElements(node, {
            type: 'ModelReference',
            keys: [
                {
                    type: 'Submodel',
                    value: submodel.id,
                },
            ],
        });

        if (submodelElements.length > 0) {
            submodel.submodelElements = submodelElements;
        }

        return submodel;
    }

    private readSubmodelElements(node: Node, parent: aas.Reference): aas.SubmodelElement[] {
        const submodelElements: aas.SubmodelElement[] = [];
        for (const child of this.selectNodes('./aas:submodelElements/*', node)) {
            submodelElements.push(this.readSubmodelElement(child, parent));
        }

        return submodelElements;
    }

    private readSubmodelElement(node: Node, parent: aas.Reference): aas.SubmodelElement {
        let submodelElement: aas.SubmodelElement;
        const modelType = this.getModelTypeFromLocalName(node);
        switch (modelType) {
            case 'AnnotatedRelationshipElement':
                submodelElement = this.readAnnotatedRelationshipElement(node, parent);
                break;
            case 'BasicEventElement':
                submodelElement = this.readBasicEventElement(node, parent);
                break;
            case 'Blob':
                submodelElement = this.readBlob(node, parent);
                break;
            case 'Entity':
                submodelElement = this.readEntity(node, parent);
                break;
            case 'File':
                submodelElement = this.readFile(node, parent);
                break;
            case 'MultiLanguageProperty':
                submodelElement = this.readMultiLanguageProperty(node, parent);
                break;
            case 'Operation':
                submodelElement = this.readOperation(node, parent);
                break;
            case 'Property':
                submodelElement = this.readProperty(node, parent);
                break;
            case 'Range':
                submodelElement = this.readRange(node, parent);
                break;
            case 'ReferenceElement':
                submodelElement = this.readReferenceElement(node, parent);
                break;
            case 'RelationshipElement':
                submodelElement = this.readRelationshipElement(node, parent);
                break;
            case 'SubmodelElementCollection':
                submodelElement = this.readSubmodelElementCollection(node, parent);
                break;
            case 'SubmodelElementList':
                submodelElement = this.readSubmodelElementList(node, parent);
                break;
            default:
                submodelElement = this.readSubmodelElementType(node, parent);
                break;
        }

        return submodelElement;
    }

    private readAnnotatedRelationshipElement(node: Node, parent: aas.Reference): aas.AnnotatedRelationshipElement {
        const base = this.readSubmodelElementType(node, parent);
        const first = this.readReference(this.selectNode('./aas:first', node));
        if (!first) {
            throw new Error('RelationshipElement.first');
        }

        const second = this.readReference(this.selectNode('./aas:second', node));
        if (!second) {
            throw new Error('RelationshipElement.second');
        }

        const annotations = this.readAnnotations(node, this.createReference(parent, base));

        return {
            ...base,
            first,
            second,
            annotations,
        };
    }

    private readAnnotations(node: Node, parent: aas.Reference): aas.DataElement[] {
        const dataElements: aas.DataElement[] = [];
        for (const child of this.selectNodes('./aas:annotations/*', node)) {
            const dataElement = this.readDataElement(child, parent);
            if (dataElement) {
                dataElements.push(dataElement);
            }
        }

        return dataElements;
    }

    private readDataElement(node: Node, parent: aas.Reference): aas.DataElement | undefined {
        let dataElement: aas.DataElement | undefined;
        const modelType = this.getModelTypeFromLocalName(node);
        switch (modelType) {
            case 'Blob':
                dataElement = this.readBlob(node, parent);
                break;
            case 'File':
                dataElement = this.readFile(node, parent);
                break;
            case 'MultiLanguageProperty':
                dataElement = this.readMultiLanguageProperty(node, parent);
                break;
            case 'Property':
                dataElement = this.readProperty(node, parent);
                break;
            case 'Range':
                dataElement = this.readRange(node, parent);
                break;
            case 'ReferenceElement':
                dataElement = this.readReferenceElement(node, parent);
                break;
            default:
                break;
        }

        return dataElement;
    }

    private readBasicEventElement(node: Node, parent: aas.Reference): aas.BasicEventElement {
        const observed = this.readReference(this.selectNode('./aas:observed', node));
        if (!observed) {
            throw new Error('BasicEventElement.observed');
        }

        const direction = this.selectTextContent('./aas:direction', node) as aas.Direction | undefined;
        if (!direction) {
            throw new Error('BasicEventElement.direction');
        }

        const state = this.selectTextContent('./aas:state', node) as aas.StateOfEvent | undefined;
        if (!state) {
            throw new Error('BasicEventElement.state');
        }

        const basicEvent: aas.BasicEventElement = {
            ...this.readSubmodelElementType(node, parent),
            observed,
            direction,
            state,
        };

        const messageTopic = this.selectTextContent('./aas:messageTopic', node);
        if (messageTopic) {
            basicEvent.messageTopic = messageTopic;
        }

        const messageBroker = this.readReference(this.selectNode('./aas:messageBroker', node));
        if (messageBroker) {
            basicEvent.messageBroker = messageBroker;
        }

        const lastUpdate = this.selectTextContent('./aas:lastUpdate', node);
        if (lastUpdate) {
            basicEvent.lastUpdate = lastUpdate;
        }

        const minInterval = this.selectTextContent('./aas:minInterval', node);
        if (minInterval) {
            basicEvent.minInterval = minInterval;
        }

        const maxInterval = this.selectTextContent('./aas:maxInterval', node);
        if (maxInterval) {
            basicEvent.maxInterval = maxInterval;
        }

        return basicEvent;
    }

    private readEntity(node: Node, parent: aas.Reference): aas.Entity {
        const entityType = this.selectNode('./aas:entityType', node)?.textContent as aas.EntityType;
        if (!entityType) {
            throw new Error('File.contentType');
        }

        const entity: aas.Entity = {
            ...this.readSubmodelElementType(node, parent),
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

        const statements = this.readStatements(node, this.createReference(parent, entity));
        if (statements.length > 0) {
            entity.statements = statements;
        }

        return entity;
    }

    private readStatements(node: Node, parent: aas.Reference): aas.SubmodelElement[] {
        const statements: aas.SubmodelElement[] = [];
        for (const child of this.selectNodes('./aas:statements/*', node)) {
            statements.push(this.readSubmodelElement(child, parent));
        }

        return statements;
    }

    private readBlob(node: Node, parent: aas.Reference): aas.Blob {
        const contentType = this.selectNode('./aas:contentType', node)?.textContent;
        if (!contentType) {
            throw new Error('File.contentType');
        }

        const blob: aas.Blob = {
            ...this.readSubmodelElementType(node, parent),
            contentType,
        };

        const value = this.selectNode('./aas:value', node)?.textContent;
        if (value) {
            blob.value = value;
        }

        return blob;
    }

    private readSubmodelElementCollection(node: Node, parent: aas.Reference): aas.SubmodelElementCollection {
        const base = this.readSubmodelElementType(node, parent);
        const collection: aas.SubmodelElementCollection = {
            ...base,
            value: this.readCollectionValue(node, this.createReference(parent, base)),
        };

        return collection;
    }

    private readSubmodelElementList(node: Node, parent: aas.Reference): aas.SubmodelElementList {
        const base = this.readSubmodelElementType(node, parent);
        const list: aas.SubmodelElementList = {
            ...base,
            value: this.readCollectionValue(node, this.createReference(parent, base)),
            typeValueListElement: this.getTextContent('./aas:typeValueListElement', node) as aas.AASSubmodelElements,
        };

        return list;
    }

    private readCollectionValue(node: Node, parent: aas.Reference): aas.SubmodelElement[] {
        const submodelElements: aas.SubmodelElement[] = [];
        for (const child of this.selectNodes('./aas:value/*', node)) {
            submodelElements.push(this.readSubmodelElement(child, parent));
        }

        return submodelElements;
    }

    private readProperty(node: Node, parent: aas.Reference): aas.Property {
        const valueNode = this.selectNode('./aas:value', node);
        let value = valueNode?.textContent;

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
            value = '!!! Undefined value type !!!';
        }

        const property: aas.Property = { ...this.readSubmodelElementType(node, parent), valueType };
        if (value) {
            property.value = value;
        }

        return property;
    }

    private readRange(node: Node, parent: aas.Reference): aas.Range {
        const range: aas.Range = {
            ...this.readSubmodelElementType(node, parent),
            valueType: this.getTextContent('./aas:valueType', node) as aas.DataTypeDefXsd,
        };

        const min = this.selectTextContent('./aas:min', node);
        if (min) {
            range.min = min;
        }

        const max = this.selectTextContent('./aas:max', node);
        if (max) {
            range.max = max;
        }

        return range;
    }

    private readRelationshipElement(node: Node, parent: aas.Reference): aas.RelationshipElement {
        const first = this.readReference(this.selectNode('./aas:first', node));
        if (!first) {
            throw new Error('RelationshipElement.first');
        }

        const second = this.readReference(this.selectNode('./aas:second', node));
        if (!second) {
            throw new Error('RelationshipElement.second');
        }

        return {
            ...this.readSubmodelElementType(node, parent),
            first,
            second,
        };
    }

    private readFile(node: Node, parent: aas.Reference): aas.File {
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
            ...this.readSubmodelElementType(node, parent),
            contentType,
        };

        if (value) {
            file.value = value;
        }

        return file;
    }

    private readMultiLanguageProperty(node: Node, parent: aas.Reference): aas.MultiLanguageProperty {
        const value = this.readLangStrings('./aas:value', node) ?? [];
        return { ...this.readSubmodelElementType(node, parent), value };
    }

    private readOperation(node: Node, parent: aas.Reference): aas.Operation {
        const operation: aas.Operation = {
            ...this.readSubmodelElementType(node, parent),
        };

        const inputVariablesElement = this.selectNode('./aas:inputVariables', node);
        if (inputVariablesElement) {
            const inputVariables = this.readOperationVariables(
                inputVariablesElement,
                this.createReference(parent, operation),
            );

            if (inputVariables) {
                operation.inputVariables = inputVariables;
            }
        }

        const inoutputVariablesElement = this.selectNode('./aas:inoutputVariables', node);
        if (inoutputVariablesElement) {
            const inoutputVariables = this.readOperationVariables(
                inoutputVariablesElement,
                this.createReference(parent, operation),
            );

            if (inoutputVariables) {
                operation.inoutputVariables = inoutputVariables;
            }
        }

        const outputVariablesElement = this.selectNode('./aas:outputVariables', node);
        if (outputVariablesElement) {
            const outputVariables = this.readOperationVariables(
                outputVariablesElement,
                this.createReference(parent, operation),
            );

            if (outputVariables) {
                operation.outputVariables = outputVariables;
            }
        }

        return operation;
    }

    private readOperationVariables(node: Node, parent: aas.Reference): aas.OperationVariable[] {
        const variables: aas.OperationVariable[] = [];
        for (const element of this.selectNodes('./aas:operationVariable', node)) {
            const variable = this.readOperationVariable(element, parent);
            if (variable) {
                variables.push(variable);
            }
        }

        return variables;
    }

    private readOperationVariable(node: Node, parent: aas.Reference): aas.OperationVariable | undefined {
        for (const element of this.selectNodes('./aas:value/*', node)) {
            return { value: this.readSubmodelElement(element, parent) };
        }

        return undefined;
    }

    private readReferenceElement(node: Node, parent: aas.Reference): aas.ReferenceElement {
        const reference: aas.ReferenceElement = {
            ...this.readSubmodelElementType(node, parent),
        };

        const value = this.readReference(this.selectNode('./aas:value', node));
        if (value) {
            reference.value = value;
        }

        return reference;
    }

    private readSubmodelElementType(node: Node, parent: aas.Reference): aas.SubmodelElement {
        return {
            ...this.readReferable(node, undefined, parent),
            ...this.readHasSemantics(node),
            ...this.readHasKind(node),
            ...this.readHasDataSpecification(node),
            ...this.readQualifiable(node),
        };
    }

    private readIdentifiable(node: Node): aas.Identifiable {
        const id = this.getTextContent('./aas:id', node);
        const identifiable: aas.Identifiable = { ...this.readReferable(node, id, undefined), id };

        const administration = this.readAdministrativeInformation(this.selectNode('./aas:administration', node));
        if (administration) {
            identifiable.administration = administration;
        }

        return identifiable;
    }

    private readReferable(node: Node, id: string | undefined, parent: aas.Reference | undefined): aas.Referable {
        let idShort = this.selectTextContent('./aas:idShort', node);
        if (!idShort) {
            idShort = id ? this.createIdShort(id) : '';
        }

        const referable: aas.Referable = {
            ...this.readHasExtensions(node),
            idShort,
            modelType: this.getModelTypeFromLocalName(node),
        };

        if (parent) {
            referable.parent = parent;
        }

        const category = this.selectTextContent('./aas:category', node);
        if (category) {
            referable.category = category;
        }

        return referable;
    }

    private readHasExtensions(node: Node): aas.HasExtensions {
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

    private readExtension(node: Node): aas.Extension {
        const extension: aas.Extension = {
            ...this.readHasSemantics(node),
            name: this.getTextContent('./aas:name', node),
        };

        return extension;
    }

    private readHasSemantics(node: Node): aas.HasSemantics {
        const semanticId = this.readReference(this.selectNode('./aas:semanticId', node));
        return semanticId ? { semanticId } : {};
    }

    private readHasKind(node: Node): aas.HasKind {
        let kind = this.selectNode('./aas:kind', node)?.textContent as aas.ModellingKind;
        if (!kind) {
            kind = 'Instance';
        }

        return { kind };
    }

    private readHasDataSpecification(node: Node): aas.HasDataSpecification {
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

    private readEmbeddedDataSpecification(node: Node): aas.EmbeddedDataSpecification {
        let dataSpecification = this.readReference(this.selectNode('./aas:dataSpecification', node));
        if (!dataSpecification) {
            dataSpecification = { type: 'ModelReference', keys: [] };
        }

        const dataSpecificationContent = this.readDataSpecificationContent(node);
        if (!dataSpecificationContent) {
            throw new Error('EmbeddedDataSpecification.dataSpecificationContent');
        }

        const value: aas.EmbeddedDataSpecification = {
            dataSpecification: dataSpecification,
            dataSpecificationContent: dataSpecificationContent,
        };

        return value;
    }

    private readDataSpecificationContent(node: Node): aas.DataSpecificationContent | undefined {
        const child = this.selectNode('./aas:dataSpecificationContent/aas:dataSpecificationIec61360', node);
        if (child) {
            return this.readDataSpecificationIec61360(child);
        }

        return undefined;
    }

    private readDataSpecificationIec61360(node: Node): aas.DataSpecificationIec61360 {
        const preferredName = this.readLangStrings('./aas:preferredName/aas:langStringPreferredNameTypeIec61360', node);
        if (!preferredName) {
            throw new Error('DataSpecificationIec61360Content.preferredName');
        }

        const dataSpecification: aas.DataSpecificationIec61360 = {
            modelType: this.getModelTypeFromLocalName(node),
            preferredName,
        };

        const shortName = this.readLangStrings('./aas:shortName/aas:langStringShortNameTypeIec61360', node);
        if (shortName && shortName.length > 0) {
            dataSpecification.shortName = shortName;
        }

        const unit = this.selectTextContent('./aas:unit', node);
        if (unit) {
            dataSpecification.unit = unit;
        }

        const unitId = this.readReference(this.selectNode('./aas:unitId', node));
        if (unit) {
            dataSpecification.unitId = unitId;
        }

        const sourceOfDefinition = this.selectTextContent('./aas:sourceOfDefinition', node);
        if (sourceOfDefinition) {
            dataSpecification.sourceOfDefinition = sourceOfDefinition;
        }

        const symbol = this.selectTextContent('./aas:symbol', node);
        if (symbol) {
            dataSpecification.symbol = symbol;
        }

        const dataType = this.selectTextContent('./aas:dataType', node) as aas.DataTypeIec61360;
        if (dataType) {
            dataSpecification.dataType = dataType;
        }

        const definition = this.readLangStrings('./aas:definition/aas:langStringDefinitionTypeIec61360', node);
        if (definition && definition.length > 0) {
            dataSpecification.definition = definition;
        }

        const valueFormat = this.selectTextContent('./aas:valueFormat', node);
        if (valueFormat) {
            dataSpecification.valueFormat = valueFormat;
        }

        const valueList = this.readValueList(this.selectNode('./aas:valueList/aas:valueReferencePairs', node));
        if (valueList) {
            dataSpecification.valueList = valueList;
        }

        const value = this.selectTextContent('./aas:value', node);
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

    private readValueList(node: Node | undefined): aas.ValueList | undefined {
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

    private readReferenceValuePairs(node: Node): aas.ValueReferencePair {
        const value = this.selectTextContent('./aas:value', node);
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

    private readQualifiable(node: Node): aas.Qualifiable {
        const qualifiable: aas.Qualifiable = {};
        const qualifiers = this.readQualifiers('./aas:qualifiers/aas:qualifier', node);
        if (qualifiers) {
            qualifiable.qualifiers = qualifiers;
        }

        return qualifiable;
    }

    private readQualifiers(path: string, parent: Node): aas.Qualifier[] | undefined {
        const qualifiers: aas.Qualifier[] = [];
        for (const node of this.selectNodes(path, parent)) {
            qualifiers.push(this.readQualifier(node));
        }

        if (qualifiers.length === 0) {
            return undefined;
        }

        return qualifiers;
    }

    private readQualifier(node: Node): aas.Qualifier {
        const type = this.getTextContent('./aas:type', node);
        const valueType = this.getTextContent('./aas:valueType', node) as aas.DataTypeDefXsd;
        const qualifier: aas.Qualifier = {
            type,
            valueType,
        };

        const kind = this.selectTextContent('./aas:kind', node) as aas.QualifierKind;
        if (kind) {
            qualifier.kind = kind;
        }

        const value = this.selectTextContent('./aas:value', node);
        if (value != null) {
            qualifier.value = value;
        }

        const valueId = this.readReference(this.selectNode('./valueId', node));
        if (valueId) {
            qualifier.valueId = valueId;
        }

        return qualifier;
    }

    private readReference(node: Node | undefined): aas.Reference | undefined {
        if (!node) {
            return undefined;
        }

        const reference: aas.Reference = {
            type: this.getTextContent('./aas:type', node) as aas.ReferenceTypes,
            keys: [],
        };

        for (const keyNode of this.selectNodes('./aas:keys/aas:key', node)) {
            reference.keys.push(this.getKey(keyNode));
        }

        return reference;
    }

    private readReferences(expression: string, parent: Node): aas.Reference[] {
        const references: aas.Reference[] = [];
        for (const node of this.selectNodes(expression, parent)) {
            const reference = this.readReference(node);
            if (reference) {
                references.push(reference);
            }
        }

        return references;
    }

    private readAdministrativeInformation(node: Node | undefined): aas.AdministrativeInformation | undefined {
        if (!node) {
            return undefined;
        }

        const value: aas.AdministrativeInformation = {
            ...this.readHasDataSpecification(node),
        };

        const version = this.selectTextContent('./aas:version', node);
        if (version) {
            value.version = version;
        }
        const revision = this.selectTextContent('./aas:revision', node);
        if (revision) {
            value.revision = revision;
        }

        return value;
    }

    private readLangStrings(expression: string, node: Node | undefined): aas.LangString[] | undefined {
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

    private readConceptDescription(node: Node): aas.ConceptDescription {
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

    private getModelTypeFromLocalName(node: Node): aas.ModelType {
        const localName: string = (node as Element).localName;
        return (localName.charAt(0).toUpperCase() + localName.substring(1)) as aas.ModelType;
    }

    private selectNode(expression: string, node: Node): Node | undefined {
        return this.select(expression, node, true) as Node | undefined;
    }

    private selectTextContent(expression: string, node: Node): string | null | undefined {
        return (this.select(expression, node, true) as Node)?.textContent;
    }

    private getTextContent(expression: string, node: Node, defaultValue?: string): string {
        let value = (this.select(expression, node, true) as Node)?.textContent;
        if (value == null) {
            if (defaultValue == null) {
                throw new Error(`${expression} ToDo.`);
            }

            value = defaultValue;
        }

        return value;
    }

    private selectNodes(query: string, node: Node): Node[] {
        return this.select(query, node) as Node[];
    }

    private getKey(node: Node): aas.Key {
        return {
            type: this.getTextContent('./aas:type', node) as aas.KeyTypes,
            value: this.getTextContent('./aas:value', node, ''),
        };
    }
}
