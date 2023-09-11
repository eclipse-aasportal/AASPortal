/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { createReducer, on } from '@ngrx/store';
import { aas, AASDocument, getChildren } from 'common';
import { ViewMode } from '../types/view-mode';
import * as AASTableActions from './aas-table.actions';
import { AASTableRow, AASTableState } from './aas-table.state';
import { SortDirection } from '../sortable-header.directive';

interface Tuple {
    targets: AASDocument[];
    current: AASDocument;
    sources: AASDocument[];
}

const initialState: AASTableState = {
    column: '',
    direction: '',
    rows: [],
    viewMode: ViewMode.List,
    showAll: false
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
        AASTableActions.setSortParameter,
        (state, { column, direction }) => setSortParameter(state, column, direction)
    ),
    on(
        AASTableActions.toggleSelected,
        (state, { row }) => toggleSelected(state, row)
    ),
    on(
        AASTableActions.toggleSelections,
        (state) => toggleSelections(state)
    ),
    on(
        AASTableActions.updateRows,
        (state, { documents }) => updateRows(state, documents)
    ),
    on(
        AASTableActions.setViewMode,
        (state, { documents, viewMode }) => setViewMode(state, documents, viewMode)
    ),
    on(
        AASTableActions.setShowAll,
        (state, { documents, showAll }) => setShowAll(state, documents, showAll)
    ),
    on(
        AASTableActions.setFilter,
        (state, { filter }) => setFilter(state, filter)
    )
);

function updateRows(state: AASTableState, documents: AASDocument[]): AASTableState {
    let rows: AASTableRow[];
    if (state.viewMode === ViewMode.List) {
        rows = initList(documents, state.showAll);
    } else {
        rows = initTree(documents, state.showAll);
    }

    return { ...state, rows };
}

function setViewMode(state: AASTableState, documents: AASDocument[], viewMode: ViewMode): AASTableState {
    let rows: AASTableRow[];
    if (viewMode === ViewMode.List) {
        rows = initList(documents, state.showAll);
    } else {
        rows = initTree(documents, state.showAll);
    }

    return { ...state, rows, viewMode };
}

function setShowAll(state: AASTableState, documents: AASDocument[], showAll: boolean): AASTableState {
    let rows: AASTableRow[];
    if (state.viewMode === ViewMode.List) {
        rows = initList(documents, showAll);
    } else {
        rows = initTree(documents, showAll);
    }

    return { ...state, rows, showAll };
}

function setFilter(state: AASTableState, filter?: string): AASTableState {
    return { ...state, filter };
}

function initList(documents: ReadonlyArray<AASDocument>, showAll: boolean): AASTableRow[] {
    const rows: AASTableRow[] = [];
    for (const document of documents) {
        if (showAll || document.content !== undefined) {
            const row = new AASTableRow(
                document,
                false,
                document.idShort,
                document.id,
                document.endpoint.type,
                false,
                false,
                0,
                -1,
                -1);

            rows.push(row);
        }
    }

    return rows;
}

function initTree(documents: AASDocument[], showAll: boolean): AASTableRow[] {
    const rows: AASTableRow[] = [];
    const map = new Map<string, Tuple>();
    for (const document of documents) {
        if (showAll || document.content) {
            map.set(document.id, { targets: [], current: document, sources: [] });
        }
    }

    for (const entry of map) {
        const env = entry[1].current.content;
        if (env) {
            for (const referable of where(env.submodels)) {
                if (referable && referable.modelType === 'ReferenceElement') {
                    const tuple = map.get((referable as aas.ReferenceElement).value.keys[0].value);
                    if (tuple) {
                        entry[1].sources.push(tuple.current);
                        tuple.targets.push(entry[1].current);
                    }
                }
            }
        }
    }

    let previous: AASTableRow | null = null;
    for (const entry of map) {
        if (entry[1].targets.length === 0) {
            const root = entry[1].current;
            const row = new AASTableRow(
                root,
                false,
                root.idShort,
                root.id,
                root.endpoint.type,
                false,
                entry[1].sources.length === 0,
                0,
                -1,
                -1
            );

            if (previous) {
                previous.nextSibling = rows.length - 1;
            }

            rows.push(row);

            if (!row.isLeaf && entry[1].sources.length > 0) {
                row.firstChild = rows.length;
                traverse(root, rows, 1);
            }

            previous = row;
        }
    }

    return rows;

    function* where(elements: aas.Referable[]): Generator<aas.Referable> {
        const stack: aas.Referable[][] = [];
        stack.push(elements);
        while (stack.length > 0) {
            const children = stack.pop() as aas.Referable[];
            for (const child of children) {
                if (child.modelType === 'ReferenceElement') {
                    const value = child as aas.ReferenceElement;
                    if (value && value.value.keys.some(item => item.type === 'AssetAdministrationShell')) {
                        yield child;
                    }
                }

                const children = getChildren(child);
                if (children.length > 0) {
                    stack.push(children);
                }
            }
        }
    }

    function traverse(parent: AASDocument, rows: AASTableRow[], level: number): void {
        let previous: AASTableRow | null = null;
        for (const child of map.get(parent.id)!.sources) {
            const tuple = map.get(child.id)!;
            const row = new AASTableRow(
                child,
                false,
                child.idShort,
                child.id,
                child.endpoint.type,
                false,
                tuple.sources.length === 0,
                level,
                -1,
                -1
            );

            rows.push(row);
            if (previous) {
                previous.nextSibling = rows.length - 1;
            }

            if (tuple.sources.length > 0) {
                row.firstChild = rows.length;
                traverse(child, rows, level + 1);
            }

            previous = row;
        }
    }
}

function setSortParameter(state: AASTableState, column: string, direction: SortDirection): AASTableState {
    return { ...state, column, direction };
}

function expandRow(state: AASTableState, row: AASTableRow): AASTableState {
    const rows = [...state.rows];
    const index = rows.indexOf(row);
    rows[index] = new AASTableRow(
        row.document,
        false,
        row.name,
        row.id,
        row.type,
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
        row.name,
        row.id,
        row.type,
        false,
        row.isLeaf,
        row.level,
        row.firstChild,
        row.nextSibling);

    return { ...state, rows };
}

function toggleSelected(state: AASTableState, row: AASTableRow) {
    const rows = [...state.rows];
    const index = rows.indexOf(row);
    rows[index] = new AASTableRow(
        row.document,
        !row.selected,
        row.name,
        row.id,
        row.type,
        row.expanded,
        row.isLeaf,
        row.level,
        row.firstChild,
        row.nextSibling);

    return { ...state, rows }
}

function toggleSelections(state: AASTableState) {
    const value = !state.rows.some(row => row.selected);
    const rows = [...state.rows];
    for (let index = 0; index < rows.length; ++index) {
        const row = rows[index];
        if (row.selected !== value) {
            rows[index] = new AASTableRow(
                row.document,
                !row.selected,
                row.name,
                row.id,
                row.type,
                row.expanded,
                row.isLeaf,
                row.level,
                row.firstChild,
                row.nextSibling);
        }
    }

    return { ...state, rows }
}