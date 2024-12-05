/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import {
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    OnDestroy,
    OnInit,
    TemplateRef,
    ViewChild,
} from '@angular/core';

import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { EMPTY, from, mergeMap, of, Subscription, toArray, zip } from 'rxjs';

import { ToolbarService } from '../toolbar.service';
import { ViewApiService } from './view-api.service';
import {
    ClipboardService,
    CustomerFeedbackComponent,
    DigitalNameplateComponent,
    DocumentSubmodelPair,
    SubmodelViewDescriptor,
    ViewQuery,
    ViewQueryParams,
} from 'aas-lib';
import { ViewStore } from './view.store';

@Component({
    selector: 'fhg-view',
    templateUrl: './view.component.html',
    styleUrls: ['./view.component.scss'],
    standalone: true,
    imports: [DigitalNameplateComponent, CustomerFeedbackComponent, TranslateModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewComponent implements OnInit, AfterViewInit, OnDestroy {
    private readonly subscription = new Subscription();

    public constructor(
        private readonly route: ActivatedRoute,
        private readonly api: ViewApiService,
        private readonly store: ViewStore,
        private readonly clipboard: ClipboardService,
        private readonly toolbar: ToolbarService,
    ) {}

    @ViewChild('viewToolbar', { read: TemplateRef })
    public viewToolbar: TemplateRef<unknown> | null = null;

    public readonly template = this.store.template$.asReadonly();

    public readonly submodels = this.store.submodels$.asReadonly();

    public ngOnInit(): void {
        let query: ViewQuery | undefined;
        const params = this.route.snapshot.queryParams as ViewQueryParams;
        if (params.format) {
            query = this.clipboard.get(params.format);
        }

        if (query?.descriptor) {
            const descriptor: SubmodelViewDescriptor = query.descriptor;
            zip(
                of(descriptor.template),
                from(descriptor.submodels).pipe(
                    mergeMap(item => zip(this.api.getDocument(item.endpoint, item.id), of(item.idShort))),
                    mergeMap(tuple => {
                        const submodel = tuple[0].content?.submodels.find(item => item.idShort === tuple[1]);
                        if (submodel?.modelType === 'Submodel') {
                            return of({ document: tuple[0], submodel } as DocumentSubmodelPair);
                        }

                        return EMPTY;
                    }),
                    toArray(),
                ),
            ).subscribe(tuple => {
                this.store.submodels$.set(tuple[1]);
                this.store.template$.set(tuple[0]);
            });
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
