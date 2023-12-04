/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { createSelector } from '@ngrx/store';
import { StartFeatureState } from './start.state'
import { ViewMode } from 'projects/aas-lib/src/public-api';

const getFilter = (state: StartFeatureState) => state.start.filter;
const getViewMode = (state: StartFeatureState) => state.start.viewMode;
const getLimit = (state: StartFeatureState) => state.start.limit;
const getDocuments = (state: StartFeatureState) => state.start.documents;

export const selectFilter = createSelector(getFilter, filter => filter);

export const selectViewMode = createSelector(getViewMode, viewMode => viewMode);

export const selectIsViewModeList = createSelector(getViewMode, viewMode => viewMode === ViewMode.List);

export const selectIsViewModeTree = createSelector(getViewMode, viewMode => viewMode === ViewMode.Tree);

export const selectLimit = createSelector(getLimit, limit => limit); 

export const selectDocuments = createSelector(getDocuments, documents => documents);
