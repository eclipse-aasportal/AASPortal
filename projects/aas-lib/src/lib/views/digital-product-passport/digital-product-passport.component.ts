/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { aas, AASDocument, getIdShortPath, getSemanticId, selectSubmodel } from 'aas-core';
import { ActivatedRoute } from '@angular/router';
import { EMPTY, first, from, mergeMap, Observable, of, toArray } from 'rxjs';
import { NgbAccordionModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
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

import { CarbonFootprint_1_0, HandoverDocumentation, IDTANameplate } from '../views';
import { DigitalProductPassportStore, DocumentationItem, NameValue } from './digital-product-passport.store';
import { SecuredImageComponent } from '../../components/secured-image/secured-image.component';
import { decodeBase64Url, encodeBase64Url, getDisplayName } from '../../utilities';
import { EndpointsApi } from '../../services/endpoints-api';
import { WINDOW } from '../../services/window.service';
import { AuthService } from '../../components/auth/auth.service';
import { ToolbarService } from '../../services/toolbar.service';
import { StartService } from '../../services/start.service';
import { ThumbnailQRCode } from '../thumbnail-qrcode/thumbnail-qrcode';
import { CarbonFootprint } from "../carbon-footprint/carbon-footprint";

@Component({
    selector: 'fhg-device-passport-portal',
    templateUrl: './digital-product-passport.component.html',
    styleUrl: './digital-product-passport.component.scss',
    imports: [TranslateModule, SecuredImageComponent, NgbAccordionModule, NgbPaginationModule, ThumbnailQRCode, CarbonFootprint],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DigitalProductPassportComponent implements OnInit, OnDestroy {
    public constructor(
        private readonly route: ActivatedRoute,
        private readonly toolbar: ToolbarService,
        private readonly start: StartService,
        private readonly store: DigitalProductPassportStore,
        private readonly api: EndpointsApi,
        @Inject(WINDOW) private readonly window: Window,
        private readonly auth: AuthService,
    ) {
        effect(() => {
            const template = this.toolbarTemplate();
            if (template) {
                this.toolbar.set(template);
            }
        });
    }

    public readonly toolbarTemplate = viewChild<TemplateRef<unknown>>('dppToolbar');

    public readonly viewData = this.store.viewData$.asReadonly();

    public readonly document = computed(() => this.store.viewData$()?.document);

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

    public readonly documentationData = this.store.documentationData;

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
        const document = this.viewData()?.document;
        if (document === undefined) {
            return EMPTY;
        }

        const endpoint = document.endpoint;
        const id = document.id;
        const href = `/view/DigitalProductPassport?endpoint=${encodeBase64Url(endpoint)}&id=${encodeBase64Url(id)}`;
        this.start.add('Favorite', `DPP#${endpoint}#${id}`, { endpoint, id, href });
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
                if (semanticId === IDTANameplate) {
                    nameplate = submodel;
                } else if (semanticId === CarbonFootprint_1_0) {
                    carbonFootprint = submodel;
                } else if (semanticId === HandoverDocumentation) {
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
