/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { createSelector } from '@ngrx/store';
import { State } from './start.state'
import { ViewMode } from 'projects/aas-lib/src/public-api';


const getShowAll = (state: State) => state.start.showAll;
const getFilter = (state: State) => state.start.filter;
const getViewMode = (state: State) => state.start.viewMode;

export const selectShowAll = createSelector(getShowAll, showAll => showAll);

export const selectFilter = createSelector(getFilter, filter => filter);

export const selectViewMode = createSelector(getViewMode, viewMode => viewMode);

export const selectIsViewModeList = createSelector(getViewMode, viewMode => viewMode === ViewMode.List);

export const selectIsViewModeTree = createSelector(getViewMode, viewMode => viewMode === ViewMode.Tree);