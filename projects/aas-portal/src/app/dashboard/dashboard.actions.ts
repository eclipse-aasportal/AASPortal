/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { createAction, props } from "@ngrx/store";
import { DashboardPage, DashboardRow, DashboardState } from "./dashboard.state";

export enum DashboardActionType {
    UPDATE_ROWS = '[Dashboard] update rows',
    TOGGLE_EDIT_MODE = '[Dashboard] toggle edit mode',
    SET_PAGE_NAME = '[Dashboard] set page name',
    SET_PAGES = '[Dashboard] set pages',
    ADD_NEW_PAGE = '[Dashboard] add new page',
    UPDATE_PAGE = '[Dashboard] update page',
    DELETE_PAGE = '[Dashboard] delete page',
    RENAME_PAGE = '[Dashboard] rename page',
    SET_STATE = '[Dashboard] set state'
}

export const updateRows = createAction(
    DashboardActionType.UPDATE_ROWS,
    props<{ rows: DashboardRow[] }>());

export const toggleEditMode = createAction(
    DashboardActionType.TOGGLE_EDIT_MODE);

export const setPageName = createAction(
    DashboardActionType.SET_PAGE_NAME,
    props<{ name: string }>());

export const setPages = createAction(
    DashboardActionType.SET_PAGES,
    props<{ pages: DashboardPage[] }>());

export const updatePage = createAction(
    DashboardActionType.UPDATE_PAGE,
    props<{ page: DashboardPage; rows?: DashboardRow[] }>());

export const addNewPage = createAction(
    DashboardActionType.ADD_NEW_PAGE,
    props<{ name?: string }>());

export const deletePage = createAction(
    DashboardActionType.DELETE_PAGE,
    props<{ page: DashboardPage }>());

export const renamePage = createAction(
    DashboardActionType.RENAME_PAGE,
    props<{ page: DashboardPage; name: string }>());

export const setState = createAction(
    DashboardActionType.SET_STATE,
    props<{ state: DashboardState }>());