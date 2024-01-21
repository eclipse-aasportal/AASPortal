/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { createSelector } from '@ngrx/store';
import { State } from './view.state';

const getSubmodels = (state: State) => state.view.submodels;
const getTemplate = (state: State) => state.view.template;

export const selectSubmodels = createSelector(getSubmodels, submodels => submodels);

export const selectTemplate = createSelector(getTemplate, template => template);