/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { createSelector } from '@ngrx/store';
import { State } from './dashboard.state';

const getName = (state: State) => state.dashboard.name;
const getPages = (state: State) => state.dashboard.pages;
const getEditMode = (state: State) => state.dashboard.editMode;
const getSelectionMode = (state: State) => state.dashboard.selectionMode;
const getRows = (state: State) => state.dashboard.rows;
const getState = (state: State) => state.dashboard;

export const selectName = createSelector(getName, name => name);

export const selectPages = createSelector(getPages, pages => pages);

export const selectEditMode = createSelector(getEditMode, editMode => editMode);

export const selectSelectionMode = createSelector(getSelectionMode, selectionMode => selectionMode);

export const selectRows = createSelector(getRows, rows => rows);

export const selectPage = createSelector(getName, getPages, (name, pages) => pages.find(page => page.name === name));

export const selectState = createSelector(getState, state => state);
