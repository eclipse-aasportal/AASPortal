/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Location } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NgbAccordionModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import QRCode from 'qrcode';
import { ActivatedRoute } from '@angular/router';
import { first } from 'rxjs';
import {
    ChangeDetectionStrategy,
    Component,
    computed,
    effect,
    ElementRef,
    Inject,
    OnInit,
    signal,
    TemplateRef,
    viewChild,
} from '@angular/core';

import {
    aas,
    AASDocument,
    convertToString,
    getIdShortPath,
    getLocaleValue,
    getPreferredName,
    getSemanticId,
    isFile,
    isMultiLanguageProperty,
    isProperty,
    isSubmodelElementCollection,
    isSubmodelElementList,
} from 'aas-core';

import { ToolbarService } from '../toolbar.service';
import { WINDOW } from '../window.service';
import { AuthService } from '../auth/auth.service';
import { basename, decodeBase64Url, encodeBase64Url, toDisplayName } from '../utilities';
import { SecuredImageComponent } from '../secured-image/secured-image.component';
import { DigitalNameplateService } from './digital-nameplate.service';

export type NameplateGroup = { idShort: string; name: string; items: NameplateItem[] };

export type NameplateItem = {
    idShort: string;
    name: string;
    value: string;
    type: 'text' | 'link';
    element: aas.SubmodelElement;
    url?: string;
};

const IDTANameplate = 'https://admin-shell.io/idta/nameplate/3/0/Nameplate';
const ZVEINameplate = 'https://admin-shell.io/zvei/nameplate/2/0/Nameplate';
const FHGNameplate = 'urn:IOSB:Fraunhofer:de:KIReallabor:CUNACup:SemId:Submodel:Nameplate';
const HSUNameplate = 'https://www.hsu-hh.de/aut/aas/nameplate';

@Component({
    selector: 'fhg-digital-nameplate',
    templateUrl: './digital-nameplate.component.html',
    styleUrls: ['./digital-nameplate.component.scss'],
    providers: [DigitalNameplateService],
    imports: [TranslateModule, NgbPaginationModule, NgbAccordionModule, SecuredImageComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DigitalNameplateComponent implements OnInit {
    public constructor(
        private readonly route: ActivatedRoute,
        private readonly location: Location,
        private readonly translate: TranslateService,
        private readonly toolbar: ToolbarService,
        @Inject(WINDOW) private readonly window: Window,
        private readonly auth: AuthService,
        private readonly api: DigitalNameplateService,
    ) {
        effect(() => {
            const nameplateToolbar = this.nameplateToolbar();
            if (nameplateToolbar) {
                this.toolbar.set(nameplateToolbar);
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

    public readonly nameplateToolbar = viewChild<TemplateRef<unknown>>('nameplateToolbar');

    public readonly qrCode = viewChild<ElementRef<HTMLCanvasElement>>('qrCode');

    public readonly title = computed(() => {
        const tuple = this.nameplate();
        if (tuple === undefined) {
            return '-';
        }

        return this.getPreferredName(tuple[0].content, tuple[1]);
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
                        name: this.getPreferredName(document.content, element),
                        items,
                    });
                }
            } else if (isSubmodelElementList(element)) {
                const items = this.filterItems(document, submodel, element.value);
                if (items.length > 0) {
                    groups.push({
                        idShort: element.idShort,
                        name: this.getPreferredName(document.content, element),
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
        const state = this.location.getState() as Record<string, string>;
        if (state.data) {
            this.init(JSON.parse(state.data));
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

    public open($event: MouseEvent, item: NameplateItem): void {
        if (item.url) {
            const token = this.auth.token();
            this.window.open(item.url + '?access_token=' + token);
        }

        $event.stopPropagation();
    }

    private getDocument(id: string, endpoint?: string): void {
        this.api.getDocument(id, endpoint).subscribe({
            next: document => this.init([document]),
            error: error => console.debug(error),
        });
    }

    private init(documents: AASDocument[]) {
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
            const name = this.getPreferredName(document.content, value);
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
                    url: this.getUrl(document, submodel, value),
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

    private getPreferredName(env: aas.Environment | null | undefined, referable: aas.Referable): string {
        if (env) {
            const values = getPreferredName(env, referable);
            if (values) {
                const value = getLocaleValue(values, this.translate.currentLang);
                if (value) {
                    return value;
                }
            }
        }

        return toDisplayName(referable.idShort);
    }

    private getUrl(document: AASDocument, submodel: aas.Submodel, file: aas.File | undefined): string {
        if (file === undefined || file.value === undefined) {
            return '';
        }

        const smId = encodeBase64Url(submodel.id);
        const path = getIdShortPath(file);
        const name = encodeBase64Url(document.endpoint);
        const id = encodeBase64Url(document.id);
        return `/api/v1/endpoints/${name}/documents/${id}/submodels/${smId}/submodel-elements/${path}/value`;
    }
}
