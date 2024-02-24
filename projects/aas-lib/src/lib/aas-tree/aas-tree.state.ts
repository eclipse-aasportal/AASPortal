/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import {
    AASDocument,
    aas,
    convertToString,
    getAbbreviation,
    getLocaleValue,
    isBooleanType,
    isIdentifiable,
    isProperty,
    isReferenceElement,
    isSubmodel,
    mimeTypeToExtension,
    selectReferable,
    toBoolean,
    toLocale,
} from 'common';
import { resolveSemanticId, supportedSubmodelTemplates } from '../submodel-template/submodel-template';
import { Tree, TreeNode } from '../tree';
import { basename, normalize } from '../convert';
import { isEqual } from 'lodash-es';

export class AASTreeRow extends TreeNode<aas.Referable> {
    public constructor(
        public readonly id: string,
        element: aas.Referable,
        expanded: boolean,
        selected: boolean,
        highlighted: boolean,
        level: number,
        public readonly abbreviation: string,
        public readonly name: string,
        public readonly typeInfo: string,
        public readonly value: string | boolean | undefined,
        public readonly displayType: DisplayType,
        public readonly isLeaf: boolean,
        parent: number,
        firstChild: number,
        nextSibling: number,
    ) {
        super(element, parent, level, expanded, selected, highlighted, firstChild, nextSibling);
    }

    public override get hasChildren(): boolean {
        return this.firstChild >= 0;
    }

    public get hasSemantic(): boolean {
        const referable = this.element;
        if (isSubmodel(referable)) {
            const sematicId = resolveSemanticId(referable);
            return sematicId != null && supportedSubmodelTemplates.has(sematicId);
        }

        return false;
    }
}

export enum DisplayType {
    undefined = '',
    Text = 'text',
    Boolean = 'boolean',
    Url = 'url',
}

export interface SearchTerm {
    text?: string;
    query?: SearchQuery;
}

export type Operator = '=' | '<' | '>' | '<=' | '>=' | '!=';

export interface SearchQuery {
    modelType: aas.ModelType;
    operator?: Operator;
    name?: string;
    value?: string | boolean;
}

export interface AASTreeState {
    rows: AASTreeRow[];
    index: number;
    terms: SearchTerm[];
    error: unknown;
}

export interface AASTreeFeatureState {
    tree: AASTreeState;
}

class TreeInitialize {
    private readonly rows: AASTreeRow[] = [];
    public constructor(
        private readonly env: aas.Environment,
        private readonly language: string,
    ) {}

    public get(): AASTreeRow[] {
        for (const shell of this.env.assetAdministrationShells) {
            const row = this.createRow(shell, -1, 0, true);
            this.rows.push(row);
            row.firstChild = this.hasChildren(shell) ? this.rows.length : -1;
            this.traverse(shell, this.rows.length - 1, 1);
            for (const stateRow of this.rows) {
                if (stateRow.expanded || stateRow.selected) {
                    const row = this.findRow(this.rows, stateRow.element);
                    if (row) {
                        row.expanded = stateRow.expanded;
                        row.selected = stateRow.selected;
                    }
                }
            }
        }

        return this.rows;
    }

    private createRow(element: aas.Referable, parent: number, level: number, expanded: boolean): AASTreeRow {
        let valueType = DisplayType.undefined;
        let isLeaf = true;
        switch (element.modelType) {
            case 'AssetAdministrationShell':
            case 'Submodel':
            case 'SubmodelElementCollection':
            case 'SubmodelElementList':
                isLeaf = false;
                break;
            case 'Property':
                valueType = this.getPropertyDisplayType(element as aas.Property);
                break;
            case 'MultiLanguageProperty':
            case 'Range':
                valueType = DisplayType.Text;
                break;
            case 'Entity':
            case 'ReferenceElement':
            case 'Operation':
                valueType = DisplayType.Url;
                break;
            case 'File': {
                const file = element as aas.File;
                valueType = file.contentType && file.value ? DisplayType.Url : DisplayType.Text;
                break;
            }
            case 'Blob': {
                const blob = element as aas.Blob;
                valueType = blob.contentType ? DisplayType.Url : DisplayType.Text;
                break;
            }
        }

        return new AASTreeRow(
            `row_${this.rows.length + 1}`,
            element,
            expanded,
            false,
            false,
            level,
            getAbbreviation(element.modelType) ?? '',
            element.idShort,
            this.getTypeInfo(element),
            this.getValue(element, this.language),
            valueType,
            isLeaf,
            parent,
            -1,
            -1,
        );
    }

