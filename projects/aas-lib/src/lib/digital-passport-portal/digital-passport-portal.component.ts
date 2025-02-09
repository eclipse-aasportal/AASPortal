/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { aas, AASDocument, getIdShortPath, getSemanticId, selectSubmodel } from 'aas-core';
import { ActivatedRoute } from '@angular/router';
import { first } from 'rxjs';
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
    OnInit,
    signal,
    viewChild,
} from '@angular/core';

import { CarbonFootprint, ZVEINameplate } from '../views/submodel-template';
import { DigitalProductPassportStore, DocumentationItem, NameValue } from './digital-passport-portal.store';
import { SecuredImageComponent } from '../secured-image/secured-image.component';
import { basename, decodeBase64Url, encodeBase64Url } from '../convert';
import { DigitalPassportPortalService } from './digital-passport-portal.service';
import { WINDOW } from '../window.service';
import { AuthService } from '../auth/auth.service';

const HandoverDocumentationId = '0173-1#01-AHF578#003';

@Component({
    selector: 'fhg-device-passport-portal',
    templateUrl: './digital-passport-portal.component.html',
    styleUrl: './digital-passport-portal.component.scss',
    providers: [DigitalPassportPortalService],
    imports: [TranslateModule, SecuredImageComponent, NgbAccordionModule, NgbPaginationModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DigitalPassportPortalComponent implements OnInit {
    public constructor(
        private readonly route: ActivatedRoute,
        private readonly location: Location,
        private readonly store: DigitalProductPassportStore,
        private readonly api: DigitalPassportPortalService,
        @Inject(WINDOW) private readonly window: Window,
        private readonly auth: AuthService,
    ) {
        effect(() => {
            const qrCode = this.qrCode();
            const url = this.window.location.toString();
            if (qrCode) {
                QRCode.toCanvas(qrCode.nativeElement, url);
            }
        });
    }

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
        this.resolveFile(this.store.getNameplateFile('AssetSpecificProperties.DppHazardSymbol')),
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
        const item = this.store.nameplateItems() as unknown as Record<string, string>;
        const items: NameValue[] = [];
        for (const name in item) {
            const value = item[name];
            if (typeof value === 'string') {
                items.push({ name: 'DigitalPassportPortal.' + name, value });
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
                items.push({ name: 'DigitalPassportPortal.' + name, value });
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

    public downloadDocumentation($event: MouseEvent, item: DocumentationItem) {
        const document = this.store.viewData$()?.document;
        if (document === undefined) {
            return;
        }

        const { url } = this.resolveFile(item.file);
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

    private resolveFile(file: aas.File | undefined): { url: string; name: string } {
        const value: { url: string; name: string } = { url: '', name: '' };
        if (file === undefined || file.value === undefined) {
            return value;
        }

        const document = this.store.viewData$()?.document;
        if (!document?.content) {
            return value;
        }

        const submodel = selectSubmodel(document.content, file);
        if (submodel === undefined) {
            return value;
        }

        const smId = encodeBase64Url(submodel.id);
        const path = getIdShortPath(file);
        value.name = basename(file.value);
        const name = encodeBase64Url(document.endpoint);
        const id = encodeBase64Url(document.id);
        value.url = `/api/v1/endpoints/${name}/documents/${id}/submodels/${smId}/submodel-elements/${path}/value`;
        return value;
    }
}
