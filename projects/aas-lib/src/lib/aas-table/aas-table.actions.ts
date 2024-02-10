/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { createAction, props } from '@ngrx/store';
import { TypedAction } from '@ngrx/store/src/models';
import { AASDocument } from 'common';
import { AASTableRow } from './aas-table.state';
import { ViewMode } from '../types/view-mode';

export enum AASTableActionType {
    SET_VIEW_MODE = '[AASTable] set view mode',
    SET_PAGE = '[AASTable] set page',
    EXPAND = '[AASTable] expand',
    COLLAPSE = '[AASTable] collapse',
    TOGGLE_SELECTED = '[AASTable] toggle selected',
    TOGGLE_SELECTIONS = '[AASTable] toggle selections',
    SET_SELECTIONS = '[AASTable] set selections',
    UPDATE_VIEW = '[AASTable] update view',
}

export interface UpdateViewAction extends TypedAction<AASTableActionType.UPDATE_VIEW> {
    documents: AASDocument[];
}

export const setViewMode = createAction(AASTableActionType.SET_VIEW_MODE, props<{ viewMode: ViewMode }>());

export const updateView = createAction(AASTableActionType.UPDATE_VIEW, props<{ documents: AASDocument[] }>());

export const setRows = createAction(AASTableActionType.SET_PAGE, props<{ rows: AASTableRow[] }>());

export const toggleSelected = createAction(
    AASTableActionType.TOGGLE_SELECTED,
    props<{ row: AASTableRow; altKey: boolean; shiftKey: boolean }>(),
);

export const toggleSelections = createAction(AASTableActionType.TOGGLE_SELECTIONS);

export const setSelections = createAction(AASTableActionType.SET_SELECTIONS, props<{ documents: AASDocument[] }>());

export const expandRow = createAction(AASTableActionType.EXPAND, props<{ row: AASTableRow }>());

export const collapseRow = createAction(AASTableActionType.COLLAPSE, props<{ row: AASTableRow }>());
