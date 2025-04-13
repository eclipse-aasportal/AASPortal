/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ActivatedRoute } from '@angular/router';
import { first, from, mergeMap, of, toArray } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
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

import {
    aas,
    AASDocument,
    getAbbreviation,
    getChildren,
    getIdShortPath,
    isAssetAdministrationShell,
    isFile,
    isReference,
    selectSubmodel,
} from 'aas-core';
import { basename, decodeBase64Url, encodeBase64Url, isLangString, referenceToString } from '../../utilities';
import { DocumentsService } from '../../services/documents.service';
import { ToolbarService } from '../../services/toolbar.service';
import { WINDOW } from '../../services/window.service';
import { AuthService } from '../../auth/auth.service';

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
    selector: 'fhg-browser',
    templateUrl: './browser.component.html',
    styleUrl: './browser.component.scss',
    imports: [TranslateModule, NgbPaginationModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrowserComponent implements OnInit, OnDestroy {
    private readonly documents = signal<AASDocument[]>([]);

    public constructor(
        private readonly route: ActivatedRoute,
        private readonly api: DocumentsService,
        private readonly toolbar: ToolbarService,
        private readonly auth: AuthService,
        @Inject(WINDOW) private readonly window: Window,
    ) {
        effect(() => {
            const template = this.toolbarTemplate();
            if (template) {
                this.toolbar.set(template);
            }
        });

        effect(() => {
            const document = this.document();
            if (document === undefined) {
                this.current.set(undefined);
                return;
            }

            const env = document.content;
            if (!env || env.assetAdministrationShells.length === 0) {
                this.current.set(undefined);
                return;
            }

            const aas = env.assetAdministrationShells[0];
            this.current.set(this.createElement(aas, env));
        });
    }

    public readonly toolbarTemplate = viewChild<TemplateRef<unknown>>('browserToolbar');

    public readonly isEmpty = computed(() => this.documents().length === 0);

    public readonly documentSize = computed(() => this.documents().length);

    public readonly document = computed(() => this.documents().at(this.documentIndex() - 1));

    public readonly documentIndex = signal(1);

    public readonly path = signal<BrowserElement[]>([]);

    public readonly current = signal<BrowserElement | undefined>(undefined);

    public readonly properties = computed(() => this.current()?.properties ?? []);

    public readonly collection = computed(() => this.current()?.collection);

    public readonly children = computed(() => this.current()?.children ?? []);

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

    public goUp(element: BrowserElement): void {
        const index = this.path().indexOf(element);
        this.path.update(state => state.slice(0, index));
        this.current.set(element);
    }

    public goDown(element: BrowserElementRef): void {
        const current = this.current();
        if (current === undefined) {
            return;
        }

        this.path.update(state => [...state, current]);
        this.current.set(this.createElement(element.referable));
    }

    public open($event: MouseEvent, property: BrowserProperty): void {
        const element = this.current()?.referable;
        if (isFile(element) && element.value && property.name === 'value') {
            this.openFile(element);
        }

        $event.stopPropagation();
    }

    private initialize(documents: AASDocument[]) {
        this.documents.set(documents);
    }

    private createElement(referable: aas.Referable, env?: aas.Environment): BrowserElement {
        return {
            name: referable.idShort,
            referable,
            properties: this.createProperties(referable),
            collection: collectionNames[referable.modelType],
            children: getChildren(referable, env).map(child => ({
                name: child.idShort,
                abbreviation: getAbbreviation(child.modelType) ?? '',
                referable: child,
            })),
        };
    }

    private createProperties(referable: aas.Referable): BrowserProperty[] {
        const properties: BrowserProperty[] = [];
        for (const [key, value] of Object.entries(referable)) {
            if (ignore.has(key)) {
                continue;
            }

            properties.push(...this.createProperty(referable, key, value));
        }

        return properties.sort((a, b) => a.name.localeCompare(b.name));
    }

    private createProperty(referable: aas.Referable, name: string, value: unknown): BrowserProperty[] {
        if (typeof value === 'string') {
            if (isFile(referable) && name === 'value') {
                return [{ name, value, kind: 'link' }];
            }

            return [{ name, value, kind: 'text' }];
        }

        if (isReference(value)) {
            return [{ name, value: referenceToString(value), kind: 'text' }];
        }

        if (isLangString(value)) {
            return [
                {
                    name,
                    value: value.map(item => `[${item.language}] ${item.text}`).join(', '),
                    kind: 'text',
                },
            ];
        }

        if (typeof value === 'object' && !Array.isArray(value)) {
            const items: BrowserProperty[] = [];
            for (const [k, v] of Object.entries(value as object)) {
                items.push(...this.createProperty(referable, `${name}.${k}`, v));
            }

            return items;
        }

        return [];
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
