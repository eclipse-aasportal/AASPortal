/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, exhaustMap, map, of } from 'rxjs';

import * as AASActions from './aas.actions';
import { AASApiService } from './aas-api.service';

@Injectable()
export class AASEffects {
    public constructor(
        private readonly actions: Actions,
        private readonly api: AASApiService,
    ) {}

    public getDocument = createEffect(() => {
        return this.actions.pipe(
            ofType<AASActions.GetDocumentAction>(AASActions.AASActionType.GET_DOCUMENT),
            exhaustMap(action =>
                this.api.getDocument(action.id, action.name).pipe(
                    map(document => AASActions.setDocument({ document })),
                    catchError(() => of(AASActions.setDocument({ document: null }))),
                ),
            ),
        );
    });

    public getDocumentContent = createEffect(() => {
        return this.actions.pipe(
            ofType<AASActions.GetDocumentContentAction>(AASActions.AASActionType.GET_DOCUMENT_CONTENT),
            exhaustMap(action =>
                this.api.getContent(action.document.id, action.document.endpoint).pipe(
                    map(content => AASActions.setDocument({ document: { ...action.document, content } })),
                    catchError(() => of(AASActions.setDocument({ document: action.document }))),
                ),
            ),
        );
    });
}
