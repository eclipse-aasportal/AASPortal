/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { createSelector } from "@ngrx/store";
import { AASDocument } from "common";
import { AASTableRow, AASTableFeatureState } from "./aas-table.state";
import { AASTableFilter } from './aas-table.filter';
import { ViewMode } from '../types/view-mode';
import { TranslateService } from '@ngx-translate/core';

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

export const selectRows = (translate: TranslateService) => {
    const filter = new AASTableFilter(translate);

    return createSelector(getState, state => {
        if (state.viewMode === ViewMode.List) {
            let rows: AASTableRow[];
            if (state.column === '' || state.direction === '') {
                rows = state.rows;
            } else if (state.direction === 'asc') {
                rows = [...state.rows].sort((a, b) => compare(a, b, state.column, translate.currentLang));
            } else {
                rows = [...state.rows].sort((a, b) => compare(b, a, state.column, translate.currentLang));
            }

            return state.filter ? filter.do(rows, state.filter) : rows;
        } else {
            const rows: AASTableRow[] = [];
            for (const root of state.rows.filter(row => row.level === 0)) {
                rows.push(...root.getExpanded(state.rows));
            }

            return rows;
        }
    });
}

function compare(a: AASTableRow, b: AASTableRow, column: string, language: string): number {
    switch (column) {
        case 'name':
            return a.name.localeCompare(b.name, language, { sensitivity: 'accent' });
        case 'type':
            return a.type.localeCompare(b.type, language, { sensitivity: 'accent' });
        case 'id':
            return a.id.localeCompare(b.id, language, { sensitivity: 'accent' });
        case 'document':
            return a.document.timeStamp < b.document.timeStamp
                ? -1
                : a.document.timeStamp > b.document.timeStamp ? -1 : 0;
        default:
            return 0;
    }
}