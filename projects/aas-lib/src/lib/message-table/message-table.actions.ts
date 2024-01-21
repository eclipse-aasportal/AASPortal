/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { createAction, props } from '@ngrx/store';

export enum MessageTableActionType {
    SET_SORT_PARAMETER = '[MessageTable] set sort parameter',
    TOGGLE_SHOW_INFO = '[MessageTable] toggle show info',
    TOGGLE_SHOW_WARNING = '[MessageTable] toggle show warning',
    TOGGLE_SHOW_ERROR = '[MessageTable] toggle show error',
}

export const setSortParameter = createAction(
    MessageTableActionType.SET_SORT_PARAMETER,
    props<{ column: string; direction: string }>(),
);

export const toggleShowInfo = createAction(MessageTableActionType.TOGGLE_SHOW_INFO);

export const toggleShowWarning = createAction(MessageTableActionType.TOGGLE_SHOW_WARNING);

export const toggleShowError = createAction(MessageTableActionType.TOGGLE_SHOW_ERROR);