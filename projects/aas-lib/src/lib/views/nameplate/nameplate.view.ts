/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { LangChangeEvent, TranslateModule, TranslateService } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';
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

import { aas, AASDocument, getReferable, getSemanticId } from 'aas-core';

import { ToolbarService } from '../../services/toolbar.service';
import { decodeBase64Url, encodeBase64Url, getDisplayName, getPropertyValue } from '../../utilities';
import { EndpointsApi } from '../../services/endpoints-api';
import { StartService } from '../../services/start.service';
import { FHGNameplate, HSUNameplate, Nameplate_3_0, ZVEINameplate } from '../views';
import { ThumbnailQRCode } from '../thumbnail-qrcode/thumbnail-qrcode';
import { Nameplate } from './nameplate';

@Component({
    selector: 'fhg-nameplate-view',
    templateUrl: './nameplate.view.html',
    styleUrls: ['./nameplate.view.scss'],
    imports: [TranslateModule, NgbPaginationModule, NgbAccordionModule, ThumbnailQRCode, Nameplate],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NameplateView implements OnInit, OnDestroy {
    private readonly langChange: Signal<LangChangeEvent | undefined>;
    private readonly currentLang: Signal<string>;
    private readonly nameplates = signal<[AASDocument, aas.Submodel][]>([]);
    private readonly nameplate = computed(() => this.nameplates().at(this.index() - 1));

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

    /** The toolbar. */
    public readonly toolbarTemplate = viewChild<TemplateRef<unknown>>('nameplateToolbar');

    /** The title. */
    public readonly title = computed(() => {
        const tuple = this.nameplate();
        if (tuple === undefined) {
            return '-';
        }

        return getDisplayName(tuple[1], tuple[0].content, this.currentLang());
    });

    /** The total number of AAS documents that provide a nameplate. */
    public readonly count = computed(() => this.nameplates().length);

    /** The current active AAS document. */
    public readonly document = computed(() => {
        const nameplate = this.nameplate();
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
        const nameplate = this.nameplate();
        if (nameplate === undefined) {
            return EMPTY;
        }

        const endpoint = nameplate[0].endpoint;
        const id = nameplate[0].id;
        const details = this.getFavoriteDetails(nameplate[0], nameplate[1]);
        const notes = this.getFavoriteNotes(nameplate[1]);
        const href = `/view/Nameplate?endpoint=${encodeBase64Url(endpoint)}&id=${encodeBase64Url(id)}`;
        if (!this.start.add('Favorite', `DNP#${endpoint}#${id}`, { endpoint, id, details, notes, href })) {
            return EMPTY;
        }

        return this.start.save();
    }

    private getFavoriteDetails(document: AASDocument, nameplate: aas.Submodel): { name: string; value: string }[] {
        const details: { name: string; value: string }[] = [];
        const manufacturerName = getReferable<aas.Property>(nameplate, 'ManufacturerName');
        if (manufacturerName?.value) {
            details.push({
                name: getDisplayName(manufacturerName, document.content, this.currentLang()),
                value: manufacturerName.value,
            });
        }

        const productType = getPropertyValue(nameplate, 'ManufacturerProductType', this.currentLang());
        if (productType) {
            details.push({ name: 'DigitalNameplate.ManufacturerProductType', value: productType });
        }

        const productFamily = getPropertyValue(nameplate, 'ManufacturerProductFamily', this.currentLang());
        if (productFamily) {
            details.push({ name: 'DigitalNameplate.ManufacturerProductFamily', value: productFamily });
        }

        const articleNumber = getPropertyValue(nameplate, 'ProductArticleNumberOfManufacturer', this.currentLang());
        if (articleNumber) {
            details.push({ name: 'DigitalNameplate.ProductArticleNumberOfManufacturer', value: articleNumber });
        }

        const serialNumber = getPropertyValue(nameplate, 'SerialNumber', this.currentLang());
        if (serialNumber) {
            details.push({ name: 'DigitalNameplate.SerialNumber', value: serialNumber });
        }

        return details;
    }

    private getFavoriteNotes(submodel: aas.Submodel): string[] {
        const notes: string[] = [];
        const designation = getPropertyValue(submodel, 'ManufacturerProductDesignation', this.currentLang());
        if (designation) {
            notes.push(designation);
        }

        return notes;
    }

    private initialize(documents: AASDocument[]) {
        this.nameplates.set([...this.filterSubmodels(documents)]);
    }

    private *filterSubmodels(documents: AASDocument[]): Generator<[AASDocument, aas.Submodel]> {
        for (const document of documents) {
            if (!document.content) {
                continue;
            }

            for (const submodel of document.content.submodels) {
                const semanticId = getSemanticId(submodel);
                if (
                    semanticId === Nameplate_3_0 ||
                    semanticId === ZVEINameplate ||
                    semanticId === FHGNameplate ||
                    semanticId === HSUNameplate
                ) {
                    yield [document, submodel];
                }
            }
        }
    }
}
