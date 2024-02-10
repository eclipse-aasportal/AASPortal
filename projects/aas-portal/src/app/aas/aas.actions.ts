/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { createAction, props } from '@ngrx/store';
import { TypedAction } from '@ngrx/store/src/models';
import { AASDocument, TemplateDescriptor } from 'common';

export enum AASActionType {
    SET_TEMPLATE_STORAGE = '[AAS] Set template storage',
    GET_DOCUMENT = '[AAS] get document',
    SET_DOCUMENT = '[AAS] set document',
    APPLY_DOCUMENT = '[AAS] apply document',
    RESET_MODIFIED = '[AAS] reset modified',
    SET_DASHBOARD = '[AAS] set dashboard',
    SET_SEARCH = '[AAS] set search',
    SET_STATE = '[AAS] Set State',
}

export interface GetDocumentAction extends TypedAction<AASActionType.GET_DOCUMENT> {
    id: string;
    name?: string;
}

export const getDocument = createAction(AASActionType.GET_DOCUMENT, props<{ id: string; name?: string }>());

export const setDocument = createAction(AASActionType.SET_DOCUMENT, props<{ document: AASDocument | null }>());

export const applyDocument = createAction(AASActionType.APPLY_DOCUMENT, props<{ document: AASDocument }>());

export const setTemplateStorage = createAction(
    AASActionType.SET_TEMPLATE_STORAGE,
    props<{ templates: TemplateDescriptor[] }>(),
);

export const resetModified = createAction(AASActionType.RESET_MODIFIED, props<{ document: AASDocument }>());

export const setSearch = createAction(AASActionType.SET_SEARCH, props<{ search: string }>());
export const setState = createAction(AASActionType.SET_STATE, props<{ value: 'offline' | 'online' }>());
