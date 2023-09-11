/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { createAction, props } from '@ngrx/store';
import { AASDocument } from 'common';
import { SortDirection } from '../sortable-header.directive';
import { AASTableRow } from './aas-table.state';
import { ViewMode } from '../types/view-mode';

export enum AASTableActionType {
    UPDATE_ROWS = '[AASTable] Update Rows',
    SET_VIEW_MODE = '[AASTable] Set view mode',
    SET_SHOW_ALL = '[AASTable] Set show all',
    SET_SORT_PARAMETER = '[AASTable] Set sort parameter',
    SET_FILTER = '[AASTable] Set filter',
    EXPAND = '[AASTable] Expand',
    COLLAPSE = '[AASTable] Collapse',
    TOGGLE_SELECTED = '[AASTable] Toggle selected',
    TOGGLE_SELECTIONS = '[AASTable] Toggle selections'
}

export const updateRows = createAction(
    AASTableActionType.UPDATE_ROWS,
    props<{ documents: AASDocument[] }>());

export const setViewMode = createAction(
    AASTableActionType.SET_VIEW_MODE,
    props<{ documents: AASDocument[]; viewMode: ViewMode }>());

export const setShowAll = createAction(
    AASTableActionType.SET_SHOW_ALL,
    props<{ documents: AASDocument[]; showAll: boolean }>());

export const setFilter = createAction(
    AASTableActionType.SET_FILTER,
    props<{ filter?: string }>());

export const setSortParameter = createAction(
    AASTableActionType.SET_SORT_PARAMETER,
    props<{ column: string; direction: SortDirection }>());

export const expandRow = createAction(
    AASTableActionType.EXPAND,
    props<{ row: AASTableRow }>());

export const collapseRow = createAction(
    AASTableActionType.COLLAPSE,
    props<{ row: AASTableRow }>());

export const toggleSelected = createAction(
    AASTableActionType.TOGGLE_SELECTED,
    props<{ row: AASTableRow }>());

export const toggleSelections = createAction(
    AASTableActionType.TOGGLE_SELECTIONS);
