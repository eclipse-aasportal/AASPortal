/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { createReducer, on } from '@ngrx/store';
import { ViewMode } from 'projects/aas-lib/src/public-api';
import { AASDocument, AASPage, aas } from 'common';
import * as StartActions from './start.actions';
import { StartState } from './start.state';

const initialState: StartState = {
    viewMode: ViewMode.Undefined,
    limit: 10,
    filter: '',
    documents: [],
    isFirstPage: false,
    isLastPage: false,
    totalCount: 0,
};

export const startReducer = createReducer(
    initialState,
    on(
        StartActions.setDocuments,
        (state, { documents }) => setDocuments(state, documents)
    ),
    on(
        StartActions.appendDocuments,
        (state, { documents }) => appendDocuments(state, documents)
    ),
    on(
        StartActions.setPage,
        (state, { page, limit, filter }) => setPage(state, page, limit, filter)
    ),
    on(
        StartActions.setContent,
        (state, { document, content }) => setContent(state, document, content)
    ),
)

function setDocuments(state: StartState, documents: AASDocument[]): StartState {
    return { ...state, documents, viewMode: ViewMode.Tree };
}

function appendDocuments(state: StartState, documents: AASDocument[]): StartState {
    return { ...state, documents: [...state.documents, ...documents] };
}

function setPage(state: StartState, page: AASPage, limit: number | undefined, filter: string | undefined): StartState {
    return {
        ...state,
        viewMode: ViewMode.List,
        limit: limit ?? state.limit,
        filter: filter ?? state.filter,
        documents: page.documents,
        isFirstPage: page.previous === null,
        isLastPage: page.next === null,
        totalCount: page.totalCount,
    };
}

function setContent(state: StartState, document: AASDocument, content: aas.Environment): StartState {
    const documents = [...state.documents];
    const index = documents.findIndex(item => item.endpoint === document.endpoint && item.id === document.id);
    if (index >= 0) {
        documents[index] = { ...document, content }
    }

    return { ...state, documents };
}
