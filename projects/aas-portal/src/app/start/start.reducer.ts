/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { createReducer, on } from '@ngrx/store';
import { ViewMode } from 'projects/aas-lib/src/public-api';
import * as StartActions from './start.actions';
import { StartState } from './start.state';

const initialState: StartState = {
    viewMode: ViewMode.List,
    limit: 10,
    filter: ''
};

export const startReducer = createReducer(
    initialState,
    on(
        StartActions.setFilter,
        (state, { filter }) => setFilter(state, filter)
    ),
    on(
        StartActions.setLimit,
        (state, { limit }) => setLimit(state, limit)
    ),
    on(
        StartActions.setViewMode,
        (state, { viewMode }) => setViewMode(state, viewMode)
    )
)

function setViewMode(state: StartState, viewMode: ViewMode): StartState {
    return { ...state, viewMode };
}

function setFilter(state: StartState, filter: string): StartState {
    return { ...state, filter };
}

function setLimit(state: StartState, limit: number): StartState {
    return { ...state, limit };
}