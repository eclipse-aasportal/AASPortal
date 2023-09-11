/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { isEqual } from 'lodash-es';
import { createReducer, on } from '@ngrx/store';
import {
    AASDocument,
    convertToString,
    getAbbreviation,
    getLocaleValue,
    aas,
    isProperty,
    isReferenceElement,
    isIdentifiable,
    selectReferable,
    isBooleanType,
    toLocale,
    toBoolean
} from 'common';

import { AASTreeRow, AASTreeState, DisplayType, SearchTerm } from './aas-tree.state';
import * as AASTreeActions from './aas-tree.actions';
import { basename, normalize, mimeTypeToExtension } from '../convert';

const initialState: AASTreeState = {
    rows: [],
    index: -1,
    terms: [],
    error: null
};

export const aasTreeReducer = createReducer(
    initialState,
    on(
        AASTreeActions.collapse,
        (state) => collapse(state)
    ),
    on(
        AASTreeActions.collapseRow,
        (state, { row }) => collapseRow(state, row)
    ),
    on(
        AASTreeActions.expandRow,
        (state, { arg }) => expandRow(state, arg)
    ),
    on(
        AASTreeActions.setMatchIndex,
        (state, { index }) => setMatchIndex(state, index)
    ),
    on(
        AASTreeActions.setSearchText,
        (state, { terms }) => setSearchText(state, terms)
    ),
    on(
        AASTreeActions.toggleSelected,
        (state, { row }) => toggleSelected(state, row)
    ),
    on(
        AASTreeActions.toggleSelections,
        (state, { document }) => toggleSelections(state, document)
    ),
    on(
        AASTreeActions.updateRows,
        (state, { document, localeId }) => {
            try {
                return updateRows(state, document, localeId);
            } catch (error) {
                return { ...state, error };
            }
        }
    )
);

