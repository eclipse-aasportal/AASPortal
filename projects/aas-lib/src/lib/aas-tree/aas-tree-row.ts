/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import isEqual from 'lodash-es/isEqual';
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
} from 'aas-core';

import { resolveSemanticId, supportedSubmodelTemplates } from '../submodel-template/submodel-template';
import { Tree, TreeNode } from '../tree';
import { basename, normalize } from '../convert';

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

    public get annotatedRelationship(): aas.AnnotatedRelationshipElement | undefined {
        return this.element.modelType === 'AnnotatedRelationshipElement'
            ? (this.element as aas.AnnotatedRelationshipElement)
            : undefined;
    }

    public get blob(): aas.Blob | undefined {
        return this.element.modelType === 'Blob' ? (this.element as aas.Blob) : undefined;
    }

    public get entity(): aas.Entity | undefined {
        return this.element.modelType === 'Entity' ? (this.element as aas.Entity) : undefined;
    }

    public get file(): aas.File | undefined {
        return this.element.modelType === 'File' ? (this.element as aas.File) : undefined;
    }

    public get operation(): aas.Operation | undefined {
        return this.element.modelType === 'Operation' ? (this.element as aas.Operation) : undefined;
    }

    public get property(): aas.Property | undefined {
        return this.element.modelType === 'Property' ? (this.element as aas.Property) : undefined;
    }

    public get reference(): aas.ReferenceElement | undefined {
        return this.element.modelType === 'ReferenceElement' ? (this.element as aas.ReferenceElement) : undefined;
    }

    public get relationship(): aas.RelationshipElement | undefined {
        return this.element.modelType === 'RelationshipElement' ? (this.element as aas.RelationshipElement) : undefined;
    }

    public get submodel(): aas.Submodel | undefined {
        return this.element.modelType === 'Submodel' ? (this.element as aas.Submodel) : undefined;
    }
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
        let isLeaf = true;
        switch (element.modelType) {
            case 'AssetAdministrationShell':
            case 'Submodel':
            case 'SubmodelElementCollection':
            case 'SubmodelElementList':
                isLeaf = false;
                break;
            case 'AnnotatedRelationshipElement': {
                const relationship = element as aas.AnnotatedRelationshipElement;
                isLeaf = !relationship.annotations || relationship.annotations.length === 0;
                break;
            }
            case 'Entity': {
                const entity = element as aas.Entity;
                isLeaf = !entity.statements || entity.statements.length === 0;
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
            case 'AnnotatedRelationshipElement':
                return (referable as aas.AnnotatedRelationshipElement).annotations ?? [];
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
            case 'Entity':
                return (referable as aas.Entity).statements ?? [];
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

    private getValue(referable: aas.Referable | null, localeId: string): boolean | string | undefined {
        if (referable) {
            switch (referable.modelType) {
                case 'Blob': {
                    const blob = referable as aas.Blob;
                    const extension = mimeTypeToExtension(blob.contentType) ?? '';
                    return blob.contentType ? `${blob.idShort}${extension}` : '-';
                }
                case 'Entity':
                    return (referable as aas.Entity).globalAssetId ?? '-';
                case 'File': {
                    const file = referable as aas.File;
                    return file.value ? basename(normalize(file.value)) : '-';
                }
                case 'MultiLanguageProperty':
                    return getLocaleValue((referable as aas.MultiLanguageProperty).value, localeId) ?? '-';
                case 'Operation':
                    return `${referable.idShort}()`;
                case 'Property':
                    return this.getPropertyValue(referable as aas.Property, localeId);
                case 'Range': {
                    const range = referable as aas.Range;
                    return `${convertToString(range.min, localeId)} ... ${convertToString(range.max, localeId)}`;
                }
                case 'ReferenceElement':
                    return (referable as aas.ReferenceElement).value?.keys.map(item => item.value).join('/');
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
            case 'Entity': {
                const entity = referable as aas.Entity;
                return entity.statements != null && entity.statements.length > 0;
            }
            case 'AnnotatedRelationshipElement': {
                const relationship = referable as aas.AnnotatedRelationshipElement;
                return relationship.annotations != null && relationship.annotations.length > 0;
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

    private getTypeInfo(referable: aas.Referable | null): string {
        let value: string;
        if (referable) {
            switch (referable.modelType) {
                case 'AnnotatedRelationshipElement':
                    value = (referable as aas.AnnotatedRelationshipElement).annotations?.length.toString() ?? '-';
                    break;
                case 'AssetAdministrationShell':
                    value = (referable as aas.Submodel).id;
                    break;
                case 'Blob':
                    value = (referable as aas.Blob).contentType;
                    break;
                case 'File':
                    value = (referable as aas.File).contentType;
                    break;
                case 'Property':
                    value = (referable as aas.Property).valueType;
                    break;
                case 'Range':
                    value = (referable as aas.Range).valueType;
                    break;
                case 'ReferenceElement':
                    {
                        const keys = (referable as aas.ReferenceElement).value?.keys;
                        value = keys && keys.length > 0 ? keys[0].type : '-';
                    }
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
                case 'MultiLanguageProperty':
                    {
                        const mlp = referable as aas.MultiLanguageProperty;
                        value = '';
                        if (mlp && Array.isArray(mlp.value)) {
                            value += `${mlp.value.map(item => item.language).join(', ')}`;
                        }
                    }
                    break;
                case 'Entity':
                    {
                        const entity = referable as aas.Entity;
                        value = entity.entityType;
                    }
                    break;
                case 'Operation':
                    {
                        const operation = referable as aas.Operation;
                        value = '';
                        if (operation.inputVariables && operation.inputVariables.length > 0) {
                            value +=
                                '(' +
                                operation.inputVariables.map(v => this.variableToString(v.value)).join(', ') +
                                ')';
                        }

                        if (operation.outputVariables && operation.outputVariables.length === 1) {
                            value += `: ${this.variableToString(operation.outputVariables[0].value)}`;
                        } else if (operation.outputVariables && operation.outputVariables.length > 1) {
                            value +=
                                ': {' +
                                operation.outputVariables.map(v => this.variableToString(v.value)).join(', ') +
                                '}';
                        }
                    }
                    break;
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
            node.isLeaf,
            node.parent,
            node.firstChild,
            node.nextSibling,
        );
    }
}
