/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { createSelector } from '@ngrx/store';
import { AASDocument } from 'common';
import { AASTableRow, AASTableFeatureState } from './aas-table.state';

const getRows = (state: AASTableFeatureState) => state.aasTable.rows;
const getState = (state: AASTableFeatureState) => state.aasTable;

export const selectState = createSelector(getState, state => state);

export const selectSelectedDocuments = createSelector(
    getRows,
    (rows: AASTableRow[]): AASDocument[] => {
        return rows.filter(row => row.selected).map(row => row.document);
    });

export const selectSomeSelected = createSelector(
    getRows,
    (rows: AASTableRow[]): boolean => {
        return rows.length > 0 && rows.some(row => row.selected) && !rows.every(row => row.selected);
    });


export const selectEverySelected = createSelector(
    getRows,
    (rows: AASTableRow[]): boolean => {
        return rows.length > 0 && rows.every(row => row.selected);
    });

export const selectRows = createSelector(getState, state => {
    return state.rows;
});

export const selectIsFirstPage = createSelector(
    getState,
    state => state.isFirstPage);

export const selectIsLastPage = createSelector(
    getState,
    state => state.isLastPage);

export const selectViewMode = createSelector(
    getState,
    state => state.viewMode);

export const selectTotalCount = createSelector(
    getState,
    state => state.totalCount);
