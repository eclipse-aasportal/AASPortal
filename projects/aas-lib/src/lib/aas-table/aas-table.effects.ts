/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import { AASDocument, AASDocumentId, AASDocumentNode, AASPage } from 'common';
import { EMPTY, exhaustMap, map, mergeMap, first, concat, of, from, Observable } from 'rxjs';

import * as AASTableActions from './aas-table.actions';
import * as AASTableSelectors from './aas-table.selectors';
import { AASTableApiService } from './aas-table-api.service';
import { AASTableFeatureState } from './aas-table.state';
import { TranslateService } from '@ngx-translate/core';

@Injectable()
export class AASTableEffects {
    private readonly store: Store<AASTableFeatureState>;

    constructor(
        private readonly actions: Actions,
        store: Store,
        private readonly translate: TranslateService,
        private readonly api: AASTableApiService,
    ) {
        this.store = store as Store<AASTableFeatureState>;
    }

    public getFirstPage = createEffect(() => {
        return this.actions.pipe(
            ofType<AASTableActions.GetFirstPageAction>(AASTableActions.AASTableActionType.GET_FIRST_PAGE),
            exhaustMap(action => this.api.getDocuments(
                { previous: null, limit: action.limit },
                action.filter,
                this.translate.currentLang).pipe(
                    mergeMap(page =>  this.setPageAndLoadContents(page)))));
    });

    public getLastPage = createEffect(() => {
        return this.actions.pipe(
            ofType<AASTableActions.GetLastPageAction>(AASTableActions.AASTableActionType.GET_LAST_PAGE),
            exhaustMap(action => this.api.getDocuments(
                { next: null, limit: action.limit },
                action.filter,
                this.translate.currentLang).pipe(
                    mergeMap(page => this.setPageAndLoadContents(page)))));
    });

    public getNextPage = createEffect(() => {
        return this.actions.pipe(
            ofType<AASTableActions.GetNextPageAction>(AASTableActions.AASTableActionType.GET_NEXT_PAGE),
            exhaustMap(action => this.store.select(AASTableSelectors.selectState).pipe(
                first(),
                mergeMap(state => {
                    if (state.rows.length === 0) return EMPTY;

                    return this.api.getDocuments(
                        {
                            next: this.getId(state.rows[state.rows.length - 1].document),
                            limit: action.limit
                        },
                        action.filter,
                        this.translate.currentLang);
                }),
                mergeMap(page => this.setPageAndLoadContents(page)))));
    });

    public getPreviousPage = createEffect(() => {
        return this.actions.pipe(
            ofType<AASTableActions.GetPreviousPageAction>(AASTableActions.AASTableActionType.GET_PREVIOUS_PAGE),
            exhaustMap(action => this.store.select(AASTableSelectors.selectState).pipe(
                first(),
                mergeMap(state => {
                    if (state.rows.length === 0) return EMPTY;

                    return this.api.getDocuments(
                        {
                            previous: this.getId(state.rows[0].document),
                            limit: action.limit
                        },
                        action.filter,
                        this.translate.currentLang);
                }),
                mergeMap(page => this.setPageAndLoadContents(page)))));
    });

    public initTreeView = createEffect(() => {
        return this.actions.pipe(
            ofType(AASTableActions.AASTableActionType.INIT_TREE_VIEW),
            exhaustMap(() => this.store.select(AASTableSelectors.selectSelectedDocuments).pipe(
                first(),
                mergeMap(documents => from(documents).pipe(
                        mergeMap(document => this.api.getHierarchy(document.endpoint, document.id)),
                        mergeMap(nodes => this.addRootAndLoadContents(nodes)))))));
    });

    private getId(document: AASDocument): AASDocumentId {
        return { id: document.id, endpoint: document.endpoint };
    }

    private setPageAndLoadContents(page: AASPage): Observable<Action> {
        return concat(
            of(AASTableActions.setPage({ page })),
            from(page.documents).pipe(
                mergeMap(document => this.api.getContent(document.endpoint, document.id).pipe(
                    map(content => AASTableActions.setContent({ document, content }))
                ))));
    }

    private addRootAndLoadContents(nodes: AASDocumentNode[]): Observable<Action> {
        return concat(
            of(AASTableActions.addRoot({ nodes })),
            from(nodes).pipe(
                mergeMap(document => this.api.getContent(document.endpoint, document.id).pipe(
                    map(content => AASTableActions.setContent({ document, content }))
                ))));
    }
}
