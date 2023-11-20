/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { AfterViewInit, Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { EMPTY, from, mergeMap, of, Subscription, toArray, zip } from 'rxjs';
import * as lib from 'projects/aas-lib/src/public-api';

import { State } from './view.state';
import * as ViewActions from './view.actions';
import * as ViewSelectors from './view.selectors';
import { ToolbarService } from '../toolbar.service';
import { ViewAPIService } from './view-api.service';

@Component({
    selector: 'fhg-view',
    templateUrl: './view.component.html',
    styleUrls: ['./view.component.scss']
})
export class ViewComponent implements OnInit, AfterViewInit, OnDestroy {
    private readonly store: Store<State>;
    private readonly subscription = new Subscription();

    constructor(
        store: Store,
        private readonly route: ActivatedRoute,
        private readonly api: ViewAPIService,
        private readonly clipboard: lib.ClipboardService,
        private readonly toolbar: ToolbarService
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

    @ViewChild('viewToolbar', { read: TemplateRef })
    public viewToolbar: TemplateRef<unknown> | null = null;

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
                mergeMap(item => zip(this.api.getDocument(item.id, item.endpoint), of(item.idShort))),
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

    public ngAfterViewInit(): void {
        if (this.viewToolbar) {
            this.toolbar.set(this.viewToolbar);
        }
    }

    public ngOnDestroy(): void {
        this.subscription.unsubscribe();
        this.toolbar.clear();
    }
}