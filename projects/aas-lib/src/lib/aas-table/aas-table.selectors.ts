/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { createSelector } from '@ngrx/store';
import { AASDocument } from 'common';
import { AASTableRow, AASTableFeatureState, AASTableTree } from './aas-table.state';
import { TranslateService } from '@ngx-translate/core';
import { AASTableFilter } from './aas-table.filter';

const getRows = (state: AASTableFeatureState) => state.aasTable.rows;
const getState = (state: AASTableFeatureState) => state.aasTable;

export const selectState = createSelector(getState, state => state);

export const selectSelectedDocuments = createSelector(getRows, (rows: AASTableRow[]): AASDocument[] => {
    return rows.filter(row => row.selected).map(row => row.document);
});

export const selectSomeSelected = createSelector(getRows, (rows: AASTableRow[]): boolean => {
    return rows.length > 0 && rows.some(row => row.selected) && !rows.every(row => row.selected);
});

export const selectEverySelected = createSelector(getRows, (rows: AASTableRow[]): boolean => {
    return rows.length > 0 && rows.every(row => row.selected);
});

export const selectRows = (translate: TranslateService) => {
    return createSelector(getState, state => {
        if (state.viewMode === 'list') {
            if (state.filter) {
                const filter = new AASTableFilter(state.filter, translate.currentLang);
                return state.rows.filter(row => filter.match(row.document));
            }

            return state.rows;
        } else {
            return new AASTableTree(state.rows).expanded;
        }
    });
};
