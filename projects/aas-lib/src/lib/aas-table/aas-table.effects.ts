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
import { AASCursor, AASWorkspace } from 'common';
import { catchError, EMPTY, exhaustMap, from, map, merge, mergeMap, Observable, of, skipWhile, zip } from 'rxjs';

import * as AASTableActions from './aas-table.actions';
import * as AASTableSelectors from './aas-table.selectors';
import { AASTableApiService } from './aas-table-api.service';
import { AASTableFeatureState } from './aas-table.state';

@Injectable()
export class AASTableEffects {
    private readonly store: Store<AASTableFeatureState>;

    constructor(
        private readonly actions: Actions,
        store: Store,
        private readonly api: AASTableApiService
    ) {
        this.store = store as Store<AASTableFeatureState>;
    }

    public initialize = createEffect(() => {
        return this.actions.pipe(
            ofType(AASTableActions.AASTableActionType.INITIALIZE),
            exhaustMap(() => this.store.select(AASTableSelectors.selectState)),
            mergeMap(state => {
                if (state.initialized) {
                    return EMPTY;
                }

                return this.api.getDocuments({ previous: null, limit: state.cursor.limit });
            }),
            mergeMap(page => from(page.documents)),
            skipWhile(document => document.content != null),
            mergeMap(document => zip(of(document), this.api.getContent(document.container, document.id))),
            map(tuple => AASTableActions.setDocumentContent({ document: tuple[0], content: tuple[1] })));
    });
}
