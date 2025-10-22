/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { aas, determineType, noop, toBoolean } from 'aas-core';
import { useNamespaces, XPathSelect } from 'xpath';
import { DOMParser } from '@xmldom/xmldom';
import { AASReader } from '../aas-reader.js';
import { HTMLDocumentElement } from '../types.js';

export class XmlReaderV2 extends AASReader {
    private readonly select: XPathSelect;
    private readonly document: Document;
    private iec61360 = 'IEC61360';

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
    public read(data: unknown): aas.Referable {
        throw new Error('Not implemented.');
    }

    private getNamespaces(): { [key: string]: string } {
        const nsMap = (this.document.documentElement as HTMLDocumentElement)._nsMap ?? {};
        const namespaces: { [key: string]: string } = {};
        for (const prefix in nsMap) {
            const uri = nsMap[prefix];
            if (uri.startsWith('http://www.admin-shell.io/IEC61360/')) {
                this.iec61360 = prefix;
                namespaces[prefix] = uri;
            } else if (uri.startsWith('http://www.admin-shell.io/aas/')) {
                namespaces['aas'] = uri;
            }
        }

        return namespaces;
    }

    private readAssetInformation(): aas.AssetInformation {
        let assetKind: aas.AssetKind | undefined;
        let globalAssetId: string | undefined;
        const node = this.selectNode('/aas:aasenv/aas:assets/aas:asset', this.document);
        if (node) {
            assetKind = this.selectNode('./aas:kind', node)?.textContent as aas.AssetKind;
            globalAssetId = this.readIdentifier(node);
        } else {
            assetKind = 'Instance';
        }

        return { assetKind, globalAssetId };
    }

    private readAssetAdministrationShells(): aas.AssetAdministrationShell[] {
        const shells: aas.AssetAdministrationShell[] = [];
        for (const node of this.selectNodes(
            '/aas:aasenv/aas:assetAdministrationShells/aas:assetAdministrationShell',
            this.document,
        )) {
            const shell = this.readAssetAdministrationShell(node);
            shells.push(shell);
        }

        return shells;
    }

