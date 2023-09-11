/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { createSelector } from "@ngrx/store";
import { State } from "./aas.state";

const getReadOnly = (state: State) => state.aas.document?.readonly ?? true;
const getOnlineReady = (state: State) => state.aas.document?.onlineReady ?? false;
const getSearch = (state: State) => state.aas.search;
const getDocument = (state: State) => state.aas.document;
const getTemplateStorage = (state: State) => state.aas.templateStorage;
const getTemplates = (state: State) => state.aas.templateStorage.templates;

export const selectOnlineReady = createSelector(getOnlineReady, onlineReady => onlineReady);

export const selectReadOnly = createSelector(getReadOnly, readOnly => readOnly);

export const selectEditable = createSelector(getReadOnly, readonly => !readonly);

export const selectSearch = createSelector(getSearch, search => search);

export const selectDocument = createSelector(getDocument, document => document);

export const selectHasDocument = createSelector(getDocument, document => document != null);

export const selectTemplateStorage = createSelector(getTemplateStorage, templateStorage => templateStorage);

export const selectTemplates = createSelector(getTemplates, templates => templates);