/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { LangChangeEvent, TranslateModule, TranslateService } from '@ngx-translate/core';
import { NgbAccordionModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute } from '@angular/router';
import { EMPTY, first, from, mergeMap, Observable, of, toArray } from 'rxjs';
import {
    ChangeDetectionStrategy,
    Component,
    computed,
    effect,
    OnDestroy,
    OnInit,
    Signal,
    signal,
    TemplateRef,
    viewChild,
} from '@angular/core';

import { aas, AASDocument, getSemanticId } from 'aas-core';

import { ToolbarService } from '../../services/toolbar.service';
import { decodeBase64Url, getDisplayName } from '../../utilities';
import { EndpointsApi } from '../../services/endpoints-api';
import { StartService } from '../../services/start.service';
import { TechnicalData_1_2 } from '../views';
import { ThumbnailQRCode } from '../thumbnail-qrcode/thumbnail-qrcode';
import { TechnicalData } from './technical-data';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
    selector: 'fhg-technical-data-view',
    imports: [TranslateModule, NgbPaginationModule, NgbAccordionModule, ThumbnailQRCode, TechnicalData],
    templateUrl: './technical-data.view.html',
    styleUrl: './technical-data.view.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TechnicalDataView implements OnInit, OnDestroy {
    private readonly langChange: Signal<LangChangeEvent | undefined>;
    private readonly currentLang: Signal<string>;
    private readonly tuples = signal<[AASDocument, aas.Submodel][]>([]);
    private readonly tuple = computed(() => this.tuples().at(this.index() - 1));

    public constructor(
        private readonly route: ActivatedRoute,
        translate: TranslateService,
        private readonly toolbar: ToolbarService,
        private readonly start: StartService,
        private readonly api: EndpointsApi,
    ) {
        this.langChange = toSignal(translate.onLangChange);
        this.currentLang = computed(() => this.langChange()?.lang ?? translate.currentLang);

        effect(() => {
            const template = this.toolbarTemplate();
            if (template) {
                this.toolbar.set(template);
            }
        });
    }

    public readonly toolbarTemplate = viewChild<TemplateRef<unknown>>('toolbar');

    public readonly title = computed(() => {
        const tuple = this.tuple();
        if (tuple === undefined) {
            return '-';
        }

        return getDisplayName(tuple[1], tuple[0].content, this.currentLang());
    });

    public readonly count = computed(() => this.tuples().length);

    public readonly document = computed(() => {
        const nameplate = this.tuple();
        return nameplate ? nameplate[0] : undefined;
    });

    public readonly index = signal(1);

    public ngOnInit(): void {
        this.route.queryParams
            .pipe(
                first(),
                mergeMap(params => {
                    if (params.id) {
                        const endpoint = params.endpoint ? decodeBase64Url(params.endpoint) : undefined;
                        return this.api.getDocument(decodeBase64Url(params.id), endpoint).pipe(toArray());
                    }

                    if (!params.docs) {
                        return of([]);
                    }

                    const docs: [string, string][] = JSON.parse(decodeBase64Url(params.docs));
                    return from(docs).pipe(
                        mergeMap(([endpoint, id]) => this.api.getDocument(id, endpoint)),
                        toArray(),
                    );
                }),
            )
            .subscribe(documents => {
                this.initialize(documents);
            });
    }

    public ngOnDestroy(): void {
        this.toolbar.clear();
    }

    public addToStart(): Observable<void> {
        return EMPTY;
    }

    private initialize(documents: AASDocument[]) {
        this.tuples.set([...this.filterSubmodels(documents)]);
    }

    private *filterSubmodels(documents: AASDocument[]): Generator<[AASDocument, aas.Submodel]> {
        for (const document of documents) {
            if (!document.content) {
                continue;
            }

            for (const submodel of document.content.submodels) {
                const semanticId = getSemanticId(submodel);
                if (semanticId === TechnicalData_1_2) {
                    yield [document, submodel];
                }
            }
        }
    }
}
