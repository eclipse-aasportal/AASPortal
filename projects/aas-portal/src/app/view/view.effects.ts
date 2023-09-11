/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { exhaustMap, mergeMap, from, zip, of, EMPTY, toArray, map } from 'rxjs';
import { DocumentSubmodelPair } from 'aas-lib';
import * as ViewActions from './view.actions';
import { ProjectService } from '../project/project.service';

/** Currently not used. Does not work with ProjectService */
@Injectable()
export class ViewEffects {
    constructor(
        private readonly actions: Actions,
        private readonly project: ProjectService
    ) { }

    public setSubmodels = createEffect(() => {
        return this.actions.pipe(
            ofType<ViewActions.SetSubmodelsAction>(ViewActions.ViewActionType.SET_SUBMODELS),
            exhaustMap(action => from(action.descriptor.submodels)),
            mergeMap(item => {
                return zip(this.project.getDocument(item.id, item.url), of(item.idShort))
            }),
            mergeMap(tuple => {
                const submodel = tuple[0].content?.submodels.find(item => item.idShort === tuple[1]);
                if (submodel?.modelType === 'Submodel') {
                    return of({ document: tuple[0], submodel } as DocumentSubmodelPair);
                }

                return EMPTY;
            }),
            toArray(),
            map(submodels => ViewActions.initView({ submodels })));
    });
}