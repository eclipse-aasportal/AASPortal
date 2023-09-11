/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { EMPTY, from, mergeMap, of, Subscription, toArray, zip } from 'rxjs';
import * as lib from 'aas-lib';

import { State } from './view.state';
import * as ViewActions from './view.actions';
import * as ViewSelectors from './view.selectors';
import { ProjectService } from '../project/project.service';

@Component({
    selector: 'fhg-view',
    templateUrl: './view.component.html',
    styleUrls: ['./view.component.scss']
})
export class ViewComponent implements OnInit, OnDestroy {
    private readonly store: Store<State>;
    private readonly subscription = new Subscription();

    constructor(
        store: Store,
        private readonly route: ActivatedRoute,
        private readonly project: ProjectService,
        private readonly clipboard: lib.ClipboardService
    ) {
        this.store = store as Store<State>;
        this.subscription.add(this.store.select(ViewSelectors.selectSubmodels)
            .pipe().subscribe(submodels => {
                this.submodels = submodels;
            }));

        this.subscription.add(this.store.select(ViewSelectors.selectTemplate)
            .pipe().subscribe(template => {
                this.template = template;
            }));
    }

    public template?: string;

    public submodels: lib.DocumentSubmodelPair[] = [];

    public ngOnInit(): void {
        let query: lib.ViewQuery | undefined;
        const params = this.route.snapshot.queryParams as lib.ViewQueryParams;
        if (params.format) {
            query = this.clipboard.get(params.format);
        }

        if (query?.descriptor) {
            const descriptor: lib.SubmodelViewDescriptor = query.descriptor;
            zip(of(descriptor.template), from(descriptor.submodels).pipe(
                mergeMap(item => zip(this.project.getDocument(item.id, item.url), of(item.idShort))),
                mergeMap(tuple => {
                    const submodel = tuple[0].content?.submodels.find(item => item.idShort === tuple[1]);
                    if (submodel?.modelType === 'Submodel') {
                        return of({ document: tuple[0], submodel } as lib.DocumentSubmodelPair);
                    }

                    return EMPTY;
                }),
                toArray()
            )).subscribe(tuple => this.store.dispatch(
                ViewActions.initView({ submodels: tuple[1], template: tuple[0] })));
        }
    }

    public ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }
}