    private traverse(element: aas.Referable, parent: number, level: number): void {
        let previous: AASTreeRow | null = null;
        for (const child of this.getChildren(element)) {
            const row = this.createRow(child, parent, level, false);
            this.rows.push(row);
            if (previous) {
                previous.nextSibling = this.rows.length - 1;
            }

            const descendants = this.getChildren(child);
            if (descendants.length > 0) {
                row.firstChild = this.rows.length;
                this.traverse(child, this.rows.length - 1, level + 1);
            }

            previous = row;
        }
    }

    private getChildren(referable: aas.Referable): aas.Referable[] {
        switch (referable.modelType) {
            case 'AssetAdministrationShell': {
                const shell = referable as aas.AssetAdministrationShell;
                const children: aas.Referable[] = [];
                if (shell.submodels) {
                    for (const reference of shell.submodels) {
                        const submodel = selectReferable(this.env!, reference);
                        if (submodel) {
                            children.push(submodel);
                        }
                    }
                }

                return children;
            }
            case 'Submodel':
                return (referable as aas.Submodel).submodelElements ?? [];
            case 'SubmodelElementCollection':
                return (referable as aas.SubmodelElementCollection).value ?? [];
            case 'SubmodelElementList':
                return (referable as aas.SubmodelElementList).value ?? [];
            default:
                return [];
        }
    }

    private findRow(rows: AASTreeRow[], referable: aas.Referable): AASTreeRow | undefined {
        return rows.find(row => isEqual(this.createReference(row.element), this.createReference(referable)));
    }

    private createReference(referable: aas.Referable): aas.Reference {
        let keys: aas.Key[];
        if (referable.parent) {
            keys = [
                ...referable.parent.keys.map(key => ({ ...key })),
                {
                    type: referable.modelType as aas.KeyTypes,
                    value: referable.idShort,
                },
            ];
        } else if (isIdentifiable(referable)) {
            keys = [
                {
                    type: referable.modelType as aas.KeyTypes,
                    value: referable.id,
                },
            ];
        } else {
            throw new Error('Unexpected referable.');
        }

        return { type: 'ModelReference', keys };
    }

    private getPropertyDisplayType(property: aas.Property): DisplayType {
        switch (property.valueType) {
            case 'xs:anyURI':
                return DisplayType.Url;
            case 'xs:boolean':
                return DisplayType.Boolean;
            default:
                return DisplayType.Text;
        }
    }

    private getValue(referable: aas.Referable | null, localeId: string): boolean | string | undefined {
        if (referable) {
            switch (referable.modelType) {
                case 'Property':
                    return this.getPropertyValue(referable as aas.Property, localeId);
                case 'Range': {
                    const range = referable as aas.Range;
                    return `${convertToString(range.min, localeId)} ... ${convertToString(range.max, localeId)}`;
                }
                case 'File': {
                    const file = referable as aas.File;
                    return file.value ? basename(normalize(file.value)) : '-';
                }
                case 'Blob': {
                    const blob = referable as aas.Blob;
                    const extension = mimeTypeToExtension(blob.contentType) ?? '';
                    return blob.contentType ? `${blob.idShort}${extension}` : '-';
                }
                case 'ReferenceElement':
                    return (referable as aas.ReferenceElement).value?.keys.map(item => item.value).join('/');
                case 'RelationshipElement':
                    return this.getRelationshipElementValue(referable as aas.RelationshipElement);
                case 'MultiLanguageProperty':
                    return getLocaleValue((referable as aas.MultiLanguageProperty).value, localeId) ?? '-';
                case 'Entity':
                    return (referable as aas.Entity).globalAssetId ?? '-';
                default:
                    return '-';
            }
        }

        return '';
    }

    private hasChildren(referable: aas.Referable): boolean {
        switch (referable.modelType) {
            case 'AssetAdministrationShell': {
                const shell = referable as aas.AssetAdministrationShell;
                return shell.submodels != null && shell.submodels.length > 0;
            }
            case 'Submodel': {
                const submodel = referable as aas.Submodel;
                return submodel.submodelElements != null && submodel.submodelElements.length > 0;
            }
            case 'SubmodelElementCollection': {
                const collection = referable as aas.SubmodelElementCollection;
                return collection.value != null && collection.value.length > 0;
            }
            case 'SubmodelElementList': {
                const list = referable as aas.SubmodelElementList;
                return list.value != null && list.value.length > 0;
            }
            default:
                return false;
        }
    }

