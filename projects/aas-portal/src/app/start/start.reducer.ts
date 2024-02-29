/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { createReducer, on } from '@ngrx/store';
import { ViewMode } from 'aas-lib';
import { AASDocument, AASPage, aas } from 'common';
import * as StartActions from './start.actions';
import { StartState } from './start.state';

const initialState: StartState = {
    viewMode: ViewMode.Undefined,
    limit: 10,
    filter: '',
    documents: [],
    previous: null,
    next: null,
    totalCount: 0,
    favorites: '-',
};

export const startReducer = createReducer(
    initialState,
    on(StartActions.setViewMode, (state, { viewMode }) => setViewMode(state, viewMode)),
    on(StartActions.addTree, (state, { documents }) => addTree(state, documents)),
    on(StartActions.setPage, (state, { page, limit, filter }) => setPage(state, page, limit, filter)),
    on(StartActions.setContent, (state, { document, content }) => setContent(state, document, content)),
    on(StartActions.setFavorites, (state, { name, documents }) => setFavorites(state, name, documents)),
    on(StartActions.removeFavorites, (state, { favorites }) => removeFavorites(state, favorites)),
    on(StartActions.setFilter, (state, { filter }) => setFilter(state, filter)),
);

function setViewMode(state: StartState, viewMode: ViewMode): StartState {
    return { ...state, documents: [], viewMode };
}

function addTree(state: StartState, nodes: AASDocument[]): StartState {
    return { ...state, documents: [...state.documents, ...nodes] };
}

function setPage(state: StartState, page: AASPage, limit: number | undefined, filter: string | undefined): StartState {
    return {
        ...state,
        viewMode: ViewMode.List,
        favorites: '-',
        limit: limit ?? state.limit,
        filter: filter != null ? filter : state.filter,
        documents: page.documents,
        previous: page.previous,
        next: page.next,
    };
}

function setFavorites(state: StartState, favorites: string, documents: AASDocument[]): StartState {
    return { ...state, favorites, documents, viewMode: ViewMode.List };
}

function setContent(state: StartState, document: AASDocument, content: aas.Environment | null | undefined): StartState {
    const documents = [...state.documents];
    const index = documents.findIndex(item => item.endpoint === document.endpoint && item.id === document.id);
    if (index >= 0) {
        documents[index] = { ...document, content };
    }

    return { ...state, documents };
}

function removeFavorites(state: StartState, favorites: AASDocument[]): StartState {
    if (state.favorites === '-') {
        return state;
    }

    const documents = state.documents.filter(document =>
        favorites.every(favorite => document.endpoint !== favorite.endpoint || document.id !== favorite.id),
    );

    return { ...state, documents };
}

function setFilter(state: StartState, filter: string): StartState {
    return { ...state, filter };
}
