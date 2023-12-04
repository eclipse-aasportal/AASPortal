/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { createAction, props } from '@ngrx/store';
import { AASDocument, AASDocumentNode, AASPage, aas } from 'common';
import { AASTableRow } from './aas-table.state';
import { TypedAction } from '@ngrx/store/src/models';

export enum AASTableActionType {
    INIT_LIST_VIEW = '[AASTable] init list view',
    GET_FIRST_PAGE = '[AASTable] get first page',
    GET_NEXT_PAGE = '[AASTable] get next page',
    GET_PREVIOUS_PAGE = '[AASTable] previous next page',
    SET_PAGE = '[AASTable] set page',
    GET_LAST_PAGE = '[AASTable] get last page',
    SET_CONTENT = '[AASTable] set content',
    UPDATE_ROWS = '[AASTable] update Rows',
    EXPAND = '[AASTable] expand',
    COLLAPSE = '[AASTable] collapse',
    TOGGLE_SELECTED = '[AASTable] toggle selected',
    TOGGLE_SELECTIONS = '[AASTable] toggle selections',
    ADD_ROOT = '[AASTable] add root',
    INIT_TREE_VIEW = '[AASTable] init tree view',
    SET_SELECTIONS = '[AASTable] set selections',
}

export interface GetFirstPageAction extends TypedAction<AASTableActionType.GET_FIRST_PAGE> {
    limit: number;
    filter?: string;
}

export interface GetLastPageAction extends TypedAction<AASTableActionType.GET_LAST_PAGE> {
    limit: number;
    filter?: string;
}

export interface GetPreviousPageAction extends TypedAction<AASTableActionType.GET_PREVIOUS_PAGE> {
    limit: number;
    filter?: string;
}

export interface GetNextPageAction extends TypedAction<AASTableActionType.GET_NEXT_PAGE> {
    limit: number;
    filter?: string;
}

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

export const setContent = createAction(
    AASTableActionType.SET_CONTENT,
    props<{ document: AASDocument, content: aas.Environment }>());

export const expandRow = createAction(
    AASTableActionType.EXPAND,
    props<{ row: AASTableRow }>());

export const collapseRow = createAction(
    AASTableActionType.COLLAPSE,
    props<{ row: AASTableRow }>());

export const toggleSelected = createAction(
    AASTableActionType.TOGGLE_SELECTED,
    props<{ row: AASTableRow, altKey: boolean, shiftKey: boolean }>());

export const toggleSelections = createAction(
    AASTableActionType.TOGGLE_SELECTIONS);

export const addRoot = createAction(
    AASTableActionType.ADD_ROOT,
    props<{ nodes: AASDocumentNode[] }>());

export const initTreeView = createAction(
    AASTableActionType.INIT_TREE_VIEW);

export const setSelections = createAction(
    AASTableActionType.SET_SELECTIONS,
    props<{ documents: AASDocument[] }>());