    private getPropertyValue(property: aas.Property, localeId: string): string | boolean | undefined {
        if (isBooleanType(property.valueType)) {
            return toBoolean(property.value);
        } else {
            return toLocale(property.value, property.valueType, localeId);
        }
    }

    private getRelationshipElementValue(relationship: aas.RelationshipElement): string {
        const first = relationship.first.keys.map(key => key.value).join('/');
        const second = relationship.second.keys.map(key => key.value).join('/');
        return `1. ${first}; 2. ${second}`;
    }

    private getTypeInfo(referable: aas.Referable | null): string {
        let value: string;
        if (referable) {
            switch (referable.modelType) {
                case 'AssetAdministrationShell':
                    value = (referable as aas.Submodel).id;
                    break;
                case 'Submodel':
                    value = `Semantic ID: ${this.referenceToString((referable as aas.Submodel).semanticId)}`;
                    break;
                case 'SubmodelElementCollection':
                    value = (referable as aas.SubmodelElementCollection).value?.length.toString() ?? '0';
                    break;
                case 'SubmodelElementList':
                    value = (referable as aas.SubmodelElementList).value?.length.toString() ?? '0';
                    break;
                case 'Property':
                    value = (referable as aas.Property).valueType;
                    break;
                case 'Range':
                    value = (referable as aas.Range).valueType;
                    break;
                case 'File':
                    value = (referable as aas.File).contentType;
                    break;
                case 'Blob':
                    value = (referable as aas.Blob).contentType;
                    break;
                case 'MultiLanguageProperty': {
                    const mlp = referable as aas.MultiLanguageProperty;
                    value = '';
                    if (mlp && Array.isArray(mlp.value)) {
                        value += `${mlp.value.map(item => item.language).join(', ')}`;
                    }
                    break;
                }
                case 'Entity': {
                    const entity = referable as aas.Entity;
                    value = '';
                    if (entity?.globalAssetId) {
                        value = entity.globalAssetId;
                    }
                    break;
                }
                case 'Operation': {
                    const operation = referable as aas.Operation;
                    value = '';
                    if (operation.inputVariables && operation.inputVariables.length > 0) {
                        value +=
                            '(' + operation.inputVariables.map(v => this.variableToString(v.value)).join(', ') + ')';
                    }

                    if (operation.outputVariables && operation.outputVariables.length === 1) {
                        value += `: ${this.variableToString(operation.outputVariables[0].value)}`;
                    } else if (operation.outputVariables && operation.outputVariables.length > 1) {
                        value +=
                            ': {' + operation.outputVariables.map(v => this.variableToString(v.value)).join(', ') + '}';
                    }
                    break;
                }
                default:
                    value = '-';
                    break;
            }
        } else {
            value = '-';
        }

        return value;
    }

    private variableToString(value: aas.SubmodelElement): string {
        if (isProperty(value)) {
            return `${value.idShort}: ${value.valueType}`;
        }

        if (isReferenceElement(value)) {
            return `${value.idShort}: ${value?.value?.keys.map(key => key.value).join('/')}`;
        }

        return `${value.idShort}: ${value.modelType}`;
    }

    private referenceToString(reference?: aas.Reference): string {
        return reference?.keys.map(key => key.value).join('/') ?? '-';
    }
}

export class AASTree extends Tree<aas.Referable, AASTreeRow> {
    private _nodes: AASTreeRow[];

    public constructor(nodes: AASTreeRow[]) {
        super();

        this._nodes = nodes;
    }

    public get nodes(): AASTreeRow[] {
        return this._nodes;
    }

    public static from(document: AASDocument | null, language: string): AASTree {
        if (!document || !document.content) {
            return new AASTree([]);
        }

        return new AASTree(new TreeInitialize(document.content, language).get());
    }

    protected override getNodes(): AASTreeRow[] {
        return this._nodes;
    }

    protected override setNodes(nodes: AASTreeRow[]): void {
        this._nodes = nodes;
    }

    protected override cloneNode(node: AASTreeRow): AASTreeRow {
        return new AASTreeRow(
            node.id,
            node.element,
            node.expanded,
            node.selected,
            node.highlighted,
            node.level,
            node.abbreviation,
            node.name,
            node.typeInfo,
            node.value,
            node.displayType,
            node.isLeaf,
            node.parent,
            node.firstChild,
            node.nextSibling,
        );
    }
}