function updateRows(state: AASTreeState, document: AASDocument | null, localeId: string): AASTreeState {
    const rows: AASTreeRow[] = [];
    const env = document?.content;
    if (env) {
        for (const shell of env.assetAdministrationShells) {
            const row = createRow(shell, -1, 0, true);
            rows.push(row);
            row.firstChild = hasChildren(shell) ? rows.length : -1;
            traverse(shell, rows.length - 1, 1);
            for (const stateRow of state.rows) {
                if (stateRow.expanded || stateRow.selected) {
                    const row = findRow(rows, stateRow.element);
                    if (row) {
                        row.expanded = stateRow.expanded;
                        row.selected = stateRow.selected;
                    }
                }
            }
        }
    }

    return { ...state, rows, error: null };

    function traverse(
        element: aas.Referable,
        parent: number,
        level: number): void {
        let previous: AASTreeRow | null = null;
        for (const child of getChildren(element)) {
            const row = createRow(child, parent, level, false);
            rows.push(row);
            if (previous) {
                previous.nextSibling = rows.length - 1;
            }

            const descendants = getChildren(child);
            if (descendants.length > 0) {
                row.firstChild = rows.length;
                traverse(child, rows.length - 1, level + 1);
            }

            previous = row;
        }
    }

    function hasChildren(referable: aas.Referable): boolean {
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

    function getChildren(referable: aas.Referable): aas.Referable[] {
        switch (referable.modelType) {
            case 'AssetAdministrationShell': {
                const shell = referable as aas.AssetAdministrationShell;
                const children: aas.Referable[] = [];
                if (shell.submodels) {
                    for (const reference of shell.submodels) {
                        const submodel = selectReferable(env!, reference);
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

    function createRow(element: aas.Referable, parent: number, level: number, expanded: boolean): AASTreeRow {
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
                valueType = getPropertyDisplayType(element as aas.Property);
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
            `row_${rows.length + 1}`,
            element,
            expanded,
            false,
            false,
            level,
            getAbbreviation(element.modelType) ?? '',
            element.idShort,
            getTypeInfo(element),
            getValue(element, localeId),
            valueType,
            isLeaf,
            parent,
            -1,
            -1);

        function getPropertyDisplayType(property: aas.Property): DisplayType {
            switch (property.valueType) {
                case 'xs:anyURI':
                    return DisplayType.Url;
                case 'xs:boolean':
                    return DisplayType.Boolean;
                default:
                    return DisplayType.Text;
            }
        }
    }

    function findRow(rows: AASTreeRow[], referable: aas.Referable): AASTreeRow | undefined {
        return rows.find((row) => isEqual(createReference(row.element), createReference(referable)));
    }

    function createReference(referable: aas.Referable): aas.Reference {
        let keys: aas.Key[];
        if (referable.parent) {
            keys = [...referable.parent.keys.map(key => ({ ...key })),
            {
                type: referable.modelType as aas.KeyTypes,
                value: referable.idShort,
            }];
        } else if (isIdentifiable(referable)) {
            keys = [{
                type: referable.modelType as aas.KeyTypes,
                value: referable.id,
            }];
        } else {
            throw new Error('Unexpected referable.');
        }

        return { type: 'ModelReference', keys };
    }
}

function expandRow(state: AASTreeState, arg: number | AASTreeRow): AASTreeState {
    const rows = [...state.rows];
    const ancestors: AASTreeRow[] = [];
    let row = typeof arg === 'number' ?  state.rows[arg] : arg;
    if (!row.expanded) {
        expand(row);
    }
    
    let parentRow = row.parent >= 0 ? state.rows[row.parent] : null;
    while (parentRow) {
        if (parentRow.expanded) {
            break;
        }

        ancestors.push(parentRow);
        row = parentRow;
        parentRow = row.parent >= 0 ? state.rows[row.parent] : null;
    }

    while (ancestors.length > 0) {
        const row = ancestors.pop();
        if (!row) {
            break;
        }

        expand(row);
    }
    
    return { ...state, rows, error: null };

    function expand(row: AASTreeRow) {
        const index = rows.indexOf(row);
        rows[index] = new AASTreeRow(
            row.id,
            row.element,
            true,
            row.selected,
            row.highlighted,
            row.level,
            row.abbreviation,
            row.name,
            row.typeInfo,
            row.value,
            row.displayType,
            row.isLeaf,
            row.parent,
            row.firstChild,
            row.nextSibling);
    }
}

function collapseRow(state: AASTreeState, row: AASTreeRow): AASTreeState {
    const rows = [...state.rows];
    const index = rows.indexOf(row);
    rows[index] = new AASTreeRow(
        row.id,
        row.element,
        false,
        row.selected,
        row.highlighted,
        row.level,
        row.abbreviation,
        row.name,
        row.typeInfo,
        row.value,
        row.displayType,
        row.isLeaf,
        row.parent,
        row.firstChild,
        row.nextSibling);

    return { ...state, rows, error: null };
}

function collapse(state: AASTreeState): AASTreeState {
    const rows = state.rows.map((row, index) => {
        if (index === 0) {
            if (!row.expanded) {
                return new AASTreeRow(
                    row.id,
                    row.element,
                    true,
                    row.selected,
                    row.highlighted,
                    row.level,
                    row.abbreviation,
                    row.name,
                    row.typeInfo,
                    row.value,
                    row.displayType,
                    row.isLeaf,
                    row.parent,
                    row.firstChild,
                    row.nextSibling);
            }
        } else if (!row.isLeaf && row.expanded) {
            return new AASTreeRow(
                row.id,
                row.element,
                false,
                row.selected,
                row.highlighted,
                row.level,
                row.abbreviation,
                row.name,
                row.typeInfo,
                row.value,
                row.displayType,
                row.isLeaf,
                row.parent,
                row.firstChild,
                row.nextSibling);
        }

        return row;
    });

    return { ...state, rows, error: null };
}

function toggleSelected(state: AASTreeState, row: AASTreeRow): AASTreeState {
    const rows = [...state.rows];
    const index = rows.indexOf(row);
    rows[index] = new AASTreeRow(
        row.id,
        row.element,
        row.expanded,
        !row.selected,
        row.highlighted,
        row.level,
        row.abbreviation,
        row.name,
        row.typeInfo,
        row.value,
        row.displayType,
        row.isLeaf,
        row.parent,
        row.firstChild,
        row.nextSibling);

    return { ...state, rows, error: null };
}

function toggleSelections(state: AASTreeState, document: AASDocument | null): AASTreeState {
    const value = !state.rows.some(row => row.selected);
    const rows = state.rows.map(row => {
        if (value) {
            if (!row.selected && isSelectable(row, document)) {
                return new AASTreeRow(
                    row.id,
                    row.element,
                    row.expanded,
                    true,
                    row.highlighted,
                    row.level,
                    row.abbreviation,
                    row.name,
                    row.typeInfo,
                    row.value,
                    row.displayType,
                    row.isLeaf,
                    row.parent,
                    row.firstChild,
                    row.nextSibling);
            }
        } else if (row.selected) {
            return new AASTreeRow(
                row.id,
                row.element,
                row.expanded,
                false,
                row.highlighted,
                row.level,
                row.abbreviation,
                row.name,
                row.typeInfo,
                row.value,
                row.displayType,
                row.isLeaf,
                row.parent,
                row.firstChild,
                row.nextSibling);
        }

        return row;
    });

    return { ...state, rows, error: null };

    function isSelectable(row: AASTreeRow, document: AASDocument | null): boolean {
        return document != null &&
            (!document.readonly ||
                !document.modified && row.element.modelType === 'Property');
    }
}

function getTypeInfo(referable: aas.Referable | null): string {
    let value: string;
    if (referable) {
        switch (referable.modelType) {
            case 'AssetAdministrationShell':
                value = (referable as aas.Submodel).id;
                break;
            case 'Submodel':
                value = `Semantic ID: ${referenceToString((referable as aas.Submodel).semanticId)}`;
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
                    value += '(' + operation.inputVariables.map(v => variableToString(v.value)).join(', ') + ')';
                }

                if (operation.outputVariables && operation.outputVariables.length === 1) {
                    value += `: ${variableToString(operation.outputVariables[0].value)}`;
                }
                else if (operation.outputVariables && operation.outputVariables.length > 1) {
                    value += ': {' + operation.outputVariables.map(v => variableToString(v.value)).join(', ') + '}';
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

    function variableToString(value: aas.SubmodelElement): string {
        if (isProperty(value)) {
            return `${value.idShort}: ${value.valueType}`;
        }

        if (isReferenceElement(value)) {
            return `${value.idShort}: ${value?.value?.keys.map(key => key.value).join('/')}`;
        }

        return `${value.idShort}: ${value.modelType}`
    }

    function referenceToString(reference?: aas.Reference): string {
        return reference?.keys.map(key => key.value).join('/') ?? '-';
    }
}

function getValue(referable: aas.Referable | null, localeId: string): boolean | string | undefined {
    if (referable) {
        switch (referable.modelType) {
            case 'Property':
                return getPropertyValue(referable as aas.Property, localeId);
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
                return (referable as aas.ReferenceElement).value.keys.map(item => item.value).join('/');
            case 'RelationshipElement':
                return getRelationshipElementValue(referable as aas.RelationshipElement);
            case 'MultiLanguageProperty':
                return getLocaleValue((referable as aas.MultiLanguageProperty).value, localeId) ?? '-';
            case 'Entity':
                return (referable as aas.Entity).globalAssetId ?? '-';
            default:
                return '-';
        }
    }

    return '';

    function getPropertyValue(property: aas.Property, localeId: string): string | boolean | undefined {
        if (isBooleanType(property.valueType)) {
            return toBoolean(property.value);
        } else {
            return toLocale(property.value, property.valueType, localeId);
        }
    }

    function getRelationshipElementValue(relationship: aas.RelationshipElement): string {
        const first = relationship.first.keys.map(key => key.value).join('/');
        const second = relationship.second.keys.map(key => key.value).join('/');
        return `1. ${first}; 2. ${second}`;
    }

    function isDate(valueType: aas.DataTypeDefXsd): boolean {
        switch (valueType) {
            case 'xs:date':
            case 'xs:dateTime':
                return true;
            default:
                return false;
        }
    }
}

function setSearchText(state: AASTreeState, terms: SearchTerm[]): AASTreeState {
    return { ...state, index: -1, terms };
}

function setMatchIndex(state: AASTreeState, index: number): AASTreeState {
    if (index >= 0) {
        return {
            ...state,
            rows: updateHighlighted(index),
            index: index,
            error: null
        };
    } else {
        return {
            rows: updateHighlighted(-1),
            index: -1,
            terms: [],
            error: null
        };
    }

    function updateHighlighted(index: number): AASTreeRow[] {
        const rows = [...state.rows];
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (i === index) {
                rows[i] = new AASTreeRow(
                    row.id,
                    row.element,
                    row.expanded,
                    row.selected,
                    true,
                    row.level,
                    row.abbreviation,
                    row.name,
                    row.typeInfo,
                    row.value,
                    row.displayType,
                    row.isLeaf,
                    row.parent,
                    row.firstChild,
                    row.nextSibling);
            }
            else if (rows[i].highlighted) {
                rows[i] = new AASTreeRow(
                    row.id,
                    row.element,
                    row.expanded,
                    row.selected,
                    false,
                    row.level,
                    row.abbreviation,
                    row.name,
                    row.typeInfo,
                    row.value,
                    row.displayType,
                    row.isLeaf,
                    row.parent,
                    row.firstChild,
                    row.nextSibling);
            }
        }

        return rows;
    }
}
