/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { createReducer, on } from '@ngrx/store';
import { AASDocument, aas } from 'common';

import { AASTree, AASTreeRow, AASTreeState, SearchTerm } from './aas-tree.state';
import * as AASTreeActions from './aas-tree.actions';

const initialState: AASTreeState = {
    rows: [],
    index: -1,
    terms: [],
    error: null,
};

export const aasTreeReducer = createReducer(
    initialState,
    on(AASTreeActions.collapse, state => collapse(state)),
    on(AASTreeActions.collapseRow, (state, { row }) => collapseRow(state, row)),
    on(AASTreeActions.expandRow, (state, { arg }) => expandRow(state, arg)),
    on(AASTreeActions.setMatchIndex, (state, { index }) => setMatchIndex(state, index)),
    on(AASTreeActions.setSearchText, (state, { terms }) => setSearchText(state, terms)),
    on(AASTreeActions.toggleSelected, (state, { row, altKey, shiftKey }) =>
        toggleSelected(state, row, altKey, shiftKey),
    ),
    on(AASTreeActions.toggleSelections, state => toggleSelections(state)),
    on(AASTreeActions.updateRows, (state, { document, localeId }) => updateRows(state, document, localeId)),
    on(AASTreeActions.setSelectedElements, (state, { elements }) => setSelectedElements(state, elements)),
);

function updateRows(state: AASTreeState, document: AASDocument | null, localeId: string): AASTreeState {
    try {
        if (document) {
            const tree = AASTree.from(document, localeId);
            return { ...state, rows: tree.nodes, error: null };
        }

        return { ...state, rows: [], index: -1, error: null };
    } catch (error) {
        return { ...state, error };
    }
}

function expandRow(state: AASTreeState, arg: number | AASTreeRow): AASTreeState {
    const tree = new AASTree(state.rows);
    tree.expand(arg);
    return { ...state, rows: tree.nodes, error: null };
}

function collapseRow(state: AASTreeState, row: AASTreeRow): AASTreeState {
    const tree = new AASTree(state.rows);
    tree.collapse(row);
    return { ...state, rows: tree.nodes, error: null };
}

function collapse(state: AASTreeState): AASTreeState {
    const tree = new AASTree(state.rows);
    tree.collapse();
    return { ...state, rows: tree.nodes, error: null };
}

function toggleSelected(state: AASTreeState, row: AASTreeRow, altKey: boolean, shiftKey: boolean): AASTreeState {
    const tree = new AASTree(state.rows);
    tree.toggleSelected(row, altKey, shiftKey);
    return { ...state, rows: tree.nodes, error: null };
}

function toggleSelections(state: AASTreeState): AASTreeState {
    const tree = new AASTree(state.rows);
    tree.toggleSelections();
    return { ...state, rows: tree.nodes, error: null };
}

function setSelectedElements(state: AASTreeState, elements: aas.Referable[]): AASTreeState {
    const tree = new AASTree(state.rows);
    tree.selectedElements = elements;
    return { ...state, rows: tree.nodes };
}

function setSearchText(state: AASTreeState, terms: SearchTerm[]): AASTreeState {
    return { ...state, index: -1, terms };
}

function setMatchIndex(state: AASTreeState, index: number): AASTreeState {
    const tree = new AASTree(state.rows);
    tree.highlight(index);
    return { ...state, rows: tree.nodes, index };
}
