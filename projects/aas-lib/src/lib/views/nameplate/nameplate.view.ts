/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NgbAccordionModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute } from '@angular/router';
import { EMPTY, first, from, mergeMap, Observable, of, toArray } from 'rxjs';
import {
    ChangeDetectionStrategy,
    Component,
    computed,
    effect,
    Inject,
    OnDestroy,
    OnInit,
    signal,
    TemplateRef,
    viewChild,
} from '@angular/core';

import {
    aas,
    AASDocument,
    convertToString,
    getLocaleValue,
    getReferable,
    getSemanticId,
    isMultiLanguageProperty,
    isProperty,
} from 'aas-core';

import { ToolbarService } from '../../services/toolbar.service';
import { WINDOW } from '../../services/window.service';
import { AuthService } from '../../components/auth/auth.service';
import { decodeBase64Url, encodeBase64Url, getDisplayName } from '../../utilities';
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
    public constructor(
        private readonly route: ActivatedRoute,
        private readonly translate: TranslateService,
        private readonly toolbar: ToolbarService,
        private readonly start: StartService,
        @Inject(WINDOW) private readonly window: Window,
        private readonly auth: AuthService,
        private readonly api: EndpointsApi,
    ) {
        effect(() => {
            const template = this.toolbarTemplate();
            if (template) {
                this.toolbar.set(template);
            }
        });
    }

    public readonly toolbarTemplate = viewChild<TemplateRef<unknown>>('nameplateToolbar');

    public readonly title = computed(() => {
        const tuple = this.nameplate();
        if (tuple === undefined) {
            return '-';
        }

        return getDisplayName(tuple[1], tuple[0].content, this.translate.currentLang);
    });

    private readonly nameplates = signal<[AASDocument, aas.Submodel][]>([]);

    public readonly nameplateSize = computed(() => this.nameplates().length);

    public readonly nameplate = computed(() => this.nameplates().at(this.nameplateIndex() - 1));

    public readonly document = computed(() => {
        const nameplate = this.nameplate();
        return nameplate ? nameplate[0] : undefined;
    });

    public readonly nameplateIndex = signal(1);

    public readonly thumbnail = computed(() => {
        const document = this.document();
        if (!document) {
            return '';
        }

        return `/api/v1/endpoints/${encodeBase64Url(document.endpoint)}/documents/${encodeBase64Url(document.id)}/thumbnail`;
    });

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
                name: getDisplayName(manufacturerName, document.content, this.translate.currentLang),
                value: manufacturerName.value,
            });
        }

        const productType = this.getPropertyValue(nameplate, 'ManufacturerProductType');
        if (productType) {
            details.push({ name: 'DigitalNameplate.ManufacturerProductType', value: productType });
        }

        const productFamily = this.getPropertyValue(nameplate, 'ManufacturerProductFamily');
        if (productFamily) {
            details.push({ name: 'DigitalNameplate.ManufacturerProductFamily', value: productFamily });
        }

        const articleNumber = this.getPropertyValue(nameplate, 'ProductArticleNumberOfManufacturer');
        if (articleNumber) {
            details.push({ name: 'DigitalNameplate.ProductArticleNumberOfManufacturer', value: articleNumber });
        }

        const serialNumber = this.getPropertyValue(nameplate, 'SerialNumber');
        if (serialNumber) {
            details.push({ name: 'DigitalNameplate.SerialNumber', value: serialNumber });
        }

        return details;
    }

    private getFavoriteNotes(submodel: aas.Submodel): string[] {
        const notes: string[] = [];
        const designation = this.getPropertyValue(submodel, 'ManufacturerProductDesignation');
        if (designation) {
            notes.push(designation);
        }

        return notes;
    }

    private getPropertyValue(submodel: aas.Submodel, idShortPath: string): string {
        const referable = getReferable(submodel, idShortPath);
        if (isProperty(referable)) {
            switch (referable.valueType) {
                case 'xs:double':
                case 'xs:integer':
                    return convertToString(referable.value, this.translate.currentLang);
                case 'xs:string':
                    return referable.value ?? '';
                default:
                    return referable.value ?? '-';
            }
        }

        if (isMultiLanguageProperty(referable)) {
            return getLocaleValue(referable.value, this.translate.currentLang) ?? '-';
        }

        return '-';
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
