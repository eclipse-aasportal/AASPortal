/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NgbAccordionModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import QRCode from 'qrcode';
import { ActivatedRoute } from '@angular/router';
import { EMPTY, first, from, mergeMap, Observable, of, toArray } from 'rxjs';
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

import {
    aas,
    AASDocument,
    convertToString,
    getLocaleValue,
    getReferable,
    getSemanticId,
    isFile,
    isMultiLanguageProperty,
    isProperty,
    isSubmodelElementCollection,
    isSubmodelElementList,
} from 'aas-core';

import { ToolbarService } from '../../services/toolbar.service';
import { WINDOW } from '../../services/window.service';
import { AuthService } from '../../components/auth/auth.service';
import { basename, decodeBase64Url, encodeBase64Url, getDisplayName, getUrl } from '../../utilities';
import { SecuredImageComponent } from '../../components/secured-image/secured-image.component';
import { EndpointsApi } from '../../services/endpoints-api';
import { StartService } from '../../services/start.service';
import { FHGNameplate, HSUNameplate, IDTANameplate, ZVEINameplate } from '../views';

export type NameplateGroup = { idShort: string; name: string; items: NameplateItem[] };

export type NameplateItem = {
    idShort: string;
    name: string;
    value: string;
    type: 'text' | 'link';
    element: aas.SubmodelElement;
    url?: string;
};

@Component({
    selector: 'fhg-digital-nameplate',
    templateUrl: './digital-nameplate.component.html',
    styleUrls: ['./digital-nameplate.component.scss'],
    imports: [TranslateModule, NgbPaginationModule, NgbAccordionModule, SecuredImageComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DigitalNameplateComponent implements OnInit, OnDestroy {
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

        effect(() => {
            const qrCode = this.qrCode();
            const url = new URL(this.window.location.toString());
            const tuple = this.nameplate();
            if (tuple) {
                const [document] = tuple;
                url.searchParams.set('endpoint', encodeBase64Url(document.endpoint));
                url.searchParams.set('id', encodeBase64Url(document.id));
            }

            if (qrCode) {
                QRCode.toCanvas(qrCode.nativeElement, url.toString());
            }
        });
    }

    public readonly toolbarTemplate = viewChild<TemplateRef<unknown>>('nameplateToolbar');

    public readonly qrCode = viewChild<ElementRef<HTMLCanvasElement>>('qrCode');

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

    public readonly nameplateIndex = signal(1);

    public readonly nameplateGroups = computed(() => {
        const groups: NameplateGroup[] = [];
        const tuple = this.nameplate();
        if (tuple === undefined) {
            return groups;
        }

        const [document, submodel] = tuple;
        if (submodel === undefined || submodel.submodelElements === undefined) {
            return groups;
        }

        groups.push({
            idShort: 'General',
            name: 'General',
            items: this.filterItems(document, submodel, submodel.submodelElements),
        });

        for (const element of submodel.submodelElements) {
            if (isSubmodelElementCollection(element)) {
                const items = this.filterItems(document, submodel, element.value);
                if (items.length > 0) {
                    groups.push({
                        idShort: element.idShort,
                        name: getDisplayName(element, document.content, this.translate.currentLang),
                        items,
                    });
                }
            } else if (isSubmodelElementList(element)) {
                const items = this.filterItems(document, submodel, element.value);
                if (items.length > 0) {
                    groups.push({
                        idShort: element.idShort,
                        name: getDisplayName(element, document.content, this.translate.currentLang),
                        items,
                    });
                }
            }
        }

        return groups;
    });

    public readonly thumbnail = computed(() => {
        const tuple = this.nameplate();
        if (tuple === undefined) {
            return '';
        }

        const [document] = tuple;
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

    public open($event: MouseEvent, item: NameplateItem): void {
        if (item.url) {
            const token = this.auth.token();
            this.window.open(item.url + '?access_token=' + token);
        }

        $event.stopPropagation();
    }

    public addToStart(): Observable<void> {
        const nameplate = this.nameplate();
        if (nameplate === undefined) {
            return EMPTY;
        }

        const endpoint = nameplate[0].endpoint;
        const id = nameplate[0].id;
        const details = this.getFavoriteDetails(nameplate[1]);
        const notes = this.getFavoriteNotes(nameplate[1]);
        const href = `/view/Nameplate?endpoint=${encodeBase64Url(endpoint)}&id=${encodeBase64Url(id)}`;
        if (!this.start.add('Favorite', `DNP#${endpoint}#${id}`, { endpoint, id, details, notes, href })) {
            return EMPTY;
        }

        return this.start.save();
    }

    private getFavoriteDetails(nameplate: aas.Submodel): { name: string; value: string }[] {
        const details: { name: string; value: string }[] = [];
        const manufacturerName = this.getPropertyValue(nameplate, 'ManufacturerName');
        if (manufacturerName) {
            details.push({ name: 'DigitalNameplate.ManufacturerName', value: manufacturerName });
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

    private filterItems(
        document: AASDocument,
        submodel: aas.Submodel,
        values: aas.SubmodelElement[] | undefined,
    ): NameplateItem[] {
        if (!values) {
            return [];
        }

        const items: NameplateItem[] = [];
        values.forEach(value => {
            const name = getDisplayName(value, document.content, this.translate.currentLang);
            if (isProperty(value)) {
                if (!value.value) {
                    return;
                }

                items.push({
                    idShort: value.idShort,
                    name,
                    type: 'text',
                    value: convertToString(value.value, this.translate.currentLang),
                    element: value,
                });
            } else if (isMultiLanguageProperty(value)) {
                if (value.value === undefined || value.value.length === 0) {
                    return;
                }

                items.push({
                    idShort: value.idShort,
                    name,
                    type: 'text',
                    value: getLocaleValue(value.value, this.translate.currentLang) ?? '-',
                    element: value,
                });
            } else if (isFile(value)) {
                if (!value.value) {
                    return;
                }

                items.push({
                    idShort: value.idShort,
                    name,
                    type: 'link',
                    value: basename(value.value),
                    url: getUrl(document, submodel, value),
                    element: value,
                });
            }
        });

        return items;
    }

    private *filterSubmodels(documents: AASDocument[]): Generator<[AASDocument, aas.Submodel]> {
        for (const document of documents) {
            if (!document.content) {
                continue;
            }

            for (const submodel of document.content.submodels) {
                const semanticId = getSemanticId(submodel);
                if (
                    semanticId === IDTANameplate ||
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
