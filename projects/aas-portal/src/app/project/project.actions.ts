/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { createAction, props } from '@ngrx/store';
import { TypedAction } from '@ngrx/store/src/models';
import { aas, AASContainer, AASDocument, AASEndpoint, AASWorkspace } from 'common';

export enum ProjectActionType {
    INITIALIZE = '[Project] initialize',
    SET_STATE = '[Project] set state',
    ADD_DOCUMENT = '[Project] add document',
    REMOVE_DOCUMENT = '[Project] remove document',
    APPLY_DOCUMENT = '[Project] apply document',
    SET_DOCUMENT = '[Project] set document',
    SET_ACTIVE_WORKSPACE = '[Project] set active workspace',
    SET_WORKSPACE = '[Project] set workspace',
    DOCUMENT_ADDED = '[Project] document added',
    DOCUMENT_UPDATED = '[Project] document updated',
    ADD_WORKSPACE = '[Project] add workspace',
    REMOVE_WORKSPACE = '[Project] remove workspace',
    ENDPOINT_ADDED = '[Project] endpoint added',
    ENDPOINT_REMOVED = '[Project] endpoint removed',
    CONTAINER_ADDED = '[Project] container added',
    ADD_CONTAINER = '[Project] add container',
    REMOVE_CONTAINER = '[Project] remove container',
    CREATE_WORKSPACE = '[Project] create workspace',
    DELETE_WORKSPACE = '[Project] delete workspace',
    UPDATE_WORKSPACE = '[Project] update workspace',
    SET_ERROR = '[Project] set error'
}

export const initialize = createAction(
    ProjectActionType.INITIALIZE);

export const setState = createAction(
    ProjectActionType.SET_STATE,
    props<{ workspaces: AASWorkspace[]; workspace: AASWorkspace | null }>());

export const addDocument = createAction(
    ProjectActionType.ADD_DOCUMENT,
    props<{ document: AASDocument; content?: aas.Environment }>());

export const removeDocument = createAction(
    ProjectActionType.REMOVE_DOCUMENT,
    props<{ document: AASDocument }>());

export const applyDocument = createAction(
    ProjectActionType.APPLY_DOCUMENT,
    props<{ document: AASDocument }>());

export const setDocument = createAction(
    ProjectActionType.SET_DOCUMENT,
    props<{ index: number; document: AASDocument; content?: aas.Environment }>());

export const setActiveWorkspace = createAction(
    ProjectActionType.SET_ACTIVE_WORKSPACE,
    props<{ name: string }>());

export const setWorkspace = createAction(
    ProjectActionType.SET_WORKSPACE,
    props<{ workspace: AASWorkspace | null }>());

export const documentAdded = createAction(
    ProjectActionType.DOCUMENT_ADDED,
    props<{ document: AASDocument }>());

export const documentUpdated = createAction(
    ProjectActionType.DOCUMENT_UPDATED,
    props<{ document: AASDocument }>());

export const addWorkspace = createAction(
    ProjectActionType.ADD_WORKSPACE,
    props<{ workspace: AASWorkspace }>());

export const removeWorkspace = createAction(
    ProjectActionType.REMOVE_WORKSPACE,
    props<{ workspace: AASWorkspace }>());

export const endpointAdded = createAction(
    ProjectActionType.ENDPOINT_ADDED,
    props<{ endpoint: AASEndpoint }>());

export const endpointRemoved = createAction(
    ProjectActionType.ENDPOINT_REMOVED,
    props<{ endpoint: string }>());

export const addContainer = createAction(
    ProjectActionType.ADD_CONTAINER,
    props<{ name: string; container: AASContainer }>());

export const removeContainer = createAction(
    ProjectActionType.REMOVE_CONTAINER,
    props<{ name: string; container: AASContainer }>());

export const setError = createAction(
    ProjectActionType.SET_ERROR,
    props<{error: Error}>());

export interface ApplyDocumentAction extends TypedAction<ProjectActionType.APPLY_DOCUMENT> {
    document: AASDocument;
}

export interface SetActiveWorkspaceAction extends TypedAction<ProjectActionType.SET_ACTIVE_WORKSPACE> {
    name: string;
}

export interface DocumentAddedAction extends TypedAction<ProjectActionType.DOCUMENT_ADDED> {
    document: AASDocument;
}

export interface DocumentUpdatedAction extends TypedAction<ProjectActionType.DOCUMENT_UPDATED> {
    document: AASDocument;
}

export interface EndpointAddedAction extends TypedAction<ProjectActionType.ENDPOINT_ADDED> {
    endpoint: AASEndpoint;
}

export interface EndpointRemovedAction extends TypedAction<ProjectActionType.ENDPOINT_REMOVED> {
    endpoint: string;
}
