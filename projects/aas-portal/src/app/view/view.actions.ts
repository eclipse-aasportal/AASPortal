/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { createAction, props } from '@ngrx/store';
import { TypedAction } from '@ngrx/store/src/models';
import { DocumentSubmodelPair, SubmodelViewDescriptor } from 'projects/aas-lib/src/public-api';

export enum ViewActionType {
    SET_SUBMODELS = '[Submodel] set submodels',
    INIT_VIEW = '[Submodel] init view',
}

export const setSubmodels = createAction(ViewActionType.SET_SUBMODELS, props<{ descriptor: SubmodelViewDescriptor }>());

export const initView = createAction(
    ViewActionType.INIT_VIEW,
    props<{ submodels: DocumentSubmodelPair[]; template?: string }>(),
);

export interface SetSubmodelsAction extends TypedAction<ViewActionType.SET_SUBMODELS> {
    descriptor: SubmodelViewDescriptor;
}
