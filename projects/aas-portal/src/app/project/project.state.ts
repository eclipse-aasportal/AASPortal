/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { AASDocument, AASWorkspace } from "common";

export interface ProjectState {
    workspace: AASWorkspace | null;
    workspaces: AASWorkspace[];
    documents: AASDocument[];
    error: unknown;
}   

export const initialState: ProjectState = {
    workspace: null,
    workspaces: [],
    documents: [],
    error: null
}

export interface State {
    project: ProjectState;
}