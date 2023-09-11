/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { AASWorkspace } from 'common';
import { AuthService } from 'aas-lib';
import { catchError, EMPTY, exhaustMap, from, map, merge, mergeMap, Observable, of, zip } from 'rxjs';

import { ProjectAPIService } from './project-api.service';
import { getEndpointName } from '../configuration';
import * as ProjectSelectors from './project.selectors';
import * as ProjectActions from './project.actions';
import { TypedAction } from '@ngrx/store/src/models';
import { State } from './project.state';

@Injectable()
export class ProjectEffects {
    private readonly store: Store<State>;

    constructor(
        private readonly actions: Actions,
        store: Store,
        private readonly auth: AuthService,
        private readonly api: ProjectAPIService
        ) { 
            this.store = store as Store<State>;
        }

    public initialize = createEffect(() => {
        return this.actions.pipe(
            ofType(ProjectActions.ProjectActionType.INITIALIZE),
            exhaustMap(() => this.api.getWorkspaces().pipe(
                mergeMap(items => {
                    const workspaces = this.initializeWorkspaces(items);
                    const workspace = this.initializeWorkspace(workspaces);
                    if (workspace) {
                        return merge(
                            of(ProjectActions.setState({ workspaces, workspace })), 
                            this.loadDocuments(workspace));
                    }

                    return of(ProjectActions.setState({ workspaces, workspace }));
                }))));
    });

    public setActiveWorkspace = createEffect(() => {
        return this.actions.pipe(
            ofType<ProjectActions.SetActiveWorkspaceAction>(ProjectActions.ProjectActionType.SET_ACTIVE_WORKSPACE),
            exhaustMap(action => zip(of(action.name), this.store.select(ProjectSelectors.selectWorkspace(action.name)))),
            mergeMap(tuple => {
                const workspace = tuple[1];
                if (!workspace) {
                    return of(ProjectActions.setError({
                        error: new Error(`A workspace with the name ${tuple[0]} does not exist`)
                    }));
                }

                this.auth.setCookie('.workspace', workspace.name);
                return merge(of(ProjectActions.setWorkspace({ workspace })), this.loadDocuments(workspace));
            }));
    });

    public documentAdded = createEffect(() => {
        return this.actions.pipe(
            ofType<ProjectActions.DocumentAddedAction>(ProjectActions.ProjectActionType.DOCUMENT_ADDED),
            exhaustMap(action => zip(of(action.document), this.store.select(ProjectSelectors.selectCurrentWorkspace))),
            mergeMap(tuple => {
                const workspace = tuple[1];
                const document = tuple[0];
                if (workspace) {
                    if (workspace.containers.some(item => item.url === document.container)) {
                        if (document.content === null) {
                            return this.api.getContent(document.id, document.container).pipe(
                                map(content => ProjectActions.addDocument({ document, content })));
                        } else {
                            return of(ProjectActions.addDocument({ document }));
                        }
                    }
                }

                return EMPTY;
            }))
    });

    public documentUpdated = createEffect(() => {
        return this.actions.pipe(
            ofType<ProjectActions.DocumentUpdatedAction>(ProjectActions.ProjectActionType.DOCUMENT_UPDATED),
            exhaustMap(action => zip(of(action.document), this.store.select(ProjectSelectors.selectDocuments))),
            mergeMap(tuple => {
                const documents = tuple[1];
                const document = tuple[0];
                const index = documents.findIndex(item =>
                    item.container === document.container && item.id === document.id);

                if (index >= 0) {
                    return this.api.getContent(document.id, document.container).pipe(
                        map(content => ProjectActions.setDocument({ index, document, content })));
                }

                return EMPTY;
            }))
    });

    public applyDocument = createEffect(() => {
        return this.actions.pipe(
            ofType<ProjectActions.ApplyDocumentAction>(ProjectActions.ProjectActionType.APPLY_DOCUMENT),
            exhaustMap(action => zip(of(action.document), this.store.select(ProjectSelectors.selectDocuments))),
            mergeMap(tuple => {
                const document = tuple[0];
                const index = tuple[1].findIndex(item => item.id == document.id &&
                    item.container === document.container);

                if (index >= 0) {
                    return of(ProjectActions.setDocument({ index, document }));
                } else {
                    return EMPTY;
                }
            }))
    });

    public endpointAdded = createEffect(() => {
        return this.actions.pipe(
            ofType<ProjectActions.EndpointAddedAction>(ProjectActions.ProjectActionType.ENDPOINT_ADDED),
            exhaustMap(action => zip(of(action.endpoint), this.store.select(ProjectSelectors.selectWorkspaces))),
            mergeMap(tuple => {
                const url = new URL(tuple[0]);
                const workspace: AASWorkspace = {
                    name: getEndpointName(url),
                    containers: []
                };

                if (tuple[1].length === 0) {
                    return of(
                        ProjectActions.addWorkspace({ workspace }),
                        ProjectActions.setActiveWorkspace({ name: workspace.name }));
                } else {
                    return of(ProjectActions.addWorkspace({ workspace }));
                }
            }))
    });

    public endpointRemoved = createEffect(() => {
        return this.actions.pipe(
            ofType<ProjectActions.EndpointRemovedAction>(ProjectActions.ProjectActionType.ENDPOINT_REMOVED),
            exhaustMap(action => zip(
                of(getEndpointName(action.endpoint)), 
                this.store.select(ProjectSelectors.selectProject))),
            mergeMap(tuple => {
                const workspaces = tuple[1].workspaces;
                const workspace = tuple[1].workspace;
                const name = tuple[0];
                if (workspace) {
                    let index = workspaces.findIndex(item => item.name === name);
                    if (index >= 0) {
                        if (workspaces.length >= 2) {
                            ++index;
                            if (index >= workspaces.length) {
                                index = length - 2;
                            }

                            const next = workspaces[index];
                            return of(
                                ProjectActions.removeWorkspace({ workspace }),
                                ProjectActions.setActiveWorkspace({ name: next.name }));
                        }

                        return of(ProjectActions.removeWorkspace({ workspace }));
                    }
                }

                return EMPTY;
            }))
    });

    private initializeWorkspaces(workspaces: AASWorkspace[]): AASWorkspace[] {
        const value = this.auth.getCookie('.workspaces');
        if (value) {
            workspaces = [...workspaces, ...JSON.parse(value) as AASWorkspace[]];
        }

        workspaces.sort((a, b) => this.compareWorkspaces(a, b));
        return workspaces;
    }

    private initializeWorkspace(workspaces: AASWorkspace[]): AASWorkspace | null {
        let workspace: AASWorkspace | undefined;
        if (this.auth.checkCookie('.workspace')) {
            const name = this.auth.getCookie('.workspace');
            workspace = workspaces.find((item) => item.name === name);
        }

        if (workspace == null && workspaces.length > 0) {
            workspace = workspaces[0];
        }

        return workspace ?? null;
    }

    private loadDocuments(workspace: AASWorkspace): Observable<TypedAction<ProjectActions.ProjectActionType.ADD_DOCUMENT>> {
        return from(workspace.containers).pipe(
            catchError(() => EMPTY),
            mergeMap(container => this.api.getDocuments(container.url)),
            mergeMap(documents => from(documents)),
            mergeMap(document => {
                if (document.content === null) {
                    return this.api.getContent(document.id, document.container).pipe(
                        map(content => ProjectActions.addDocument({ document, content })));
                }

                return of(ProjectActions.addDocument({ document }));
            }));
    }

    private compareWorkspaces(a: AASWorkspace, b: AASWorkspace): number {
        return a.name.localeCompare(b.name);
    }
}
