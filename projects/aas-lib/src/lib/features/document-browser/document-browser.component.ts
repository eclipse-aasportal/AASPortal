/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ActivatedRoute } from '@angular/router';
import { EMPTY, first, from, mergeMap, Observable, of, toArray } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
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

import { aas, AASDocument, getIdShortPath, isFile, selectElement, selectSubmodel } from 'aas-core';

import { basename, decodeBase64Url, encodeBase64Url } from '../../utilities';
import { DocumentsService } from '../../services/documents.service';
import { ToolbarService } from '../../services/toolbar.service';
import { WINDOW } from '../../services/window.service';
import { AuthService } from '../auth/auth.service';
import { SecuredImageComponent } from '../../components/secured-image/secured-image.component';
import { StartService } from '../../services/start.service';
import { BrowserItem, BrowserComponent } from '../../components/browser/browser.component';

export type BrowserProperty = {
    name: string;
    value: string;
    kind: 'text' | 'link';
};

export type BrowserElementRef = {
    name: string;
    abbreviation: string;
    referable: aas.Referable;
};

export type BrowserElement = {
    name: string;
    referable: aas.Referable;
    collection?: string;
    properties: BrowserProperty[];
    children: BrowserElementRef[];
};

const collectionNames: Record<string, string> = {
    SubmodelElementCollection: 'value',
    SubmodelElementList: 'value',
    Submodel: 'submodelElements',
    AssetAdministrationShell: 'submodels',
    Entity: 'statements',
    AnnotatedRelationshipElement: 'annotations',
    Operation: 'in-/inout-/outputVariables',
};

const ignore = new Set(['parent', 'methodId', 'objectId', 'nodeId']);

@Component({
    selector: 'fhg-doc-browser',
    templateUrl: './document-browser.component.html',
    styleUrl: './document-browser.component.scss',
    imports: [TranslateModule, NgbPaginationModule, SecuredImageComponent, BrowserComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentBrowserComponent implements OnInit, OnDestroy {
    private readonly documents = signal<AASDocument[]>([]);

    public constructor(
        private readonly route: ActivatedRoute,
        private readonly api: DocumentsService,
        private readonly toolbar: ToolbarService,
        private readonly auth: AuthService,
        private readonly start: StartService,
        @Inject(WINDOW) private readonly window: Window,
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
            const document = this.document();
            if (document) {
                url.searchParams.set('endpoint', encodeBase64Url(document.endpoint));
                url.searchParams.set('id', encodeBase64Url(document.id));
            }

            if (qrCode) {
                QRCode.toCanvas(qrCode.nativeElement, url.toString());
            }
        });
    }

    public readonly toolbarTemplate = viewChild<TemplateRef<unknown>>('browserToolbar');

    public readonly qrCode = viewChild<ElementRef<HTMLCanvasElement>>('qrCode');

    public readonly thumbnail = computed(() => {
        const document = this.document();
        if (document === undefined) {
            return '';
        }

        return `/api/v1/endpoints/${encodeBase64Url(document.endpoint)}/documents/${encodeBase64Url(document.id)}/thumbnail`;
    });

    public readonly isEmpty = computed(() => this.documents().length === 0);

    public readonly documentSize = computed(() => this.documents().length);

    public readonly document = computed(() => this.documents().at(this.documentIndex() - 1));

    public readonly documentIndex = signal(1);

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

    public open(item: BrowserItem): void {
        const env = this.document()?.content;
        if (!env) {
            return;
        }

        const referable = selectElement(env, item.smId, item.idShortPath);
        if (!referable) {
            return;
        }

        if (isFile(referable) && referable.value && item.property === 'Value') {
            this.openFile(referable);
        }
    }

    public addToStart(): Observable<void> {
        const document = this.document();
        if (document === undefined) {
            return EMPTY;
        }

        const endpoint = document.endpoint;
        const id = document.id;
        const href = `/view/Browser?endpoint=${encodeBase64Url(endpoint)}&id=${encodeBase64Url(id)}`;
        if (!this.start.add('Favorite', `B#${endpoint}#${id}`, { endpoint, id, href })) {
            return EMPTY;
        }

        return this.start.save();
    }

    private initialize(documents: AASDocument[]) {
        this.documents.set(documents);
    }

    private openFile(file: aas.File): void {
        if (!file.value) {
            return;
        }

        const { url } = this.resolveFile(file);
        if (url === undefined) {
            return;
        }

        this.window.open(url + '?access_token=' + this.auth.token());
    }

    private resolveFile(file: aas.File): { url?: string; name?: string } {
        const value: { url?: string; name?: string } = {};
        const document = this.document();
        if (document?.content && file.value) {
            const submodel = selectSubmodel(document.content, file);
            if (submodel) {
                const smId = encodeBase64Url(submodel.id);
                const path = getIdShortPath(file);
                value.name = basename(file.value);
                const name = encodeBase64Url(document.endpoint);
                const id = encodeBase64Url(document.id);
                value.url = `/api/v1/endpoints/${name}/documents/${id}/submodels/${smId}/submodel-elements/${path}/value`;
            }
        }

        return value;
    }
}
