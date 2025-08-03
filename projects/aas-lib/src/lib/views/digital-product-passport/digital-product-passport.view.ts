/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { aas, getReferable, isFile } from 'aas-core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { EMPTY, Observable } from 'rxjs';
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
    TemplateRef,
    viewChild,
} from '@angular/core';

import { encodeBase64Url, getUrl, toString } from '../../utilities';
import { EndpointsApi } from '../../services/endpoints-api';
import { ToolbarService } from '../../services/toolbar.service';
import { StartService } from '../../services/start.service';
import { CompositeView, CarbonFootprint, Nameplate, HandoverDocumentation, ThumbnailQRCode } from '../../internal';

export type MainData = {
    uriOfTheProduct: string;
    productType: string;
    serialNumber: string;
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
        NgbAccordionModule,
        NgbPaginationModule,
        ThumbnailQRCode,
        CarbonFootprint,
        Nameplate,
        HandoverDocumentation,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DigitalProductPassportView extends CompositeView implements OnInit, OnDestroy {
    private readonly langChange: Signal<LangChangeEvent | undefined>;
    private readonly currentLang: Signal<string>;

    public constructor(
        route: ActivatedRoute,
        api: EndpointsApi,
        translate: TranslateService,
        private readonly toolbar: ToolbarService,
        private readonly start: StartService,
    ) {
        super(route, api, 'DigitalProductPassport');

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

    public readonly submodels = computed(() => {
        const tuple = this.tuple();
        if (!tuple) {
            return undefined;
        }

        return tuple[1];
    });

    public readonly hazardStatement = computed(() => {
        const nameplate = this.submodels()?.Nameplate;
        if (nameplate === undefined) {
            return '-';
        }

        return toString(nameplate, 'AssetSpecificProperties.DPPHazardStatement_01', this.currentLang());
    });

    public readonly hazardSymbol = computed(() => {
        const document = this.document();
        if (!document) {
            return '/assets/resources/image.svg';
        }

        return (
            getUrl(document, this.getNameplateFile('AssetSpecificProperties.DPPHazardSymbol')) ??
            '/assets/resources/image.svg'
        );
    });

    public readonly mainData = computed<MainData>(() => {
        const nameplate = this.submodels()?.Nameplate;
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
        this.onInit();
    }

    public ngOnDestroy(): void {
        this.toolbar.clear();
    }

    public addToStart(): Observable<void> {
        const document = this.document();
        if (document === undefined) {
            return EMPTY;
        }

        const endpoint = document.endpoint;
        const id = document.id;
        const href = `/view/DigitalProductPassport;endpoint=${encodeBase64Url(endpoint)};id=${encodeBase64Url(id)}`;
        this.start.add('Favorite', `DPP#${endpoint}#${id}`, { endpoint, id, href });
        return this.start.save();
    }

    private getNameplateFile(idShortPath: string): aas.File | undefined {
        const submodel = this.submodels()?.Nameplate;
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
