/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { createReducer, on } from '@ngrx/store';
import { aas, AASContainer, AASDocument, AASWorkspace } from 'common';
import * as ProjectActions from './project.actions';
import { initialState, ProjectState } from './project.state';

export const projectReducer = createReducer(initialState,
    on(
        ProjectActions.setState,
        (state, { workspaces, workspace }) => setState(state, workspaces, workspace)
    ),
    on(
        ProjectActions.addContainer,
        (state, { name, container }) => addContainer(state, name, container)
    ),
    on(
        ProjectActions.addDocument,
        (state, { document, content }) => addDocument(state, document, content)
    ),
    on(
        ProjectActions.addWorkspace,
        (state, { workspace }) => addWorkspace(state, workspace)
    ),
    on(
        ProjectActions.removeContainer,
        (state, { name, container }) => removeContainer(state, name, container)
    ),
    on(
        ProjectActions.removeDocument,
        (state, { document }) => removeDocument(state, document)
    ),
    on(
        ProjectActions.removeWorkspace,
        (state, { workspace }) => removeWorkspace(state, workspace)
    ),
    on(
        ProjectActions.setDocument,
        (state, { index, document, content }) => setDocument(state, index, document, content)
    ),
    on(
        ProjectActions.setWorkspace,
        (state, { workspace }) => setWorkspace(state, workspace)
    ),
    on(
        ProjectActions.setError,
        (state, { error }) => setError(state, error)
    )
);

function setState(state: ProjectState, workspaces: AASWorkspace[], workspace: AASWorkspace | null): ProjectState {
    try {
        return { ...state, workspaces, workspace };
    } catch (error) {
        return { ...state, error };
    }
}

function addDocument(
    state: ProjectState,
    document: AASDocument,
    content?: aas.Environment): ProjectState {
    try {
        if (content) {
            document = { ...document, content };
        }

        return { ...state, documents: [...state.documents, document] }
    } catch (error) {
        return { ...state, error };
    }
}

function removeDocument(state: ProjectState, document: AASDocument): ProjectState {
    try {
        const documents = state.documents.filter(item => item.endpoint.url !== document.endpoint.url || item.id !== document.id);
        return { ...state, documents };
    } catch (error) {
        return { ...state, error };
    }
}

function setDocument(
    state: ProjectState,
    index: number,
    document: AASDocument,
    content?: aas.Environment): ProjectState {
    try {
        const documents = [...state.documents];
        if (content) {
            document = { ...document, content };
        }

        documents[index] = document;
        return { ...state, documents };
    } catch (error) {
        return { ...state, error };
    }
}

function addWorkspace(state: ProjectState, workspace: AASWorkspace): ProjectState {
    try {
        const workspaces = [...state.workspaces, workspace];
        workspaces.sort((a, b) => compareWorkspaces(a, b));
        return { ...state, workspaces };
    } catch (error) {
        return { ...state, error };
    }

    function compareWorkspaces(a: AASWorkspace, b: AASWorkspace): number {
        return a.name.localeCompare(b.name);
    }
}

function removeWorkspace(state: ProjectState, workspace: AASWorkspace): ProjectState {
    try {
        const workspaces = state.workspaces.filter(item => item !== workspace);
        return workspaces.length < 0 ? { ...state, workspaces } : { ...state, workspaces, workspace: null, documents: [] };
    } catch (error) {
        return { ...state, error };
    }
}

function addContainer(state: ProjectState, name: string, container: AASContainer): ProjectState {
    try {
        const workspaces = [...state.workspaces];
        const index = workspaces.findIndex(item => item.name === name);
        if (index >= 0) {
            let workspace = workspaces[index];
            workspace = { ...workspace, containers: [...workspace.containers, container] };
            workspaces[index] = workspace;
            if (state.workspace?.name === workspace.name) {
                return { ...state, workspaces, workspace };
            } else {
                return { ...state, workspaces };
            }
        }

        return state;
    } catch (error) {
        return { ...state, error };
    }
}

function removeContainer(state: ProjectState, name: string, container: AASContainer): ProjectState {
    try {
        const workspaces = [...state.workspaces];
        const i = workspaces.findIndex(item => item.name === name);
        const j = workspaces[i].containers.findIndex(item => item.url === container.url);
        let workspace = workspaces[i];
        workspace = { ...workspace, containers: workspace.containers.filter((_, index) => index !== j) };
        workspaces[i] = workspace;

        if (state.workspace?.name === name) {
            const documents = state.documents.filter(item => item.endpoint.url != container.url);
            return { ...state, workspaces, workspace, documents };
        } else {
            return { ...state, workspaces };
        }
    } catch (error) {
        return { ...state, error };
    }
}

function setWorkspace(state: ProjectState, workspace: AASWorkspace | null): ProjectState {
    try {
        return { ...state, workspace, documents: [] }
    } catch (error) {
        return { ...state, error };
    }
}

function setError(state: ProjectState, error: Error): ProjectState {
    return { ...state, error };
}

