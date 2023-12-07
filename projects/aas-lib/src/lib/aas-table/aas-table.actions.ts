/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { createAction, props } from '@ngrx/store';
import { TypedAction } from '@ngrx/store/src/models';
import { AASDocument } from 'common';
import { AASTableRow } from './aas-table.state';

export enum AASTableActionType {
    SET_PAGE = '[AASTable] set page',
    EXPAND = '[AASTable] expand',
    COLLAPSE = '[AASTable] collapse',
    TOGGLE_SELECTED = '[AASTable] toggle selected',
    TOGGLE_SELECTIONS = '[AASTable] toggle selections',
    SET_SELECTIONS = '[AASTable] set selections',
    UPDATE_LIST_VIEW = '[AASTable] update list view',
    UPDATE_TREE_VIEW = '[AASTable] update tree view',
}

export interface UpdateListViewAction extends TypedAction<AASTableActionType.UPDATE_LIST_VIEW> {
    documents: AASDocument[];
}

export interface UpdateTreeViewAction extends TypedAction<AASTableActionType.UPDATE_TREE_VIEW> {
    documents: AASDocument[];
}

export const updateListView = createAction(
    AASTableActionType.UPDATE_LIST_VIEW,
    props<{ documents: AASDocument[] }>());

export const updateTreeView = createAction(
    AASTableActionType.UPDATE_TREE_VIEW,
    props<{ documents: AASDocument[] }>());

export const setRows = createAction(
    AASTableActionType.SET_PAGE,
    props<{ rows: AASTableRow[] }>());

export const toggleSelected = createAction(
    AASTableActionType.TOGGLE_SELECTED,
    props<{ row: AASTableRow, altKey: boolean, shiftKey: boolean }>());

export const toggleSelections = createAction(
    AASTableActionType.TOGGLE_SELECTIONS);

export const setSelections = createAction(
    AASTableActionType.SET_SELECTIONS,
    props<{ documents: AASDocument[] }>());

export const expandRow = createAction(
    AASTableActionType.EXPAND,
    props<{ row: AASTableRow }>());

export const collapseRow = createAction(
    AASTableActionType.COLLAPSE,
    props<{ row: AASTableRow }>());
