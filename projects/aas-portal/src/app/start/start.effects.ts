/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { EMPTY, exhaustMap, map, mergeMap, first, concat, of, from, Observable, catchError } from 'rxjs';
import { AASDocument, AASDocumentId, AASPage } from 'common';
import { ViewMode } from 'aas-lib';

import * as StartActions from './start.actions';
import * as StartSelectors from './start.selectors';
import { StartFeatureState } from './start.state';
import { StartApiService } from './start-api.service';

@Injectable()
export class StartEffects {
    private readonly store: Store<StartFeatureState>;

    public constructor(
        private readonly actions: Actions,
        store: Store,
        private readonly translate: TranslateService,
        private readonly api: StartApiService,
    ) {
        this.store = store as Store<StartFeatureState>;
    }

    public setListView = createEffect(() => {
        return this.actions.pipe(
            ofType(StartActions.StartActionType.SET_LIST_VIEW),
            exhaustMap(() =>
                concat(
                    of(StartActions.setViewMode({ viewMode: ViewMode.List })),
                    this.store.select(StartSelectors.selectState).pipe(
                        first(),
                        mergeMap(state => {
                            return this.api.getPage(
                                {
                                    previous: null,
                                    limit: state.limit,
                                },
                                state.filter,
                                this.translate.currentLang,
                            );
                        }),
                        mergeMap(page => this.setPageAndLoadContents(page)),
                    ),
                ),
            ),
        );
    });

    public getFirstPage = createEffect(() => {
        return this.actions.pipe(
            ofType<StartActions.GetFirstPageAction>(StartActions.StartActionType.GET_FIRST_PAGE),
            exhaustMap(action =>
                concat(
                    of(StartActions.setViewMode({ viewMode: ViewMode.List })),
                    this.store.select(StartSelectors.selectState).pipe(
                        first(),
                        mergeMap(state => {
                            return this.api.getPage(
                                {
                                    previous: null,
                                    limit: action.limit ?? state.limit,
                                },
                                action.filter ?? state.filter,
                                this.translate.currentLang,
                            );
                        }),
                        mergeMap(page => this.setPageAndLoadContents(page, action.limit, action.filter)),
                    ),
                ),
            ),
        );
    });

    public getLastPage = createEffect(() => {
        return this.actions.pipe(
            ofType(StartActions.StartActionType.GET_LAST_PAGE),
            exhaustMap(() =>
                concat(
                    of(StartActions.setViewMode({ viewMode: ViewMode.List })),
                    this.store.select(StartSelectors.selectState).pipe(
                        first(),
                        mergeMap(state => {
                            return this.api.getPage(
                                {
                                    next: null,
                                    limit: state.limit,
                                },
                                state.filter,
                                this.translate.currentLang,
                            );
                        }),
                        mergeMap(page => this.setPageAndLoadContents(page)),
                    ),
                ),
            ),
        );
    });

    public getNextPage = createEffect(() => {
        return this.actions.pipe(
            ofType(StartActions.StartActionType.GET_NEXT_PAGE),
            exhaustMap(() =>
                concat(
                    of(StartActions.setViewMode({ viewMode: ViewMode.List })),
                    this.store.select(StartSelectors.selectState).pipe(
                        first(),
                        mergeMap(state => {
                            if (state.documents.length === 0) return EMPTY;

                            return this.api.getPage(
                                {
                                    next: this.getId(state.documents[state.documents.length - 1]),
                                    limit: state.limit,
                                },
                                state.filter,
                                this.translate.currentLang,
                            );
                        }),
                        mergeMap(page => this.setPageAndLoadContents(page)),
                    ),
                ),
            ),
        );
    });

    public getPreviousPage = createEffect(() => {
        return this.actions.pipe(
            ofType(StartActions.StartActionType.GET_PREVIOUS_PAGE),
            exhaustMap(() =>
                concat(
                    of(StartActions.setViewMode({ viewMode: ViewMode.List })),
                    this.store.select(StartSelectors.selectState).pipe(
                        first(),
                        mergeMap(state => {
                            if (state.documents.length === 0) return EMPTY;

                            return this.api.getPage(
                                {
                                    previous: this.getId(state.documents[0]),
                                    limit: state.limit,
                                },
                                state.filter,
                                this.translate.currentLang,
                            );
                        }),
                        mergeMap(page => this.setPageAndLoadContents(page)),
                    ),
                ),
            ),
        );
    });

    public refreshPage = createEffect(() => {
        return this.actions.pipe(
            ofType(StartActions.StartActionType.REFRESH_PAGE),
            exhaustMap(() =>
                concat(
                    of(StartActions.setViewMode({ viewMode: ViewMode.List })),
                    this.store.select(StartSelectors.selectState).pipe(
                        first(),
                        mergeMap(state => {
                            if (state.documents.length === 0) return EMPTY;

                            return this.api.getPage(
                                {
                                    previous: state.previous,
                                    limit: state.limit,
                                },
                                state.filter,
                                this.translate.currentLang,
                            );
                        }),
                        mergeMap(page => this.setPageAndLoadContents(page)),
                    ),
                ),
            ),
        );
    });

    public setTreeView = createEffect(() => {
        return this.actions.pipe(
            ofType(StartActions.StartActionType.SET_TREE_VIEW),
            exhaustMap(() =>
                concat(
                    of(StartActions.setViewMode({ viewMode: ViewMode.Tree })),
                    this.store.select(StartSelectors.selectDocuments).pipe(
                        first(),
                        mergeMap(documents =>
                            from(documents).pipe(
                                mergeMap(document => this.api.getHierarchy(document.endpoint, document.id)),
                                mergeMap(nodes => this.addTreeAndLoadContents(nodes)),
                            ),
                        ),
                    ),
                ),
            ),
        );
    });

    public getFavorites = createEffect(() => {
        return this.actions.pipe(
            ofType<StartActions.GetFavoritesAction>(StartActions.StartActionType.GET_FAVORITES),
            exhaustMap(action =>
                concat(
                    of(StartActions.setFavorites({ name: action.name, documents: action.documents })),
                    from(action.documents).pipe(
                        mergeMap(document =>
                            this.api.getContent(document.endpoint, document.id).pipe(
                                catchError(() => of(undefined)),
                                map(content => StartActions.setContent({ document, content })),
                            ),
                        ),
                    ),
                ),
            ),
        );
    });

    private getId(document: AASDocument): AASDocumentId {
        return { id: document.id, endpoint: document.endpoint };
    }

    private setPageAndLoadContents(page: AASPage, limit?: number, filter?: string): Observable<Action> {
        return concat(
            of(StartActions.setPage({ page, limit, filter })),
            from(page.documents).pipe(
                mergeMap(document =>
                    this.api.getContent(document.endpoint, document.id).pipe(
                        catchError(() => of(undefined)),
                        map(content => StartActions.setContent({ document, content })),
                    ),
                ),
            ),
        );
    }

    private addTreeAndLoadContents(documents: AASDocument[]): Observable<Action> {
        return concat(
            of(StartActions.addTree({ documents })),
            from(documents).pipe(
                mergeMap(document =>
                    this.api
                        .getContent(document.endpoint, document.id)
                        .pipe(map(content => StartActions.setContent({ document, content }))),
                ),
            ),
        );
    }
}
