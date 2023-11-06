/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { createAction, props } from '@ngrx/store';
import { AASPage } from 'common';
import { AASTableRow } from './aas-table.state';
import { TypedAction } from '@ngrx/store/src/models';

export enum AASTableActionType {
    INITIALIZE = '[AASTable] initialize',
    GET_FIRST_PAGE = '[AASTable] get first page',
    GET_NEXT_PAGE = '[AASTable] get next page',
    GET_PREVIOUS_PAGE = '[AASTable] previous next page',
    SET_PAGE = '[AASTable] set page',
    GET_LAST_PAGE = '[AASTable] get last page',

    UPDATE_ROWS = '[AASTable] Update Rows',
    EXPAND = '[AASTable] Expand',
    COLLAPSE = '[AASTable] Collapse',
    TOGGLE_SELECTED = '[AASTable] Toggle selected',
    TOGGLE_SELECTIONS = '[AASTable] Toggle selections'
}

export interface GetPageAction extends TypedAction<AASTableActionType.GET_FIRST_PAGE> {
    limit: number;
    filter?: string;
}

export const initialize = createAction(
    AASTableActionType.INITIALIZE);

export const getFirstPage = createAction(
    AASTableActionType.GET_FIRST_PAGE,
    props<{ limit: number, filter?: string }>());

export const getNextPage = createAction(
    AASTableActionType.GET_NEXT_PAGE,
    props<{ limit: number, filter?: string }>());

export const getPreviousPage = createAction(
    AASTableActionType.GET_PREVIOUS_PAGE,
    props<{ limit: number, filter?: string }>());

export const getLastPage = createAction(
    AASTableActionType.GET_LAST_PAGE,
    props<{ limit: number, filter?: string }>());

export const setPage = createAction(
    AASTableActionType.SET_PAGE,
    props<{ page: AASPage }>());

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
