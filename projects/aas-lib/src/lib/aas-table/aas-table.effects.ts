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
import { AASDocument, AASDocumentId } from 'common';
import { EMPTY, exhaustMap, map, mergeMap, first } from 'rxjs';

import * as AASTableActions from './aas-table.actions';
import * as AASTableSelectors from './aas-table.selectors';
import { AASTableApiService } from './aas-table-api.service';
import { AASTableFeatureState } from './aas-table.state';
import { AuthService } from '../auth/auth.service';
import { TranslateService } from '@ngx-translate/core';

@Injectable()
export class AASTableEffects {
    private readonly store: Store<AASTableFeatureState>;
    private readonly defaultLimit = 10;

    constructor(
        private readonly actions: Actions,
        store: Store,
        private readonly translate: TranslateService,
        private readonly api: AASTableApiService,
        private readonly auth: AuthService
    ) {
        this.store = store as Store<AASTableFeatureState>;
    }

    public initialize = createEffect(() => {
        return this.actions.pipe(
            ofType(AASTableActions.AASTableActionType.INITIALIZE),
            exhaustMap(() => this.auth.ready.pipe(
                first(ready => ready === true),
                mergeMap(() => this.store.select(AASTableSelectors.selectState)),
                mergeMap(state => {
                    if (state.initialized) {
                        return EMPTY;
                    }

                    return this.api.getDocuments({ previous: null, limit: this.defaultLimit });
                }),
                map(page => AASTableActions.setPage({ page })))));
    });

    public getFirstPage = createEffect(() => {
        return this.actions.pipe(
            ofType<AASTableActions.GetPageAction>(AASTableActions.AASTableActionType.GET_FIRST_PAGE),
            exhaustMap(action => this.api.getDocuments(
                { previous: null, limit: action.limit },
                action.filter,
                this.translate.currentLang).pipe(
                    map(page => AASTableActions.setPage({ page })))));
    });

    public getLastPage = createEffect(() => {
        return this.actions.pipe(
            ofType<AASTableActions.GetPageAction>(AASTableActions.AASTableActionType.GET_LAST_PAGE),
            exhaustMap(action => this.api.getDocuments(
                { next: null, limit: action.limit },
                action.filter,
                this.translate.currentLang).pipe(
                    map(page => AASTableActions.setPage({ page })))));
    });

    public getNextPage = createEffect(() => {
        return this.actions.pipe(
            ofType<AASTableActions.GetPageAction>(AASTableActions.AASTableActionType.GET_NEXT_PAGE),
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
                map(page => AASTableActions.setPage({ page })))));
    });

    public getPreviousPage = createEffect(() => {
        return this.actions.pipe(
            ofType<AASTableActions.GetPageAction>(AASTableActions.AASTableActionType.GET_PREVIOUS_PAGE),
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
                map(page => AASTableActions.setPage({ page })))));
    });

    private getId(document: AASDocument): AASDocumentId {
        return { id: document.id, url: document.container.split('?')[0] };
    }
}
