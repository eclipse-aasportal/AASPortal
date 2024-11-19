/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import isEqual from 'lodash-es/isEqual';
import isEmpty from 'lodash-es/isEmpty';
import {
    AASDocument,
    aas,
    convertToString,
    extensionToMimeType,
    getAbbreviation,
    getLocaleValue,
    isAnnotatedRelationshipElement,
    isAssetAdministrationShell,
    isBlob,
    isBooleanType,
    isEntity,
    isFile,
    isIdentifiable,
    isMultiLanguageProperty,
    isOperation,
    isProperty,
    isRange,
    isReferenceElement,
    isSubmodel,
    isSubmodelElement,
    isSubmodelElementCollection,
    isSubmodelElementList,
    noop,
    selectReferable,
    toBoolean,
    toLocale,
} from 'aas-core';

import { resolveSemanticId, supportedSubmodelTemplates } from '../submodel-template/submodel-template';
import { Tree, TreeNode } from '../tree';
import { basename, normalize } from '../convert';
import { BehaviorSubject } from 'rxjs';

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
        public readonly value: BehaviorSubject<string | boolean | undefined>,
        public readonly isLeaf: boolean,
        public readonly canOpen: boolean,
        parent: number,
        firstChild: number,
        nextSibling: number,
    ) {
        super(element, parent, level, expanded, selected, highlighted, firstChild, nextSibling);
    }

    public override get hasChildren(): boolean {
        return this.firstChild >= 0;
    }

    public get relationship(): aas.RelationshipElement | undefined {
        return this.element.modelType === 'RelationshipElement' ? (this.element as aas.RelationshipElement) : undefined;
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
            row.firstChild = this.env.submodels.length > 0 ? this.rows.length : -1;
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
            case 'AnnotatedRelationshipElement':
            case 'Entity':
            case 'Operation':
                isLeaf = false;
                break;
        }

        let canOpen = false;
        switch (element.modelType) {
            case 'Blob':
                canOpen = true;
                break;
            case 'File':
                canOpen = !isEmpty(element as aas.File);
                break;
            case 'Submodel':
                canOpen = this.hasSpecificSemantic(element as aas.Submodel);
                break;
            case 'Entity':
                canOpen = !isEmpty((element as aas.Entity).globalAssetId);
                break;
            case 'Operation':
                canOpen = true;
                break;
            case 'ReferenceElement':
                canOpen = !isEmpty((element as aas.ReferenceElement).value);
                break;
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
            new BehaviorSubject(this.getValue(element, this.language)),
            isLeaf,
            canOpen,
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
            case 'Operation': {
                const operation = referable as aas.Operation;
                if (
                    operation.inputVariables &&
                    operation.inputVariables.some(variable => isSubmodelElement(variable.value))
                ) {
                    return true;
                }

                if (
                    operation.inoutputVariables &&
                    operation.inoutputVariables.some(variable => isSubmodelElement(variable.value))
                ) {
                    return true;
                }

                if (
                    operation.outputVariables &&
                    operation.outputVariables.some(variable => isSubmodelElement(variable.value))
                ) {
                    return true;
                }

                return false;
            }
            default:
                return false;
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
            case 'Operation': {
                const operation = referable as aas.Operation;
                const children: aas.Referable[] = [];
                if (operation.inputVariables) {
                    children.push(
                        ...operation.inputVariables
                            .map(variable => variable.value)
                            .filter(value => isSubmodelElement(value)),
                    );
                }

                if (operation.inoutputVariables) {
                    children.push(
                        ...operation.inoutputVariables
                            .map(variable => variable.value)
                            .filter(value => isSubmodelElement(value)),
                    );
                }

                if (operation.outputVariables) {
                    children.push(
                        ...operation.outputVariables
                            .map(variable => variable.value)
                            .filter(value => isSubmodelElement(value)),
                    );
                }

                return children;
            }
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
        if (!referable) {
            return '';
        }

        if (isBlob(referable)) {
            return referable.value ? `${referable.value.length}` : '...';
        }

        if (isFile(referable)) {
            return referable.value ? basename(normalize(referable.value)) : '-';
        }

        if (isMultiLanguageProperty(referable)) {
            return getLocaleValue(referable.value, localeId) ?? '-';
        }

        if (isProperty(referable)) {
            return this.getPropertyValue(referable, localeId);
        }

        if (isRange(referable)) {
            return `${convertToString(referable.min, localeId)} ... ${convertToString(referable.max, localeId)}`;
        }

        if (isReferenceElement(referable)) {
            return this.referenceToString(referable.value);
        }

        return '';
    }

    private getPropertyValue(property: aas.Property, localeId: string): string | boolean | undefined {
        if (isBooleanType(property.valueType)) {
            return toBoolean(property.value);
        } else {
            return toLocale(property.value, property.valueType, localeId);
        }
    }

    private getTypeInfo(referable: aas.Referable | null): string {
        if (!referable) {
            return '-';
        }

        if (isAssetAdministrationShell(referable)) {
            return referable.id;
        }

        if (isMultiLanguageProperty(referable)) {
            let value = '';
            if (referable && Array.isArray(referable.value)) {
                value += `${referable.value.map(item => item.language).join(', ')}`;
            }

            return value;
        }

        if (isSubmodel(referable)) {
            const sid = this.getSemanticId(referable);
            return sid ? `Semantic ID: ${sid}` : '-';
        }

        if (isProperty(referable)) {
            const valueType = (referable as aas.Property).valueType;
            return valueType ? (valueType.startsWith('xs:') ? valueType.substring(3) : valueType) : '-';
        }

        if (isBlob(referable)) {
            return referable.contentType || '-';
        }

        if (isFile(referable)) {
            if (referable.contentType) {
                return referable.contentType;
            }

            if (referable.value) {
                return extensionToMimeType(referable.value) ?? '-';
            }

            return '-';
        }

        if (isRange(referable)) {
            const valueType = (referable as aas.Property).valueType;
            return valueType ? (valueType.startsWith('xs:') ? valueType.substring(3) : valueType) : '-';
        }

        if (isSubmodelElementCollection(referable)) {
            return referable.value ? `${referable.value.length}` : '0';
        }

        if (isSubmodelElementList(referable)) {
            return referable.value ? `${referable.value.length}` : '0';
        }

        if (isAnnotatedRelationshipElement(referable)) {
            return referable.annotations ? `${referable.annotations.length}` : '0';
        }

        if (isEntity(referable)) {
            return referable.statements ? `${referable.statements.length}` : '0';
        }

        if (isOperation(referable)) {
            return (
                (referable.inputVariables?.length ?? 0) +
                (referable.inoutputVariables?.length ?? 0) +
                (referable.outputVariables?.length ?? 0)
            ).toString();
        }

        return '-';
    }

    private getSemanticId(hasSematics: aas.HasSemantics): string {
        return this.referenceToString(hasSematics?.semanticId);
    }

    private referenceToString(reference: aas.Reference | undefined): string {
        return reference?.keys.map(key => key.value).join('.') ?? '-';
    }

    private hasSpecificSemantic(submodel: aas.Submodel): boolean {
        const sematicId = resolveSemanticId(submodel);
        return sematicId != null && supportedSubmodelTemplates.has(sematicId);
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

    public update(referable: aas.Referable): void {
        noop(referable);
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
            node.canOpen,
            node.parent,
            node.firstChild,
            node.nextSibling,
        );
    }
}
