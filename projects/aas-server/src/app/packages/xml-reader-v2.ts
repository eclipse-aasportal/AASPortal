/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { aas, determineType, toBoolean } from 'aas-core';
import { useNamespaces, XPathSelect } from 'xpath';
import { DOMParser } from '@xmldom/xmldom';
import { AASReader } from './aas-reader.js';
import { HTMLDocumentElement } from '../types/html-document-element.js';

export class XmlReaderV2 extends AASReader {
    private readonly select: XPathSelect;
    private readonly document: Document;
    private iec61360 = 'IEC61360';

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

    private readAssetAdministrationShell(node: Node): aas.AssetAdministrationShell {
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
    private readAdministrationInformation(path: string, node: Node): aas.AdministrativeInformation | undefined {
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
        for (const child of this.selectNodes('./aas:submodelElements/aas:submodelElement/*[1]', node)) {
            const submodelElement = this.readSubmodelElement(child, parent);
            if (submodelElement) {
                submodelElements.push(submodelElement);
            }
        }

        return submodelElements;
    }

    private readCollectionValue(node: Node, parent: aas.Reference): aas.SubmodelElement[] {
        const submodelElements: aas.SubmodelElement[] = [];
        for (const child of this.selectNodes('./aas:value/aas:submodelElement/*[1]', node)) {
            const submodelElement = this.readSubmodelElement(child, parent);
            if (submodelElement) {
                submodelElements.push(submodelElement);
            }
        }

        return submodelElements;
    }

    private readSubmodelElement(node: Node, parent: aas.Reference): aas.SubmodelElement | undefined {
        let submodelElement: aas.SubmodelElement | undefined;
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
            default:
                break;
        }

        return submodelElement;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private readAnnotatedRelationshipElement(node: Node, parent: aas.Reference): aas.AnnotatedRelationshipElement {
        throw new Error('Method not implemented.');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private readBasicEventElement(node: Node, parent?: aas.Reference): aas.BasicEventElement {
        throw new Error('Method not implemented.');
    }

    private readBlob(node: Node, parent: aas.Reference): aas.Blob {
        const contentType = this.selectNode('./aas:mimeType', node)?.textContent;
        if (!contentType) {
            throw new Error('File.mimetype');
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
            const se = this.selectNode('./*[1]', child);
            if (se) {
                const submodelElement = this.readSubmodelElement(se, parent);
                if (submodelElement) {
                    statements.push(submodelElement);
                }
            }
        }

        return statements;
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

    private readSubmodelElementCollection(node: Node, parent: aas.Reference): aas.SubmodelElementCollection {
        const base = this.readSubmodelElementType(node, parent);
        const collection: aas.SubmodelElementCollection = {
            ...base,
            value: this.readCollectionValue(node, this.createReference(parent, base)),
        };

        return collection;
    }

    private readProperty(node: Node, parent: aas.Reference): aas.Property {
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
        const first = this.readReference('./aas:first', node);
        if (!first) {
            throw new Error('RelationshipElement.first');
        }

        const second = this.readReference('./aas:second', node);
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
        if (!contentType) {
            contentType = '';
        }

        const file: aas.File = {
            ...this.readSubmodelElementType(node, parent),
            contentType,
        };

        const value = this.selectNode('./aas:value', node)?.textContent;
        if (value) {
            file.value = value;
        }

        return file;
    }

    private readMultiLanguageProperty(node: Node, parent: aas.Reference): aas.MultiLanguageProperty {
        const langString = this.readLangString('./aas:value', node) ?? [];
        return { ...this.readSubmodelElementType(node, parent), value: langString };
    }

    private readReferenceElement(node: Node, parent: aas.Reference): aas.ReferenceElement {
        const value = this.getReference(node);
        return { ...this.readSubmodelElementType(node, parent), value };
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
        const id = this.readIdentifier(node);
        const identifiable: aas.Identifiable = { ...this.readReferable(node, id, undefined), id };
        const administration = this.readAdministrativeInformation(node);
        if (administration) {
            identifiable.administration = administration;
        }

        return identifiable;
    }

    private readReferable(node: Node, id: string | undefined, parent: aas.Reference | undefined): aas.Referable {
        let idShort = this.selectNode('./aas:idShort', node)?.textContent;
        if (!idShort) {
            idShort = id ? this.createIdShort(id) : '';
        }

        const referable: aas.Referable = {
            idShort,
            modelType: this.getModelTypeFromLocalName(node),
        };

        if (parent) {
            referable.parent = parent;
        }

        const category = this.selectNode('./aas:category', node)?.textContent;
        if (category) {
            referable.category = category;
        }

        return referable;
    }

    private readHasSemantics(node: Node): aas.HasSemantics {
        const semanticId = this.readReference('./aas:semanticId', node);
        return semanticId ? { semanticId } : {};
    }

    private readHasKind(node: Node): aas.HasKind {
        let kind = this.selectNode('aas:kind', node)?.textContent as aas.ModellingKind;
        if (!kind) {
            kind = 'Instance';
        }

        return { kind };
    }

    private readHasDataSpecification(node: Node): aas.HasDataSpecification {
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

    private readDataSpecificationContent(parent: Node): aas.DataSpecificationContent | undefined {
        const node = this.selectNode('./aas:dataSpecificationContent/aas:dataSpecificationIEC61360', parent);
        if (node) {
            return this.readDataSpecificationIEC61360(node);
        }

        return undefined;
    }

    private readDataSpecificationIEC61360(node: Node): aas.DataSpecificationIec61360 {
        const preferredName = this.readLangString(`./${this.iec61360}:preferredName`, node);
        if (!preferredName) {
            throw new Error('DataSpecificationIEC61360Content.preferredName');
        }

        const dataSpecification: aas.DataSpecificationIec61360 = {
            modelType: this.getModelTypeFromLocalName(node),
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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private readValueList(path: string, node: Node): aas.ValueList | undefined {
        return undefined;
    }

    private readQualifiable(node: Node): aas.Qualifiable {
        const qualifiable: aas.Qualifiable = {};
        const qualifiers = this.readQualifiers('./aas:qualifier/aas:qualifier', node);
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

        const valueId = this.readReference('./valueId', node);
        if (valueId) {
            qualifier.valueId = valueId;
        }

        return qualifier;
    }

    private readReference(path: string, parent: Node): aas.Reference | undefined {
        let reference: aas.Reference | undefined;
        const node = this.selectNode(path, parent);
        if (node) {
            reference = { type: 'ModelReference', keys: [] };
            for (const keyNode of this.selectNodes('./aas:keys/aas:key', node)) {
                reference.keys.push(this.getKey(keyNode));
            }
        }

        return reference;
    }

    private readReferences(path: string, parent: Node): aas.Reference[] {
        const references: aas.Reference[] = [];
        for (const node of this.selectNodes(path, parent)) {
            const reference: aas.Reference = { type: 'ModelReference', keys: [] };
            for (const keyNode of this.selectNodes('./aas:keys/aas:key', node)) {
                reference.keys.push(this.getKey(keyNode));
            }

            references.push(reference);
        }

        return references;
    }

    private readAdministrativeInformation(node: Node): aas.AdministrativeInformation | undefined {
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

    private readLangString(path: string, parent: Node): aas.LangString[] | undefined {
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

    private readConceptDescription(node: Node): aas.ConceptDescription {
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

    private getModelTypeFromLocalName(node: Node): aas.ModelType {
        const localName: string = (node as Element).localName;
        return (localName.charAt(0).toUpperCase() + localName.substring(1)) as aas.ModelType;
    }

    private selectNode(query: string, node: Node): Node | undefined {
        return this.select(query, node, true) as Node | undefined;
    }

    private getNode(query: string, node: Node): Node {
        const result = this.select(query, node, true);
        if (!result) {
            throw new Error(`Query '${query}' returns no result.`);
        }

        return result as Node;
    }

    private selectNodes(query: string, node: Node): Node[] {
        return this.select(query, node) as Node[];
    }

    private getReference(node: Node): aas.Reference {
        return {
            type: 'ModelReference',
            keys: this.selectNodes('./aas:value/aas:keys/aas:key', node).map(item => this.getKey(item)),
        };
    }

    private getKey(node: Node): aas.Key {
        const element = node as Element;
        return {
            type: element.getAttribute('type') as aas.KeyTypes,
            value: element.textContent ?? '',
        };
    }

    private readIdentifier(node: Node): string {
        const id = this.selectNode('./aas:identification', node)?.textContent;
        if (id == null) {
            throw new Error('./aas:identification');
        }

        return id;
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
