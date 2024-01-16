/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { createSelector } from '@ngrx/store';
import { AASTreeFeatureState } from './aas-tree.state';

const getState = (state: AASTreeFeatureState) => state.tree;
const getRows = (state: AASTreeFeatureState) => state.tree.rows;
const getIndex = (state: AASTreeFeatureState) => state.tree.index;
const getTerms = (state: AASTreeFeatureState) => state.tree.terms;
const getError = (state: AASTreeFeatureState) => state.tree.error;

export const selectRows = createSelector(getRows, rows => rows);

export const selectMatchIndex = createSelector(getIndex, index => index);

export const selectMatchRow = createSelector(getState, state => {
    return state.index >= 0 ? state.rows[state.index] : undefined;
});

export const selectTerms = createSelector(getTerms, terms => terms);

export const selectError = createSelector(getError, error => error);

export const selectRow = (index: number) => {
    return createSelector(getRows, rows => rows[index]);
};

export const selectNodes = createSelector(getRows, rows => rows.find(row => row.level === 0)?.getExpanded(rows) ?? []);

export const selectSelectedElements = createSelector(getRows, rows =>
    rows.filter(row => row.selected).map(item => item.element),
);

export const selectSomeSelected = createSelector(
    getRows,
    rows => rows.length > 0 && rows.some(row => row.selected) && !rows.every(row => row.selected),
);

export const selectEverySelected = createSelector(getRows, rows => rows.length > 0 && rows.every(row => row.selected));

export const selectSelectedRows = createSelector(getRows, rows => rows.filter(row => row.selected));
