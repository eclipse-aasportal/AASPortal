/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Location } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
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
    untracked,
    viewChild,
} from '@angular/core';

import {
    aas,
    AASDocument,
    convertToString,
    getIdShortPath,
    getLocaleValue,
    getPreferredName,
    getReferable,
    getSemanticId,
    isFile,
    isMultiLanguageProperty,
    isProperty,
    isSubmodelElementCollection,
    selectSubmodel,
} from 'aas-core';

import { ToolbarService } from '../../toolbar.service';
import { WINDOW } from '../../window.service';
import { AuthService } from '../../auth/auth.service';
import { basename, decodeBase64Url, encodeBase64Url, toDisplayName } from '../../utilities';
import { SecuredImageComponent } from '../../secured-image/secured-image.component';
import { StartService } from '../../start.service';
import { HandoverDocumentation } from '../views';
import { DocumentsService } from '../../services/documents.service';

export type DocumentationItem = {
    title: string;
    version: string;
    filename: string;
    file: aas.File;
};

@Component({
    selector: 'fhg-digital-nameplate',
    templateUrl: './handover-documentation.component.html',
    styleUrls: ['./handover-documentation.component.scss'],
    imports: [TranslateModule, NgbPaginationModule, SecuredImageComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HandoverDocumentationComponent implements OnInit, OnDestroy {
    private readonly handoverDocumentations = signal<[AASDocument, aas.Submodel][]>([]);

    public constructor(
        private readonly route: ActivatedRoute,
        private readonly location: Location,
        private readonly translate: TranslateService,
        private readonly toolbar: ToolbarService,
        private readonly start: StartService,
        @Inject(WINDOW) private readonly window: Window,
        private readonly auth: AuthService,
        private readonly api: DocumentsService,
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
            const tuple = this.handoverDocumentation();
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

    public readonly toolbarTemplate = viewChild<TemplateRef<unknown>>('handoverDocumentationToolbar');

    public readonly qrCode = viewChild<ElementRef<HTMLCanvasElement>>('qrCode');

    public readonly title = computed(() => {
        const tuple = this.handoverDocumentation();
        if (tuple === undefined) {
            return '-';
        }

        return this.getPreferredName(tuple[0].content, tuple[1]);
    });

    public readonly handoverDocumentationSize = computed(() => this.handoverDocumentations().length);

    public readonly handoverDocumentation = computed(() =>
        this.handoverDocumentations().at(this.handoverDocumentationIndex() - 1),
    );

    public readonly handoverDocumentationIndex = signal(1);

    public readonly thumbnail = computed(() => {
        const tuple = this.handoverDocumentation();
        if (tuple === undefined) {
            return '';
        }

        const [document] = tuple;
        return `/api/v1/endpoints/${encodeBase64Url(document.endpoint)}/documents/${encodeBase64Url(document.id)}/thumbnail`;
    });

    public readonly documentationItems = computed(() => {
        const items: DocumentationItem[] = [];
        const handoverDocumentation = this.handoverDocumentation();
        if (handoverDocumentation === undefined || handoverDocumentation[1].submodelElements === undefined) {
            return items;
        }

        for (const sme of handoverDocumentation[1].submodelElements) {
            if (isSubmodelElementCollection(sme)) {
                if (sme.value === undefined) {
                    continue;
                }

                this.browseForDocumentation(sme.value, items, handoverDocumentation[1], sme.idShort);
            }
        }

        return items;
    });

    private readonly document = computed(() => {
        const tuple = this.handoverDocumentation();
        if (tuple === undefined) {
            return undefined;
        }

        return tuple[0];
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

    public downloadDocumentation($event: MouseEvent, item: DocumentationItem) {
        const document = untracked(this.document);
        if (document === undefined) {
            return;
        }

        const url = this.getUrl(item.file);
        const token = this.auth.token();
        this.window.open(url + '?access_token=' + token);
        $event.stopPropagation();
    }

    public addToStart(): Observable<void> {
        const nameplate = this.handoverDocumentation();
        if (nameplate === undefined) {
            return EMPTY;
        }

        const endpoint = nameplate[0].endpoint;
        const id = nameplate[0].id;
        const href = `/view/HandoverDocumentation?endpoint=${encodeBase64Url(endpoint)}&id=${encodeBase64Url(id)}`;
        const notes = ['Hello', 'World'];
        if (!this.start.add('Favorite', `HOD#${endpoint}#${id}`, { endpoint, id, href, notes })) {
            return EMPTY;
        }

        return this.start.save();
    }

    private initialize(documents: AASDocument[]) {
        this.handoverDocumentations.set([...this.filterSubmodels(documents)]);
    }

    private *filterSubmodels(documents: AASDocument[]): Generator<[AASDocument, aas.Submodel]> {
        for (const document of documents) {
            if (!document.content) {
                continue;
            }

            for (const submodel of document.content.submodels) {
                const semanticId = getSemanticId(submodel);
                if (semanticId === HandoverDocumentation) {
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

    private browseForDocumentation(
        elements: aas.SubmodelElement[],
        items: DocumentationItem[],
        sm: aas.Submodel,
        idShortPath: string,
    ) {
        for (const element of elements) {
            if (isSubmodelElementCollection(element)) {
                if (element.value) {
                    this.browseForDocumentation(element.value, items, sm, idShortPath + '.' + element.idShort);
                }
            } else if (isFile(element)) {
                items.push({
                    title: this.getPropertyValue(sm, idShortPath + '.Title'),
                    version: this.getPropertyValue(sm, idShortPath + '.Version'),
                    filename: element.value ? basename(element.value) : '-',
                    file: element,
                });
            }
        }
    }

    public getPropertyValue(submodel: aas.Submodel, idShortPath: string): string {
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

    private getUrl(file: aas.File | undefined): string {
        if (file === undefined || file.value === undefined) {
            return '';
        }

        const document = untracked(this.document);
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
