/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import {
    aas,
    AASDocument,
    convertToString,
    getIdShortPath,
    getLocaleValue,
    getReferable,
    getSemanticId,
    isFile,
    isMultiLanguageProperty,
    isProperty,
    selectSubmodel,
} from 'aas-core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { EMPTY, first, from, mergeMap, Observable, of, toArray } from 'rxjs';
import { NgbAccordionModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { LangChangeEvent, TranslateModule, TranslateService } from '@ngx-translate/core';
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

import { CARBON_FOOTPRINT_1_0, HANDOVER_DOCUMENTATION_2_0, NAMEPLATE_3_0 } from '../views';
import { SecuredImageComponent } from '../../components/secured-image/secured-image.component';
import { decodeBase64Url, encodeBase64Url, toString } from '../../utilities';
import { EndpointsApi } from '../../services/endpoints-api';
import { ToolbarService } from '../../services/toolbar.service';
import { StartService } from '../../services/start.service';
import { ThumbnailQRCode } from '../thumbnail-qrcode/thumbnail-qrcode';
import { CarbonFootprint } from '../carbon-footprint/carbon-footprint';
import { Nameplate } from '../nameplate/nameplate';
import { HandoverDocumentation } from '../handover-documentation/handover-documentation';

export type MainData = {
    uriOfTheProduct: string;
    productType: string;
    serialNumber: string;
};

type ViewData = {
    document: AASDocument;
    nameplate: aas.Submodel;
    carbonFootprint: aas.Submodel;
    handoverDocumentation: aas.Submodel;
};

const emptyMainData: MainData = {
    uriOfTheProduct: '-',
    productType: '-',
    serialNumber: '-',
};

@Component({
    selector: 'fhg-device-passport-portal',
    templateUrl: './digital-product-passport.view.html',
    styleUrl: './digital-product-passport.view.scss',
    imports: [
        TranslateModule,
        SecuredImageComponent,
        NgbAccordionModule,
        NgbPaginationModule,
        ThumbnailQRCode,
        CarbonFootprint,
        Nameplate,
        HandoverDocumentation,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DigitalProductPassportView implements OnInit, OnDestroy {
    private readonly langChange: Signal<LangChangeEvent | undefined>;
    private readonly currentLang: Signal<string>;
    private readonly viewData$ = signal<ViewData | undefined>(undefined);

    public constructor(
        private readonly route: ActivatedRoute,
        private readonly api: EndpointsApi,
        private readonly toolbar: ToolbarService,
        private readonly start: StartService,
        translate: TranslateService,
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

    public readonly toolbarTemplate = viewChild<TemplateRef<unknown>>('dppToolbar');

    public readonly viewData = this.viewData$.asReadonly();

    public readonly document = computed(() => this.viewData$()?.document);

    public readonly hazardStatement = computed(() => {
        const nameplate = this.viewData$()?.nameplate;
        if (nameplate === undefined) {
            return '-';
        }

        return toString(nameplate, 'AssetSpecificProperties.DPPHazardStatement_01', this.currentLang());
    });

    public readonly hazardSymbol = computed(() =>
        this.getUrl(this.getNameplateFile('AssetSpecificProperties.DPPHazardSymbol')),
    );

    public readonly mainData = computed<MainData>(() => {
        const nameplate = this.viewData$()?.nameplate;
        const currentLang = this.currentLang();
        if (nameplate === undefined) {
            return emptyMainData;
        }

        return {
            uriOfTheProduct: toString(nameplate, 'URIOfTheProduct', currentLang),
            productType: toString(nameplate, 'ManufacturerProductType', currentLang),
            serialNumber: toString(nameplate, 'SerialNumber', currentLang),
        };
    });

    public ngOnInit(): void {
        this.route.params
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
        const document = this.viewData()?.document;
        if (document === undefined) {
            return EMPTY;
        }

        const endpoint = document.endpoint;
        const id = document.id;
        const href = `/view/DigitalProductPassport;endpoint=${encodeBase64Url(endpoint)};id=${encodeBase64Url(id)}`;
        this.start.add('Favorite', `DPP#${endpoint}#${id}`, { endpoint, id, href });
        return this.start.save();
    }

    private initialize(documents: AASDocument[]): void {
        let nameplate: aas.Submodel | undefined;
        let carbonFootprint: aas.Submodel | undefined;
        let handoverDocumentation: aas.Submodel | undefined;
        for (const document of documents) {
            if (!document.content) {
                continue;
            }

            for (const submodel of document.content.submodels) {
                const semanticId = getSemanticId(submodel);
                if (semanticId === NAMEPLATE_3_0) {
                    nameplate = submodel;
                } else if (semanticId === CARBON_FOOTPRINT_1_0) {
                    carbonFootprint = submodel;
                } else if (semanticId === HANDOVER_DOCUMENTATION_2_0) {
                    handoverDocumentation = submodel;
                }
            }

            if (nameplate && carbonFootprint && handoverDocumentation) {
                this.viewData$.set({ document, nameplate, carbonFootprint, handoverDocumentation });
                break;
            }

            nameplate = carbonFootprint = handoverDocumentation = undefined;
        }
    }

    private getUrl(file: aas.File | undefined): string {
        if (file === undefined || file.value === undefined) {
            return '';
        }

        const document = this.viewData$()?.document;
        if (!document?.content) {
            return '';
        }

        const submodel = selectSubmodel(document.content, file);
        if (submodel === undefined) {
            return '';
        }

        const smId = encodeBase64Url(submodel.id);
        const path = getIdShortPath(file);
        const name = encodeBase64Url(document.endpoint);
        const id = encodeBase64Url(document.id);
        return `/api/v1/endpoints/${name}/documents/${id}/submodels/${smId}/submodel-elements/${path}/value`;
    }

    // private getPropertyValue(submodel: aas.Submodel, idShortPath: string): string {
    //     const referable = getReferable(submodel, idShortPath);
    //     if (isProperty(referable)) {
    //         switch (referable.valueType) {
    //             case 'xs:double':
    //             case 'xs:integer':
    //                 return convertToString(referable.value, this.translate.currentLang);
    //             case 'xs:string':
    //                 return referable.value ?? '';
    //             default:
    //                 return referable.value ?? '-';
    //         }
    //     }

    //     if (isMultiLanguageProperty(referable)) {
    //         return getLocaleValue(referable.value, this.translate.currentLang) ?? '-';
    //     }

    //     return '-';
    // }

    public getNameplateFile(idShortPath: string): aas.File | undefined {
        const submodel = this.viewData$()?.nameplate;
        if (submodel?.submodelElements === undefined || idShortPath.length === 0) {
            return undefined;
        }

        const referable = getReferable(submodel, idShortPath);
        if (isFile(referable)) {
            return referable;
        }

        return undefined;
    }
}
