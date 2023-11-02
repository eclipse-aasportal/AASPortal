/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Injectable } from '@angular/core';
import { AASDocument, AASContainer, WebSocketData, AASServerMessage, AASWorkspace } from 'common';
import { Observable, of, mergeMap, catchError, skipWhile, first } from 'rxjs';
import { WebSocketSubject } from 'rxjs/webSocket';
import { Store } from '@ngrx/store';
import { AuthService, LogType, NotifyService, WebSocketFactoryService } from 'projects/aas-lib/src/public-api';

import { ProjectAPIService } from './project-api.service';
import { State } from './project.state';
import * as ProjectSelectors from './project.selectors';
import * as ProjectActions from './project.actions';
import { getEndpointName } from '../configuration';

@Injectable({
    providedIn: 'root',
})
export class ProjectService {
    private readonly store: Store<State>;
    private webSocketSubject?: WebSocketSubject<WebSocketData>;

    constructor(
        store: Store,
        private readonly webSocketFactory: WebSocketFactoryService,
        private readonly api: ProjectAPIService,
        private readonly notify: NotifyService,
        private readonly auth: AuthService
    ) {
        this.store = store as Store<State>;

        this.workspaces = this.store.select(ProjectSelectors.selectWorkspaces);
        this.workspace = this.store.select(ProjectSelectors.selectCurrentWorkspace);
        this.documents = this.store.select(ProjectSelectors.selectDocuments);
        this.containers = this.store.select(ProjectSelectors.selectContainers);
        this.store.select(ProjectSelectors.selectError).pipe().subscribe(error => this.notify.error(error));

        this.subscribeWorkspaceChanged();

        this.auth.ready.pipe(skipWhile(ready => ready === false), first())
            .subscribe(() => this.store.dispatch(ProjectActions.initialize()));
    }

    /** All available AAS container. */
    public readonly containers: Observable<AASContainer[]>

    /** Gets the available workspaces. */
    public readonly workspaces: Observable<AASWorkspace[]>;

    /** Gets the current active workspace. */
    public readonly workspace: Observable<AASWorkspace | null>;

    /** All available AAS documents of the current workspace. */
    public readonly documents: Observable<AASDocument[]>;

    /**
     * Sets the current active workspace.
     * @param name The name of the new active workspace.
     */
    public setWorkspace(name: string): void {
        this.store.dispatch(ProjectActions.setActiveWorkspace({ name }));
    }

    /**
     * Determines whether an AAS with the specified identifier or name (idShort) exists.
     * @param id The identifier or name of the AAS document.
     * @param url The container URL.
     * @returns The observable result.
     */
    public findDocument(id: string, url?: string): Observable<AASDocument | undefined> {
        return this.store.select(ProjectSelectors.selectDocument(id, url)).pipe(
            mergeMap(document => document ? of(document) : this.api.getDocument(id, url)
                .pipe(mergeMap(d => of(d)),
                    catchError(() => of(undefined)))));
    }

    /**
     * Gets the AAS document with the specified identification or name.
     * @param id The identification or name of the AAS document.
     * @param url The container URL.
     * @returns The requested AAS document.
     */
    public getDocument(id: string, url?: string): Observable<AASDocument> {
        return this.store.select(ProjectSelectors.selectDocument(id, url)).pipe(
            mergeMap(document => {
                if (document) {
                    return of(document);
                }

                return this.api.getDocument(id, url).pipe(mergeMap(d => {
                    if (d.content) {
                        return of(d);
                    }

                    return this.api.getContent(d.id, d.container).pipe(
                        mergeMap(content => {
                            d.content = content;
                            return of(d);
                        }));
                }));
            }));
    }

    /**
     * Adds an endpoint to the AASServer configuration.
     * @param name Name of the endpoint.
     * @param url The endpoint URL
     */
    public addEndpoint(name: string, url: string): Observable<void> {
        return this.api.addEndpoint(name, url);
    }

    /**
     * Removes the endpoint with the specified name from the AASServer configuration.
     * @param name The endpoint name.
     */
    public removeEndpoint(name: string): Observable<void> {
        return this.api.removeEndpoint(name);
    }

    /**
     * Resets the AAS-Server configuration to the default.
     * @returns An observable.
     */
    public reset(): Observable<void> {
        return this.api.reset();
    }

    /**
     * Applies a modified document.
     * @param document The modified document.
     */
    public applyDocument(document: AASDocument): void {
        this.store.dispatch(ProjectActions.applyDocument({ document }));
    }

    /**
     * Deletes the specified AAS document form the corresponding AAS container.
     * @param document The document to delete.
     * @returns An observable.
     */
    public deleteDocument(document: AASDocument): Observable<void> {
        return this.api.deleteDocument(document.id, document.container);
    }

    private subscribeWorkspaceChanged = (): void => {
        this.webSocketSubject = this.webSocketFactory.create();
        this.webSocketSubject.subscribe({
            next: (data: WebSocketData): void => {
                if (data.type === 'AASServerMessage') {
                    this.update(data.data as AASServerMessage);
                }
            },
            error: (): void => {
                setTimeout(this.subscribeWorkspaceChanged, 2000);
            }
        });

        this.webSocketSubject.next(this.createMessage());
    }

    private createMessage(): WebSocketData {
        return {
            type: 'WorkspaceChanged',
            data: null,
        } as WebSocketData;
    }

    private update(data: AASServerMessage): void {
        try {
            switch (data.type) {
                case 'Added':
                    this.documentAdded(data.document!);
                    break;
                case 'Removed':
                    this.documentRemoved(data.document!);
                    break;
                case 'Changed':
                    this.documentUpdated(data.document!);
                    break;
                case 'ContainerAdded':
                    this.containerAdded(data.endpoint!, data.container!);
                    break;
                case 'ContainerRemoved':
                    this.containerRemoved(data.endpoint!, data.container!);
                    break;
                case 'EndpointAdded':
                    this.endpointAdded(data.endpoint!);
                    break;
                case 'EndpointRemoved':
                    this.endpointRemoved(data.endpoint!);
                    break;
                case 'Reset':
                    this.store.dispatch(ProjectActions.initialize());
                    break;
            }
        } catch (error) {
            this.notify.log(LogType.Error, error);
        }
    }

    private documentAdded(document: AASDocument): void {
        this.store.dispatch(ProjectActions.documentAdded({ document }));
    }

    private documentRemoved(document: AASDocument): void {
        this.store.dispatch(ProjectActions.removeDocument({ document }));
    }

    private documentUpdated(document: AASDocument): void {
        this.store.dispatch(ProjectActions.documentUpdated({ document }));
    }

    private endpointAdded(endpoint: string): void {
        this.store.dispatch(ProjectActions.endpointAdded({ endpoint }));
    }

    private endpointRemoved(endpoint: string): void {
        this.store.dispatch(ProjectActions.endpointRemoved({ endpoint }));
    }

    private containerAdded(endpoint: string, container: AASContainer): void {
        const url = new URL(endpoint);
        const name = getEndpointName(url);
        if (name) {
            this.store.dispatch(ProjectActions.addContainer({ name, container }));
        }
    }

    private containerRemoved(endpoint: string, container: AASContainer): void {
        const url = new URL(endpoint);
        const name = getEndpointName(url);
        if (name) {
            this.store.dispatch(ProjectActions.removeContainer({ name, container }));
        }
    }
}