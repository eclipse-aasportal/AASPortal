/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { createAction, props } from '@ngrx/store';
import { AASDocument, AASPage, aas } from 'common';
import { SortDirection } from '../sortable-header.directive';
import { AASTableRow } from './aas-table.state';
import { ViewMode } from '../types/view-mode';
import { TypedAction } from '@ngrx/store/src/models';

export enum AASTableActionType {
    INITIALIZE = '[AASTable] initialize',
    GET_FIRST_PAGE = '[AASTable] get first page',
    GET_NEXT_PAGE = '[AASTable] get next page',
    GET_PREVIOUS_PAGE = '[AASTable] previous next page',
    SET_PAGE = '[AASTable] set page',
    GET_LAST_PAGE = '[AASTable] get last page',
    SET_DOCUMENT_CONTENT = '[AASTable] set document content',

    UPDATE_ROWS = '[AASTable] Update Rows',
    SET_VIEW_MODE = '[AASTable] Set view mode',
    SET_SORT_PARAMETER = '[AASTable] Set sort parameter',
    SET_FILTER = '[AASTable] Set filter',
    EXPAND = '[AASTable] Expand',
    COLLAPSE = '[AASTable] Collapse',
    TOGGLE_SELECTED = '[AASTable] Toggle selected',
    TOGGLE_SELECTIONS = '[AASTable] Toggle selections'
}

export interface ApplyDocumentAction extends TypedAction<AASTableActionType.GET_FIRST_PAGE> {
    filter?: string;
}

export const initialize = createAction(
    AASTableActionType.INITIALIZE);

export const getFirstPage = createAction(
    AASTableActionType.GET_FIRST_PAGE,
    props<{ filter?: string }>());

export const getNextPage = createAction(
    AASTableActionType.GET_NEXT_PAGE);

export const getPreviousPage = createAction(
    AASTableActionType.GET_PREVIOUS_PAGE);

export const getLastPage = createAction(
    AASTableActionType.GET_LAST_PAGE);


export const setPage = createAction(
    AASTableActionType.SET_PAGE,
    props<{ page: AASPage }>());

export const setDocumentContent = createAction(
    AASTableActionType.SET_DOCUMENT_CONTENT,
    props<{ document: AASDocument; content?: aas.Environment }>());

export const updateRows = createAction(
    AASTableActionType.UPDATE_ROWS,
    props<{ documents: AASDocument[] }>());

export const setViewMode = createAction(
    AASTableActionType.SET_VIEW_MODE,
    props<{ documents: AASDocument[]; viewMode: ViewMode }>());

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
