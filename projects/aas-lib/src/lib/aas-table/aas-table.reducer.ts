/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { createReducer, on } from '@ngrx/store';
import { findLastIndex } from 'lodash-es'
import { AASDocument, AASDocumentNode, AASPage, aas } from 'common';
import * as AASTableActions from './aas-table.actions';
import { AASTableRow, AASTableState } from './aas-table.state';
import { ViewMode } from '../types/view-mode';

const initialState: AASTableState = {
    isFirstPage: false,
    isLastPage: false,
    totalCount: 0,
    viewMode: ViewMode.Undefined,
    rows: [],
};

export const aasTableReducer = createReducer(
    initialState,
    on(
        AASTableActions.collapseRow,
        (state, { row }) => collapseRow(state, row)
    ),
    on(
        AASTableActions.expandRow,
        (state, { row }) => expandRow(state, row)
    ),
    on(
        AASTableActions.setPage,
        (state, { page }) => setPage(state, page)
    ),
    on(
        AASTableActions.setContent,
        (state, { document, content }) => setContent(state, document, content)
    ),
    on(
        AASTableActions.toggleSelected,
        (state, { row, altKey, shiftKey }) => toggleSelected(state, row, altKey, shiftKey)
    ),
    on(
        AASTableActions.toggleSelections,
        (state) => toggleSelections(state)
    ),
    on(
        AASTableActions.addRoot,
        (state, { nodes }) => addRoot(state, nodes)
    ),
    on(
        AASTableActions.setSelections,
        (state, { documents }) => setSelections(state, documents)
    ),
);

function setPage(state: AASTableState, page: AASPage): AASTableState {
    const rows: AASTableRow[] = [];
    for (const document of page.documents) {
        if (document.content !== undefined) {
            const row = new AASTableRow(
                document,
                false,
                false,
                false,
                0,
                -1,
                -1);

            rows.push(row);
        }
    }

    return {
        ...state,
        viewMode: ViewMode.List,
        rows,
        isFirstPage: page.previous === null,
        isLastPage: page.next === null,
        totalCount: page.totalCount,
    };
}

function setContent(state: AASTableState, document: AASDocument, content: aas.Environment): AASTableState {
    const rows = [...state.rows];
    const index = rows.findIndex(row => row.endpoint === document.endpoint && row.id === document.id);
    if (index >= 0) {
        const row = rows[index];
        rows[index] = clone(row, { ...document, content })
    }

    return { ...state, rows };

    function clone(row: AASTableRow, document: AASDocument): AASTableRow {
        return new AASTableRow(
            document,
            row.selected,
            row.expanded,
            row.isLeaf,
            row.level,
            row.firstChild,
            row.nextSibling)
    }
}

function addRoot(state: AASTableState, nodes: AASDocumentNode[]): AASTableState {
    const rows: AASTableRow[] = state.viewMode === ViewMode.Tree ? [...state.rows] : [];
    const root = nodes.find(node => node.parent === null);
    const index = findLastIndex(rows, row => row.level === 0);
    if (root) {
        const children = nodes.filter(node => isChild(root, node));
        const rootRow = new AASTableRow(
            root,
            false,
            false,
            children.length === 0,
            0,
            state.rows.length + 1,
            -1
        );

        rows.push(rootRow)

        if (index >= 0) {
            const previous = clone(rows[index]);
            previous.nextSibling = rows.length - 1
            rows[index] = previous;
        }

        traverse(root, nodes, rows, 1);
    }

    return { ...state, rows, viewMode: ViewMode.Tree };
}

function setSelections(state: AASTableState, documents: AASDocument[]): AASTableState {
    const rows = { ...state.rows };
    const set = new Set(documents);
    for (let i = 0, n = rows.length; i < n; i++) {
        const row = rows[i];
        if (!row.selected && set.has(row.document)) {
            rows[i] = clone(row, true);
        } else if (row.selected) {
            rows[i] = clone(row, false);
        }
    }

    return { ...state, rows };
}

function isChild(parent: AASDocumentNode, node: AASDocumentNode): boolean {
    if (!node.parent) {
        return false;
    }

    return node.parent.endpoint === parent.endpoint && node.parent.id === parent.id;
}

function traverse(parent: AASDocumentNode, nodes: AASDocumentNode[], rows: AASTableRow[], level: number): void {
    let previous: AASTableRow | null = null;
    const children = nodes.filter(node => isChild(parent, node));
    for (const child of children) {
        const row = new AASTableRow(
            child,
            false,
            false,
            children.length === 0,
            level,
            -1,
            -1
        );

        rows.push(row);
        if (previous) {
            previous.nextSibling = rows.length - 1;
        }

        if (children.length > 0) {
            row.firstChild = rows.length;
            traverse(child, nodes, rows, level + 1);
        }

        previous = row;
    }
}

function expandRow(state: AASTableState, row: AASTableRow): AASTableState {
    const rows = [...state.rows];
    const index = rows.indexOf(row);
    rows[index] = new AASTableRow(
        row.document,
        false,
        true,
        row.isLeaf,
        row.level,
        row.firstChild,
        row.nextSibling);

    return { ...state, rows };
}

function collapseRow(state: AASTableState, row: AASTableRow): AASTableState {
    const rows = [...state.rows];
    const index = rows.indexOf(row);
    rows[index] = new AASTableRow(
        row.document,
        false,
        false,
        row.isLeaf,
        row.level,
        row.firstChild,
        row.nextSibling);

    return { ...state, rows };
}

function toggleSelected(
    state: AASTableState,
    row: AASTableRow,
    altKey: boolean,
    shiftKey: boolean,
): AASTableState {
    let rows: AASTableRow[];
    if (altKey) {
        rows = state.rows.map(item =>
            item === row ? clone(row, !row.selected) : (item.selected ? clone(item, false) : item)
        );
    } else if (shiftKey) {
        const index = state.rows.indexOf(row);
        let begin = index;
        let end = index;
        const selection = state.rows.map(row => row.selected);
        const last = selection.lastIndexOf(true);
        if (last >= 0) {
            if (last > index) {
                begin = index;
                end = selection.indexOf(true);
            } else if (last < index) {
                begin = last;
                end = index;
            }
        }

        rows = [];
        for (let i = 0, n = state.rows.length; i < n; i++) {
            const row = state.rows[i];
            if (i < begin || i > end) {
                rows.push(row.selected ? clone(row, false) : row);
            } else {
                rows.push(row.selected ? row : clone(row, true));
            }
        }
    } else {
        const i = state.rows.indexOf(row);
        rows = [...state.rows];
        rows[i] = clone(row, !row.selected);
    }

    return { ...state, rows };
}

function toggleSelections(state: AASTableState): AASTableState {
    const rows = [...state.rows];
    if (rows.length > 0) {
        const value = !rows.every(row => row.selected);
        for (let index = 0, n = rows.length; index < n; ++index) {
            const row = rows[index];
            if (row.selected !== value) {
                rows[index] = clone(row, value);
            }
        }
    }

    return { ...state, rows }
}

function clone(row: AASTableRow, selected?: boolean): AASTableRow {
    if (selected === undefined) {
        selected = row.selected;
    }

    return new AASTableRow(
        row.document,
        selected,
        row.expanded,
        row.isLeaf,
        row.level,
        row.firstChild,
        row.nextSibling)
}
