/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { createReducer, on } from '@ngrx/store';
import { AASDocument, AASPage } from 'common';
import * as AASTableActions from './aas-table.actions';
import { AASTableRow, AASTableState } from './aas-table.state';

// interface Tuple {
//     targets: AASDocument[];
//     current: AASDocument;
//     sources: AASDocument[];
// }

const initialState: AASTableState = {
    initialized: false,
    isFirstPage: false,
    isLastPage: false,
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
        AASTableActions.toggleSelected,
        (state, { row, altKey, shiftKey }) => toggleSelected(state, row, altKey, shiftKey)
    ),
    on(
        AASTableActions.toggleSelections,
        (state) => toggleSelections(state)
    )
);

function setPage(state: AASTableState, page: AASPage): AASTableState {
    return {
        ...state,
        initialized: true,
        rows: initList(page.documents),
        isFirstPage: page.isFirst,
        isLastPage: page.isLast
    };
}

function initList(documents: AASDocument[]): AASTableRow[] {
    const rows: AASTableRow[] = [];
    for (const document of documents) {
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

    return rows;
}

// function initTree(documents: AASDocument[]): AASTableRow[] {
//     const rows: AASTableRow[] = [];
//     const map = new Map<string, Tuple>();
//     for (const document of documents) {
//         if (document.content) {
//             map.set(document.id, { targets: [], current: document, sources: [] });
//         }
//     }

//     for (const entry of map) {
//         const env = entry[1].current.content;
//         if (env) {
//             for (const referable of where(env.submodels)) {
//                 if (referable && referable.modelType === 'ReferenceElement') {
//                     const tuple = map.get((referable as aas.ReferenceElement).value.keys[0].value);
//                     if (tuple) {
//                         entry[1].sources.push(tuple.current);
//                         tuple.targets.push(entry[1].current);
//                     }
//                 }
//             }
//         }
//     }

//     let previous: AASTableRow | null = null;
//     for (const entry of map) {
//         if (entry[1].targets.length === 0) {
//             const root = entry[1].current;
//             const row = new AASTableRow(
//                 root,
//                 false,
//                 root.idShort,
//                 root.id,
//                 root.endpoint.type,
//                 false,
//                 entry[1].sources.length === 0,
//                 0,
//                 -1,
//                 -1
//             );

//             if (previous) {
//                 previous.nextSibling = rows.length - 1;
//             }

//             rows.push(row);

//             if (!row.isLeaf && entry[1].sources.length > 0) {
//                 row.firstChild = rows.length;
//                 traverse(root, rows, 1);
//             }

//             previous = row;
//         }
//     }

//     return rows;

//     function* where(elements: aas.Referable[]): Generator<aas.Referable> {
//         const stack: aas.Referable[][] = [];
//         stack.push(elements);
//         while (stack.length > 0) {
//             const children = stack.pop() as aas.Referable[];
//             for (const child of children) {
//                 if (child.modelType === 'ReferenceElement') {
//                     const value = child as aas.ReferenceElement;
//                     if (value && value.value.keys.some(item => item.type === 'AssetAdministrationShell')) {
//                         yield child;
//                     }
//                 }

//                 const children = getChildren(child);
//                 if (children.length > 0) {
//                     stack.push(children);
//                 }
//             }
//         }
//     }

//     function traverse(parent: AASDocument, rows: AASTableRow[], level: number): void {
//         let previous: AASTableRow | null = null;
//         for (const child of map.get(parent.id)!.sources) {
//             const tuple = map.get(child.id)!;
//             const row = new AASTableRow(
//                 child,
//                 false,
//                 child.idShort,
//                 child.id,
//                 child.endpoint.type,
//                 false,
//                 tuple.sources.length === 0,
//                 level,
//                 -1,
//                 -1
//             );

//             rows.push(row);
//             if (previous) {
//                 previous.nextSibling = rows.length - 1;
//             }

//             if (tuple.sources.length > 0) {
//                 row.firstChild = rows.length;
//                 traverse(child, rows, level + 1);
//             }

//             previous = row;
//         }
//     }
// }

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

// function toggleSelected(state: AASTableState, row: AASTableRow) {
//     const rows = [...state.rows];
//     const index = rows.indexOf(row);
//     rows[index] = new AASTableRow(
//         row.document,
//         !row.selected,
//         row.expanded,
//         row.isLeaf,
//         row.level,
//         row.firstChild,
//         row.nextSibling);

//     return { ...state, rows }
// }

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

function toggleSelections(state: AASTableState) {
    const value = state.rows.length > 0 && state.rows.some(row => row.selected) &&
        !state.rows.every(row => row.selected);

    const rows = [...state.rows];
    for (let index = 0; index < rows.length; ++index) {
        const row = rows[index];
        if (row.selected !== value) {
            rows[index] = clone(row, value);
        }
    }

    return { ...state, rows }
}

function clone(row: AASTableRow, selected: boolean): AASTableRow {
    return new AASTableRow(
        row.document,
        selected,
        row.expanded,
        row.isLeaf,
        row.level,
        row.firstChild,
        row.nextSibling)
}
