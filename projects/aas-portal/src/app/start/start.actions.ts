/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { createAction, props } from '@ngrx/store';
import { ViewMode } from 'projects/aas-lib/src/public-api';

export enum StartActionType {
    SET_VIEW_MODE = '[Start] set View Mode',
    APPLY_FILTER = '[Start] apply filter',
    SET_FILTER = '[Start] set filter',
    SET_LIMIT = '[Start] set limit',
}

export const setViewMode = createAction(
    StartActionType.SET_VIEW_MODE,
    props<{ viewMode: ViewMode }>());

export const setFilter = createAction(
    StartActionType.SET_FILTER,
    props<{ filter: string }>());

export const setLimit = createAction(
    StartActionType.SET_LIMIT,
    props<{ limit: number }>());