    private readAssetAdministrationShell(node: Element): aas.AssetAdministrationShell {
        const assetInformation = this.readAssetInformation();
        if (!assetInformation) {
            throw new Error('AssetAdministrationShell.asset');
        }

        const shell: aas.AssetAdministrationShell = {
            ...this.readIdentifiable(node),
            ...this.readHasDataSpecification(node),
            assetInformation,
        };

        const submodels = this.readReferences('./aas:submodelRefs/aas:submodelRef', node);
        if (submodels.length > 0) {
            shell.submodels = submodels;
        }

        const administration = this.readAdministrationInformation('./aas:administration', node);
        if (administration) {
            shell.administration = administration;
        }

        return shell;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private readAdministrationInformation(path: string, node: Element): aas.AdministrativeInformation | undefined {
        return undefined;
    }

    private readSubmodels(): aas.Submodel[] {
        const submodels: aas.Submodel[] = [];
        for (const node of this.selectNodes('/aas:aasenv/aas:submodels/aas:submodel', this.document)) {
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
        for (const child of this.selectNodes('./aas:submodelElements/aas:submodelElement/*[1]', node)) {
            const submodelElement = this.readSubmodelElement(child, ancestors);
            if (submodelElement) {
                submodelElements.push(submodelElement);
            }
        }

        return submodelElements;
    }

    private readCollectionValue(node: Element, ancestors: aas.Referable[]): aas.SubmodelElement[] {
        const submodelElements: aas.SubmodelElement[] = [];
        for (const child of this.selectNodes('./aas:value/aas:submodelElement/*[1]', node)) {
            const submodelElement = this.readSubmodelElement(child, ancestors);
            if (submodelElement) {
                submodelElements.push(submodelElement);
            }
        }

        return submodelElements;
    }

    private readSubmodelElement(node: Element, ancestors: aas.Referable[]): aas.SubmodelElement {
        let submodelElement: aas.SubmodelElement | undefined;
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
            default:
                throw new Error(`Model type "${modelType}" is not supported.`);
        }

        return submodelElement;
    }

    private readAnnotatedRelationshipElement(
        node: Element,
        ancestors: aas.Referable[],
    ): aas.AnnotatedRelationshipElement {
        noop(node, ancestors);
        throw new Error('Method not implemented.');
    }

    private readBasicEventElement(node: Element, ancestors: aas.Referable[]): aas.BasicEventElement {
        noop(node, ancestors);
        throw new Error('Method not implemented.');
    }

    private readBlob(node: Element, ancestors: aas.Referable[]): aas.Blob {
        const contentType = this.selectNode('./aas:mimeType', node)?.textContent;
        if (!contentType) {
            throw new Error('File.mimetype');
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
            const se = this.selectNode('./*[1]', child);
            if (se) {
                const submodelElement = this.readSubmodelElement(se, ancestors);
                if (submodelElement) {
                    statements.push(submodelElement);
                }
            }
        }

        return statements;
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

        const externalSubjectId = this.readReference('./aas:externalSubjectId', node);
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

    private readSubmodelElementCollection(node: Element, ancestors: aas.Referable[]): aas.SubmodelElementCollection {
        const collection: aas.SubmodelElementCollection = this.readSubmodelElementType(node, ancestors);
        const value = this.readCollectionValue(node, [...ancestors, collection]);
        if (value.length > 0) {
            collection.value = value;
        }

        return collection;
    }

    private readProperty(node: Element, ancestors: aas.Referable[]): aas.Property {
        const valueNode = this.selectNode('./aas:value', node);
        let value = valueNode?.textContent;

        const valueTypeNode = this.selectNode('./aas:valueType', node);
        let valueType: aas.DataTypeDefXsd | undefined;
        if (valueTypeNode?.textContent) {
            valueType = this.toDataTypeDefXsd(valueTypeNode.textContent);
        }

        if (!valueType && value != null) {
            valueType = determineType(value);
        }

        if (!valueType) {
            valueType = 'xs:string';
            value = '!!! Undefined value type !!!';
        }

        const property: aas.Property = { ...this.readSubmodelElementType(node, ancestors), valueType };
        if (value) {
            property.value = value;
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
        const first = this.readReference('./aas:first', node);
        if (!first) {
            throw new Error('RelationshipElement.first');
        }

        const second = this.readReference('./aas:second', node);
        if (!second) {
            throw new Error('RelationshipElement.second');
        }

        return {
            ...this.readSubmodelElementType(node, ancestors),
            first,
            second,
        };
    }

    private readFile(node: Element, ancestors: aas.Referable[]): aas.File {
        let contentType = this.selectNode('./aas:mimeType', node)?.textContent;
        if (!contentType) {
            contentType = '';
        }

        const file: aas.File = {
            ...this.readSubmodelElementType(node, ancestors),
            contentType,
        };

        const value = this.selectNode('./aas:value', node)?.textContent;
        if (value) {
            file.value = value;
        }

        return file;
    }

    private readMultiLanguageProperty(node: Element, ancestors: aas.Referable[]): aas.MultiLanguageProperty {
        const langString = this.readLangString('./aas:value', node) ?? [];
        return { ...this.readSubmodelElementType(node, ancestors), value: langString };
    }

    private readReferenceElement(node: Element, ancestors: aas.Referable[]): aas.ReferenceElement {
        const value = this.getReference(node);
        return { ...this.readSubmodelElementType(node, ancestors), value };
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
        const id = this.readIdentifier(node);
        const identifiable: aas.Identifiable = { ...this.readReferable(node, []), id };
        const administration = this.readAdministrativeInformation(node);
        if (administration) {
            identifiable.administration = administration;
        }

        return identifiable;
    }

    private readReferable(node: Element, ancestors: aas.Referable[]): aas.Referable {
        const idShort = this.selectNode('./aas:idShort', node)?.textContent ?? '';
        const referable: aas.Referable = {
            idShort,
            modelType: this.getModelTypeFromLocalName(node),
        };

        if (ancestors) {
            referable.parent = this.createParentReference(ancestors);
        }

        const category = this.selectNode('./aas:category', node)?.textContent;
        if (category) {
            referable.category = category;
        }

        return referable;
    }

    private readHasSemantics(node: Element): aas.HasSemantics {
        const semanticId = this.readReference('./aas:semanticId', node);
        return semanticId ? { semanticId } : {};
    }

    private readHasKind(node: Element): aas.HasKind {
        let kind = this.selectNode('aas:kind', node)?.textContent as aas.ModellingKind;
        if (!kind) {
            kind = 'Instance';
        }

        return { kind };
    }

    private readHasDataSpecification(node: Element): aas.HasDataSpecification {
        const embeddedDataSpecifications: aas.EmbeddedDataSpecification[] = [];
        for (const child of this.selectNodes('./aas:embeddedDataSpecification', node)) {
            const dataSpecification =
                this.readReference('./aas:hasDataSpecification', child) ??
                this.readReference('./aas:dataSpecification', child);

            if (!dataSpecification) {
                throw new Error('EmbeddedDataSpecification.dataSpecification');
            }

            const dataSpecificationContent = this.readDataSpecificationContent(child);
            if (dataSpecificationContent) {
                embeddedDataSpecifications.push({ dataSpecification, dataSpecificationContent });
            }
        }

        return embeddedDataSpecifications.length > 0 ? { embeddedDataSpecifications } : {};
    }

    private readDataSpecificationContent(ancestors: Element): aas.DataSpecificationContent | undefined {
        const node = this.selectNode('./aas:dataSpecificationContent/aas:dataSpecificationIEC61360', ancestors);
        if (node) {
            return this.readDataSpecificationIec61360(node);
        }

        return undefined;
    }

    private readDataSpecificationIec61360(node: Element): aas.DataSpecificationIec61360 {
        const preferredName = this.readLangString(`./${this.iec61360}:preferredName`, node);
        if (!preferredName) {
            throw new Error('DataSpecificationIEC61360Content.preferredName');
        }

        const dataSpecification: aas.DataSpecificationIec61360 = {
            modelType: 'DataSpecificationIec61360',
            preferredName,
        };

        const shortName = this.readLangString(`./${this.iec61360}:shortName`, node);
        if (shortName) {
            dataSpecification.shortName = shortName;
        }

        const unit = this.selectNode(`./${this.iec61360}:unit`, node)?.textContent;
        if (unit) {
            dataSpecification.unit = unit;
        }

        const unitId = this.readReference(`./${this.iec61360}:unitId`, node);
        if (unitId) {
            dataSpecification.unitId = unitId;
        }

        const sourceOfDefinition = this.selectNode(`./${this.iec61360}:sourceOfDefinition`, node)?.textContent;
        if (sourceOfDefinition) {
            dataSpecification.sourceOfDefinition = sourceOfDefinition;
        }

        const symbol = this.selectNode(`./${this.iec61360}:symbol`, node)?.textContent;
        if (symbol) {
            dataSpecification.symbol = symbol;
        }

        const dataType = this.selectNode(`./${this.iec61360}:dataType`, node)?.textContent as aas.DataTypeIec61360;
        if (dataType) {
            dataSpecification.dataType = dataType;
        }

        const definition = this.readLangString(`./${this.iec61360}:definition`, node);
        if (definition) {
            dataSpecification.definition = definition;
        }

        const valueFormat = this.selectNode(`./${this.iec61360}:valueFormat`, node)?.textContent;
        if (valueFormat) {
            dataSpecification.valueFormat = valueFormat;
        }

        const valueList = this.readValueList(`./${this.iec61360}:valueList`, node);
        if (valueList) {
            dataSpecification.valueList = valueList;
        }

        const value = this.selectNode(`./${this.iec61360}:value`, node)?.textContent;
        if (value) {
            dataSpecification.value = value;
        }

        const levelType = this.selectNode(`./${this.iec61360}:levelType`, node);
        if (levelType) {
            dataSpecification.levelType = {
                min: toBoolean(this.selectNode('./min', levelType)!.textContent),
                max: toBoolean(this.selectNode('./max', levelType)!.textContent),
                nom: toBoolean(this.selectNode('./nom', levelType)!.textContent),
                typ: toBoolean(this.selectNode('./typ', levelType)!.textContent),
            };
        }

        return dataSpecification;
    }

    private readValueList(path: string, node: Element): aas.ValueList | undefined {
        noop(path, node);
        return undefined;
    }

    private readQualifiable(node: Element): aas.Qualifiable {
        const qualifiable: aas.Qualifiable = {};
        const qualifiers = this.readQualifiers('./aas:qualifier/aas:qualifier', node);
        if (qualifiers) {
            qualifiable.qualifiers = qualifiers;
        }

        return qualifiable;
    }

    private readQualifiers(path: string, ancestors: Element): aas.Qualifier[] | undefined {
        const qualifiers: aas.Qualifier[] = [];
        for (const node of this.selectNodes(path, ancestors)) {
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

        const valueId = this.readReference('./valueId', node);
        if (valueId) {
            qualifier.valueId = valueId;
        }

        return qualifier;
    }

    private readReference(path: string, parent: Element): aas.Reference | undefined {
        let reference: aas.Reference | undefined;
        const node = this.selectNode(path, parent);
        if (node) {
            reference = { type: 'ModelReference', keys: [] };
            for (const keyNode of this.selectNodes('./aas:keys/aas:key', node)) {
                const key = this.readKey(keyNode);
                if (!key) {
                    return undefined;
                }

                reference.keys.push(key);
            }
        }

        return reference;
    }

    private readReferences(path: string, parent: Element): aas.Reference[] {
        const references: aas.Reference[] = [];
        for (const node of this.selectNodes(path, parent)) {
            const reference: aas.Reference = { type: 'ModelReference', keys: [] };
            for (const keyNode of this.selectNodes('./aas:keys/aas:key', node)) {
                const key = this.readKey(keyNode);
                if (!key) {
                    break;
                }

                reference.keys.push(key);
            }

            references.push(reference);
        }

        return references;
    }

    private readAdministrativeInformation(node: Element): aas.AdministrativeInformation | undefined {
        let value: aas.AdministrativeInformation | undefined;
        const version = this.selectNode('./aas:administration/aas:version', node)?.textContent;
        const revision = this.selectNode('./aas:administration/aas:revision', node)?.textContent;
        if (version || revision) {
            value = {};
            if (version) {
                value.version = version;
            }

            if (revision) {
                value.revision = revision;
            }
        }

        return value;
    }

    private readLangString(path: string, parent: Element): aas.LangString[] | undefined {
        let langString: aas.LangString[] | undefined;
        const content = this.selectNode(path, parent);
        if (content) {
            langString = [];
            for (const node of this.selectNodes('./aas:langString', content)) {
                const language = (node as Element).getAttribute('lang')!.toLowerCase();
                const text = node.textContent ?? '';
                langString.push({ language, text });
            }

            if (langString.length === 0 && content.textContent) {
                langString.push({ language: 'en', text: content.textContent });
            }
        }

        return langString;
    }

    private readConceptDescriptions(): aas.ConceptDescription[] {
        const conceptDescriptions: aas.ConceptDescription[] = [];
        for (const node of this.selectNodes(
            '/aas:aasenv/aas:conceptDescriptions/aas:conceptDescription',
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
        for (const refNode of this.selectNodes('./aas:isCaseOf', node)) {
            isCaseOf.push(this.readReference('.', refNode)!);
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
            default:
                throw new Error(`"${node.localName}" is an invalid model type.`);
        }
    }

    private selectNode(query: string, node: Node): Element | undefined {
        const value = this.select(query, node, true);
        if (value === null) {
            return undefined;
        }

        return value as Element;
    }

    private selectNodes(query: string, node: Node): Element[] {
        const values = this.select(query, node);
        return Array.isArray(values) ? (values as Element[]) : [];
    }

    private getReference(node: Element): aas.Reference {
        const keys: aas.Key[] = [];
        for (const keyNode of this.selectNodes('./aas:value/aas:keys/aas:key', node)) {
            const key = this.readKey(keyNode);
            if (!key) {
                break;
            }

            keys.push(key);
        }

        return { type: 'ModelReference', keys };
    }

    private readKey(node: Element): aas.Key | undefined {
        const type = node.getAttribute('type') as aas.KeyTypes;
        const value = node.textContent;
        if (!type || !value) {
            return undefined;
        }

        return { type, value };
    }

    private readIdentifier(node: Element): string {
        const id = this.selectNode('./aas:identification', node)?.textContent;
        if (id == null) {
            throw new Error('./aas:identification');
        }

        return id;
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

    private toDataTypeDefXsd(source: string): aas.DataTypeDefXsd {
        switch (source) {
            case 'anyURI':
                return 'xs:anyURI';
            case 'base64Binary':
                return 'xs:base64Binary';
            case 'boolean':
                return 'xs:boolean';
            case 'byte':
                return 'xs:byte';
            case 'Date':
            case 'date':
                return 'xs:date';
            case 'dateTime':
                return 'xs:dateTime';
            case 'dateTimeStamp':
                return 'xs:dateTime';
            case 'dayTimeDuration':
                return 'xs:duration';
            case 'Decimal':
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
            case 'langString':
            case 'String':
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
                throw new Error(`${source} is an unknown value type.`);
        }
    }
}
