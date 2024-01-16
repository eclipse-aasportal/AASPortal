/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { createReducer, on } from '@ngrx/store';
import * as MessageTableActions from './message-table.actions';
import { MessageTableState } from './message-table.state';

const initialState: MessageTableState = {
    showInfo: false,
    showWarning: false,
    showError: true,
    column: '',
    direction: '',
};

export const messageTableReducer = createReducer(
    initialState,
    on(MessageTableActions.setSortParameter, (state, { column, direction }) =>
        setSortParameter(state, column, direction),
    ),
    on(MessageTableActions.toggleShowError, state => toggleShowError(state)),
    on(MessageTableActions.toggleShowInfo, state => toggleShowInfo(state)),
    on(MessageTableActions.toggleShowWarning, state => toggleShowWarning(state)),
);

function setSortParameter(state: MessageTableState, column: string, direction: string): MessageTableState {
    return { ...state, column, direction };
}

function toggleShowError(state: MessageTableState): MessageTableState {
    return { ...state, showError: !state.showError };
}

function toggleShowInfo(state: MessageTableState): MessageTableState {
    return { ...state, showInfo: !state.showInfo };
}

function toggleShowWarning(state: MessageTableState): MessageTableState {
    return { ...state, showWarning: !state.showWarning };
}
