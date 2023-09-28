/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { createSelector } from "@ngrx/store";
import { AASContainer, AASDocument, AASWorkspace, equalUrls, isUrlSafeBase64 } from "common";
import { State } from "./project.state";
import { noop } from "rxjs";
import { decodeBase64Url } from 'projects/aas-lib/src/public-api';

const getWorkspaces = (state: State) => state.project.workspaces;
const getDocuments = (state: State) => state.project.documents;
const getWorkspace = (state: State) => state.project.workspace;
const getError = (state: State) => state.project.error;
const getProject = (state: State) => state.project;

export const selectProject = createSelector(getProject, (project) => project);

export const selectCurrentWorkspace = createSelector(getWorkspace, (workspace) => workspace);

export const selectWorkspaces = createSelector(getWorkspaces, (workspaces) => workspaces);

export const selectDocuments = createSelector(getDocuments, (documents) => documents);

export const selectError = createSelector(getError, (error) => error);

export const selectContainers = createSelector(
    getWorkspaces,
    (workspaces: AASWorkspace[]): AASContainer[] => {
        const set = new Set<string>();
        return workspaces.flatMap(item => item.containers).filter(container => {
            if (!set.has(container.url)) {
                set.add(container.url);
                return true;
            }

            return false;
        });
    });

export const selectWorkspace = (name: string) => createSelector(
    getWorkspaces,
    (workspaces: AASWorkspace[]) => workspaces.find(workspace => workspace.name === name));

export const selectDocument = (id: string, url?: string) => createSelector(
    getDocuments,
    (documents: AASDocument[]) => {
        let decodedId: string | undefined;
        try {
            if (isUrlSafeBase64(id)) {
                decodedId = decodeBase64Url(id);
            }
        } catch (err) {
            noop();
        }

        return documents.find(item => (item.id === id || item.idShort === id || item.id === decodedId) &&
            (url == null || equalUrls(item.container, url)));
    }
);