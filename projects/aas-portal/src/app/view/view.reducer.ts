/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { createReducer, on } from "@ngrx/store";
import { DocumentSubmodelPair } from 'aas-lib';
import * as ViewActions from "./view.actions";
import { ViewState } from "./view.state";

const initialState: ViewState = {
    submodels: []
};

export const viewReducer = createReducer(
    initialState,
    on(
        ViewActions.initView,
        (state, { submodels, template }) => initView(state, submodels, template)
    )
);

function initView(state: ViewState, submodels: DocumentSubmodelPair[], template: string | undefined): ViewState {
    return { ...state, submodels, template };
}
