/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { createAction, props } from '@ngrx/store';
import { AASDocument, TemplateDescriptor } from 'common';

export enum AASActionType {
    SET_TEMPLATE_STORAGE = '[AAS] Set template storage',
    SET_DOCUMENT = '[AAS] Set document',
    APPLY_DOCUMENT = '[AAS] Apply document',
    RESET_MODIFIED = '[AAS] Reset modified',
    SET_DASHBOARD = '[AAS] Set dashboard',
    SET_SEARCH = '[AAS] Set search',
    SET_STATE = '[AAS] Set State',
}

export const setDocument = createAction(
    AASActionType.SET_DOCUMENT,
    props<{ document: AASDocument | null }>());

export const applyDocument = createAction(
    AASActionType.APPLY_DOCUMENT,
    props<{ document: AASDocument }>());

export const setTemplateStorage = createAction(
    AASActionType.SET_TEMPLATE_STORAGE,
    props<{ templates: TemplateDescriptor[] }>());

export const resetModified = createAction(
    AASActionType.RESET_MODIFIED,
    props<{ document: AASDocument }>());

export const setSearch = createAction(
    AASActionType.SET_SEARCH,
    props<{ search: string }>());

export const setState = createAction(
    AASActionType.SET_STATE,
    props<{ value: 'offline' | 'online' }>());