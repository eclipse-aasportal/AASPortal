/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { createReducer, on } from '@ngrx/store';
import { AASDocument } from 'common';
import * as AASTableActions from './aas-table.actions';
import { AASTableRow, AASTableState } from './aas-table.state';
import { ViewMode } from '../types/view-mode';

const initialState: AASTableState = {
    viewMode: ViewMode.List,
    rows: [],
};

export const aasTableReducer = createReducer(
    initialState,
    on(AASTableActions.setViewMode, (state, { viewMode }) => setViewMode(state, viewMode)),
    on(AASTableActions.collapseRow, (state, { row }) => collapseRow(state, row)),
    on(AASTableActions.expandRow, (state, { row }) => expandRow(state, row)),
    on(AASTableActions.setRows, (state, { rows }) => setRows(state, rows)),
    on(AASTableActions.toggleSelected, (state, { row, altKey, shiftKey }) =>
        toggleSelected(state, row, altKey, shiftKey),
    ),
    on(AASTableActions.toggleSelections, state => toggleSelections(state)),
    on(AASTableActions.setSelections, (state, { documents }) => setSelections(state, documents)),
    on(AASTableActions.setFilter, (state, { filter }) => setFilter(state, filter)),
);

function setViewMode(state: AASTableState, viewMode: ViewMode): AASTableState {
    return state.viewMode !== viewMode ? { ...state, rows: [], viewMode } : state;
}
function setRows(state: AASTableState, rows: AASTableRow[]): AASTableState {
    return { ...state, rows };
}

function setSelections(state: AASTableState, documents: AASDocument[]): AASTableState {
    const rows = [...state.rows];
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

function toggleSelected(state: AASTableState, row: AASTableRow, altKey: boolean, shiftKey: boolean): AASTableState {
    let rows: AASTableRow[];
    if (altKey) {
        rows = state.rows.map(item =>
            item === row ? clone(row, !row.selected) : item.selected ? clone(item, false) : item,
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

    return { ...state, rows };
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
        row.nextSibling,
    );
}

function expandRow(state: AASTableState, row: AASTableRow): AASTableState {
    const rows = [...state.rows];
    const index = rows.indexOf(row);
    rows[index] = new AASTableRow(row.document, false, true, row.isLeaf, row.level, row.firstChild, row.nextSibling);

    return { ...state, rows };
}

function collapseRow(state: AASTableState, row: AASTableRow): AASTableState {
    const rows = [...state.rows];
    const index = rows.indexOf(row);
    rows[index] = new AASTableRow(row.document, false, false, row.isLeaf, row.level, row.firstChild, row.nextSibling);

    return { ...state, rows };
}

function setFilter(state: AASTableState, filter?: string): AASTableState {
    return { ...state, filter };
}
