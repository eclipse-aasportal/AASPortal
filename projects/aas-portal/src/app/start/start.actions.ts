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
    SET_VIEW_MODE = '[Start] Set View Mode',
    SET_SHOW_ALL = '[Start] Set Show All',
    SET_FILTER = '[Start] Set filter',
}

export const setViewMode = createAction(
    StartActionType.SET_VIEW_MODE,
    props<{ viewMode: ViewMode }>());

export const setShowAll = createAction(
    StartActionType.SET_SHOW_ALL,
    props<{ showAll: boolean }>());

export const setFilter = createAction(
    StartActionType.SET_FILTER,
    props<{ filter: string }>());