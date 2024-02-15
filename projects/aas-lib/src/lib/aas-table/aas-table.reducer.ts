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
import { AASTableRow, AASTableState, AASTableTree } from './aas-table.state';
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
    const tree = new AASTableTree(state.rows);
    tree.selectedElements = documents;
    return { ...state, rows: tree.nodes };
}

function toggleSelected(state: AASTableState, row: AASTableRow, altKey: boolean, shiftKey: boolean): AASTableState {
    const tree = new AASTableTree(state.rows);
    tree.toggleSelected(row, altKey, shiftKey);
    return { ...state, rows: tree.nodes };
}

function toggleSelections(state: AASTableState): AASTableState {
    const tree = new AASTableTree(state.rows);
    tree.toggleSelections();
    return { ...state, rows: tree.nodes };
}

function expandRow(state: AASTableState, row: AASTableRow): AASTableState {
    const tree = new AASTableTree(state.rows);
    tree.expand(row);
    return { ...state, rows: tree.nodes };
}

function collapseRow(state: AASTableState, row: AASTableRow): AASTableState {
    const tree = new AASTableTree(state.rows);
    tree.collapse(row);
    return { ...state, rows: tree.nodes };
}

function setFilter(state: AASTableState, filter?: string): AASTableState {
    return { ...state, filter };
}
