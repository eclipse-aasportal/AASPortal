/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { createSelector } from '@ngrx/store';
import { AASCursor, AASDocument } from 'common';
import { AASTableRow, AASTableFeatureState } from './aas-table.state';
import { ViewMode } from '../types/view-mode';

const getRows = (state: AASTableFeatureState) => state.aasTable.rows;
const getState = (state: AASTableFeatureState) => state.aasTable;

export const selectState = createSelector(getState, state => state);

export const selectSelectedDocuments = createSelector(
    getRows,
    (rows: AASTableRow[]): AASDocument[] => {
        return rows.filter(row => row.selected).map(row => row.document);
    });

export const selectSomeSelections = createSelector(
    getRows,
    (rows: AASTableRow[]): boolean => {
        return rows.some(row => row.selected);
    });

export const selectRows = createSelector(getState, state => {
    if (state.viewMode === ViewMode.List) {
        return state.rows;
    } else {
        const rows: AASTableRow[] = [];
        for (const root of state.rows.filter(row => row.level === 0)) {
            rows.push(...root.getExpanded(state.rows));
        }

        return rows;
    }
});

export const selectIsFirstPage = createSelector(
    getState,
    state => state.isFirstPage);

export const selectIsLastPage = createSelector(
    getState,
    state => state.isLastPage);

export const selectInitialized = createSelector(
    getState,
    state => state.initialized);
