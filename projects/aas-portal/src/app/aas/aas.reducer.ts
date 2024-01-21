/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { createReducer, on } from '@ngrx/store';
import { AASDocument, TemplateDescriptor } from 'common';
import * as AASActions from './aas.actions';
import { AASState, initialState } from './aas.state';

export const aasReducer = createReducer(
    initialState,
    on(AASActions.applyDocument, (state, { document }) => applyDocument(state, document)),
    on(AASActions.resetModified, (state, { document }) => resetModified(state, document)),
    on(AASActions.setDocument, (state, { document }) => setDocument(state, document)),
    on(AASActions.setSearch, (state, { search }) => setSearch(state, search)),
    on(AASActions.setTemplateStorage, (state, { templates }) => setTemplateStorage(state, templates)),
);

function setTemplateStorage(state: AASState, templates: TemplateDescriptor[]): AASState {
    return { ...state, templateStorage: { templates, timestamp: Date.now() }, error: null };
}

function setDocument(state: AASState, document: AASDocument | null): AASState {
    return { ...state, document, error: null };
}

function applyDocument(state: AASState, document: AASDocument): AASState {
    return { ...state, document: { ...document, modified: true }, error: null };
}

function resetModified(state: AASState, document: AASDocument): AASState {
    return { ...state, document: { ...document, modified: false }, error: null };
}

function setSearch(state: AASState, search: string): AASState {
    return { ...state, search };
}