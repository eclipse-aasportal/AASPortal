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
import { EMPTY, Observable } from 'rxjs';
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

import { aas, AASDocument, getReferable } from 'aas-core';

import { ToolbarService } from '../../services/toolbar.service';
import { encodeBase64Url, getDisplayName, toString } from '../../utilities';
import { EndpointsApi } from '../../services/endpoints-api';
import { StartService } from '../../services/start.service';
import { NAMEPLATE_FHG, NAMEPLATE_HSU, NAMEPLATE_3_0, NAMEPLATE_2_0 } from '../views';
import { ThumbnailQRCode } from '../thumbnail-qrcode/thumbnail-qrcode';
import { Nameplate } from './nameplate';
import { View } from '../view';

@Component({
    selector: 'fhg-nameplate-view',
    templateUrl: './nameplate.view.html',
    styleUrls: ['./nameplate.view.scss'],
    imports: [TranslateModule, NgbPaginationModule, NgbAccordionModule, ThumbnailQRCode, Nameplate],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NameplateView extends View implements OnInit, OnDestroy {
    private readonly langChange: Signal<LangChangeEvent | undefined>;
    private readonly currentLang: Signal<string>;
    private readonly nameplates = signal<[AASDocument, aas.Submodel][]>([]);
    private readonly nameplate = computed(() => this.nameplates().at(this.index() - 1));

    public constructor(
        route: ActivatedRoute,
        api: EndpointsApi,
        translate: TranslateService,
        private readonly toolbar: ToolbarService,
        private readonly start: StartService,
    ) {
        super(route, api);

        this.langChange = toSignal(translate.onLangChange);
        this.currentLang = computed(() => this.langChange()?.lang ?? translate.currentLang);

        effect(() => {
            const template = this.toolbarTemplate();
            if (template) {
                this.toolbar.set(template);
            }
        });
    }

    protected override get expectedSemanticIds(): string[] {
        return [NAMEPLATE_3_0, NAMEPLATE_2_0, NAMEPLATE_FHG, NAMEPLATE_HSU];
    }

    /** The toolbar. */
    public readonly toolbarTemplate = viewChild<TemplateRef<unknown>>('nameplateToolbar');

    public ngOnInit(): void {
        this.onInit();
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
        const currentLang = this.currentLang();
        if (manufacturerName?.value) {
            details.push({
                name: getDisplayName(manufacturerName, document.content, currentLang),
                value: manufacturerName.value,
            });
        }

        const productType = toString(nameplate, 'ManufacturerProductType', currentLang);
        if (productType) {
            details.push({ name: 'DigitalNameplate.ManufacturerProductType', value: productType });
        }

        const productFamily = toString(nameplate, 'ManufacturerProductFamily', currentLang);
        if (productFamily) {
            details.push({ name: 'DigitalNameplate.ManufacturerProductFamily', value: productFamily });
        }

        const articleNumber = toString(nameplate, 'ProductArticleNumberOfManufacturer', currentLang);
        if (articleNumber) {
            details.push({ name: 'DigitalNameplate.ProductArticleNumberOfManufacturer', value: articleNumber });
        }

        const serialNumber = toString(nameplate, 'SerialNumber', currentLang);
        if (serialNumber) {
            details.push({ name: 'DigitalNameplate.SerialNumber', value: serialNumber });
        }

        return details;
    }

    private getFavoriteNotes(submodel: aas.Submodel): string[] {
        const notes: string[] = [];
        const designation = toString(submodel, 'ManufacturerProductDesignation', this.currentLang());
        if (designation) {
            notes.push(designation);
        }

        return notes;
    }
}
