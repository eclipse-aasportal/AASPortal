/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { createSelector } from '@ngrx/store';
import { MessageTableFeatureState } from './message-table.state';

const getState = (state: MessageTableFeatureState) => state.messageTable;

export const selectState = createSelector(getState, (state) => state);