/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { aas, AASDocument, getIdShortPath, getSemanticId, selectSubmodel } from 'aas-core';
import { ActivatedRoute } from '@angular/router';
import { EMPTY, first, Observable } from 'rxjs';
import { Location } from '@angular/common';
import { NgbAccordionModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import QRCode from 'qrcode';
import {
    ChangeDetectionStrategy,
    Component,
    computed,
    effect,
    ElementRef,
    Inject,
    OnDestroy,
    OnInit,
    signal,
    TemplateRef,
    viewChild,
} from '@angular/core';

import { CarbonFootprint, ZVEINameplate } from '../views/submodel-template';
import { DigitalProductPassportStore, DocumentationItem, NameValue } from './digital-product-passport.store';
import { SecuredImageComponent } from '../secured-image/secured-image.component';
import { decodeBase64Url, encodeBase64Url } from '../utilities';
import { DigitalProductPassportService } from './digital-product-passport.service';
import { WINDOW } from '../window.service';
import { AuthService } from '../auth/auth.service';
import { ToolbarService } from '../toolbar.service';
import { StartService } from '../start.service';

const HandoverDocumentationId = '0173-1#01-AHF578#003';

@Component({
    selector: 'fhg-device-passport-portal',
    templateUrl: './digital-product-passport.component.html',
    styleUrl: './digital-product-passport.component.scss',
    providers: [DigitalProductPassportService],
    imports: [TranslateModule, SecuredImageComponent, NgbAccordionModule, NgbPaginationModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DigitalProductPassportComponent implements OnInit, OnDestroy {
    public constructor(
        private readonly route: ActivatedRoute,
        private readonly location: Location,
        private readonly toolbar: ToolbarService,
        private readonly start: StartService,
        private readonly store: DigitalProductPassportStore,
        private readonly api: DigitalProductPassportService,
        @Inject(WINDOW) private readonly window: Window,
        private readonly auth: AuthService,
    ) {
        effect(() => {
            const template = this.toolbarTemplate();
            if (template) {
                this.toolbar.set(template);
            }
        });

        effect(() => {
            const qrCode = this.qrCode();
            const url = this.window.location.toString();
            if (qrCode) {
                QRCode.toCanvas(qrCode.nativeElement, url);
            }
        });
    }

    public readonly toolbarTemplate = viewChild<TemplateRef<unknown>>('dppToolbar');

    public readonly qrCode = viewChild<ElementRef<HTMLCanvasElement>>('qrCode');

    public readonly viewData = this.store.viewData$.asReadonly();

    public readonly hazardStatement = computed(() => {
        const nameplate = this.store.viewData$()?.nameplate;
        if (nameplate === undefined) {
            return '-';
        }

        return this.store.getPropertyValue(nameplate, 'AssetSpecificProperties.DppHazardStatement_01');
    });

    public readonly hazardSymbol = computed(() =>
        this.getUrl(this.store.getNameplateFile('AssetSpecificProperties.DppHazardSymbol')),
    );

    public readonly thumbnail = computed(() => {
        const document = this.store.viewData$()?.document;
        if (document === undefined) {
            return '';
        }

        return `/api/v1/endpoints/${encodeBase64Url(document.endpoint)}/documents/${encodeBase64Url(document.id)}/thumbnail`;
    });

    public readonly mainData = this.store.mainData;

    public readonly nameplateItems = computed(() => {
        const items: NameValue[] = [];
        for (const [name, value] of Object.entries(this.store.nameplateItems())) {
            if (typeof value === 'string') {
                items.push({ name: 'DigitalProductPassport.' + name, value });
            }
        }

        return items;
    });

    public readonly totalPCFCO2eq = this.store.totalPCFCO2eq;

    public readonly carbonFootprintItems = computed(() => {
        const items: NameValue[] = [];
        const item = this.store.carbonFootprintItems()[this.carbonFootprintIndex() - 1] as unknown as Record<
            string,
            unknown
        >;
        for (const name in item) {
            const value = item[name];
            if (typeof value === 'string') {
                items.push({ name: 'DigitalProductPassport.' + name, value });
            } else if (Array.isArray(value)) {
                for (const tuple of value) {
                    items.push({ name: `DigitalProductPassport.${name}${tuple[0]}`, value: tuple[1] });
                }
            }
        }

        return items;
    });

    public readonly carbonFootprintIndex = signal(1);

    public readonly carbonFootprintSize = computed(() => this.store.carbonFootprintItems().length);

    public readonly documentationData = this.store.documentationData;

    public ngOnInit(): void {
        const state = this.location.getState() as Record<string, string>;
        if (state.data) {
            const documents: AASDocument[] = JSON.parse(state.data);
            this.initialize(documents);
        } else {
            this.route.queryParams.pipe(first()).subscribe(params => {
                if (params.endpoint && params.id) {
                    if (params.id) {
                        if (params.endpoint) {
                            this.getDocument(decodeBase64Url(params.id), decodeBase64Url(params.endpoint));
                        } else {
                            this.getDocument(decodeBase64Url(params.id));
                        }
                    }
                }
            });
        }
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
        this.start.add('DigitalProductPassport', `DPP#${endpoint}#${id}`, { endpoint, id });
        return this.start.save();
    }

    public downloadDocumentation($event: MouseEvent, item: DocumentationItem) {
        const document = this.store.viewData$()?.document;
        if (document === undefined) {
            return;
        }

        const url = this.getUrl(item.file);
        const token = this.auth.token();
        this.window.open(url + '?access_token=' + token);
        $event.stopPropagation();
    }

    private getDocument(id: string, endpoint?: string): void {
        this.api.getDocument(id, endpoint).subscribe({
            next: document => this.initialize([document]),
            error: error => console.debug(error),
        });
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
                if (semanticId === ZVEINameplate) {
                    nameplate = submodel;
                } else if (semanticId === CarbonFootprint) {
                    carbonFootprint = submodel;
                } else if (semanticId === HandoverDocumentationId) {
                    handoverDocumentation = submodel;
                }
            }

            if (nameplate && carbonFootprint && handoverDocumentation) {
                this.store.viewData$.set({ document, nameplate, carbonFootprint, handoverDocumentation });
                break;
            }

            nameplate = carbonFootprint = handoverDocumentation = undefined;
        }
    }

    private getUrl(file: aas.File | undefined): string {
        if (file === undefined || file.value === undefined) {
            return '';
        }

        const document = this.store.viewData$()?.document;
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
}
