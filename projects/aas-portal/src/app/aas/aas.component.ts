/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { NgClass } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateDirective } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { EMPTY, map, Observable, first, combineLatest } from 'rxjs';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import {
    Component,
    DOCUMENT,
    OnDestroy,
    OnInit,
    TemplateRef,
    computed,
    effect,
    inject,
    linkedSignal,
    viewChild,
} from '@angular/core';

import { aas } from 'aas-core';
import {
    decodeBase64Url,
    NotifyService,
    StartService,
    ToolbarService,
    encodeBase64Url,
    EndpointsApi,
    findRouteForShell,
    findRouteForSubmodel,
    VIEW_ROUTES,
    DashboardService,
    MaxLengthPipe,
} from 'aas-lib';

import { AASState } from './aas.state';

@Component({
    selector: 'fhg-aas',
    templateUrl: './aas.component.html',
    styleUrls: ['./aas.component.scss'],
    imports: [TranslateDirective, FormsModule, NgClass, RouterModule, NgbNavModule, MaxLengthPipe],
})
/**
 * Component responsible for managing and displaying Asset Administration Shell (AAS) functionality.
 * Handles document viewing, live mode operations, dashboard integration, and element manipulation.
 *
 * @remarks
 * This component provides features including:
 * - Live mode controls (play/stop)
 * - Dashboard integration
 * - Element creation, editing, and deletion
 * - Search functionality
 * - Download capabilities
 */
export class AASComponent implements OnInit, OnDestroy {
    private readonly state = inject(AASState);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly notify = inject(NotifyService);
    private readonly dashboard = inject(DashboardService);
    private readonly api = inject(EndpointsApi);
    private readonly toolbar = inject(ToolbarService);
    private readonly start = inject(StartService);
    private readonly dom = inject(DOCUMENT);
    private readonly viewRoutes = inject(VIEW_ROUTES);

    public constructor() {
        effect(() => {
            const toolbarTemplate = this.toolbarTemplate();
            if (toolbarTemplate !== undefined) {
                this.toolbar.set(toolbarTemplate);
            }
        });
    }

    /**
     * A template reference that defines the toolbar layout.
     * Accessed via ViewChild decorator targeting an element with the 'toolbar' template reference variable.
     */
    public readonly toolbarTemplate = viewChild<TemplateRef<unknown>>('toolbar');

    public readonly idShort = computed(() => this.state.document()?.idShort ?? '-');

    public readonly id = computed(() => this.state.document()?.id ?? '-');

    public readonly assetId = computed(() => this.state.document()?.assetId ?? '-');

    public readonly version = computed(() =>
        this.versionToString(this.state.document()?.content?.assetAdministrationShells?.at(0)?.administration),
    );

    public readonly document = this.state.document;

    public getSubmodels(): aas.Submodel[] | undefined {
        return this.state.document()?.content?.submodels ?? [];
    }

    public ngOnInit(): void {
        combineLatest([this.route.params.pipe(first()), this.route.queryParams.pipe(first())])
            .pipe(
                map(([routeParams, queryParams]) => {
                    return routeParams.id || routeParams.docs ? routeParams : queryParams;
                }),
                first(),
            )
            .subscribe(params => {
                if (params.id) {
                    if (params.endpoint) {
                        this.getDocument(decodeBase64Url(params.id), decodeBase64Url(params.endpoint));
                    } else {
                        this.getDocument(decodeBase64Url(params.id));
                    }
                }
            });
    }

    public ngOnDestroy(): void {
        this.toolbar.clear();
    }

    /**
     * Retrieves the thumbnail image URL for the current document.
     *
     * @returns {string} The URL of the thumbnail image. If no thumbnail is set in the document,
     * returns the default AAS thumbnail path '/assets/resources/aas-idta.png'
     */
    public getThumbnail(): string {
        const thumbnail = this.document()?.thumbnail;
        if (thumbnail) {
            return thumbnail;
        }

        return '/assets/resources/aas-idta.png';
    }

    /** The URL of the thumbnail. */
    public readonly thumbnail = linkedSignal(() => {
        const document = this.document();
        if (!document) {
            return '/assets/resources/aas-idta.png';
        }

        return `/api/v1/endpoints/${encodeBase64Url(document.endpoint)}/documents/${encodeBase64Url(document.id)}/thumbnail`;
    });

    public addToStart(): Observable<void> {
        const document = this.document();
        if (
            document &&
            this.start.add('Favorite', `AAS#${document.endpoint}#${document.id}`, {
                endpoint: document.endpoint,
                id: document.id,
                href: `/aas;endpoint=${encodeBase64Url(document.endpoint)};id=${encodeBase64Url(document.id)}`,
            })
        ) {
            return this.start.save();
        }

        return EMPTY;
    }

    private getDocument(id: string, endpoint?: string): void {
        this.api.getDocument('AssetAdministrationShell', id, endpoint).subscribe({
            next: document => this.state.update({ document }),
            error: error => console.debug(error),
        });
    }

    private versionToString(administration?: aas.AdministrativeInformation): string {
        let version: string = administration?.version ?? '';
        const revision: string = administration?.revision ?? '';
        if (revision.length > 0) {
            if (version.length > 0) {
                version += ' (' + revision + ')';
            } else {
                version = revision;
            }
        }

        if (version.length === 0) {
            version = '-';
        }

        return version;
    }

    public getSubmodelSemanticId(submodel: aas.Submodel): string {
        if (!submodel?.semanticId) return '';
        if (submodel?.semanticId?.keys?.length <= 0) return '';
        return submodel.semanticId.keys[0].value;
    }

    public getSubmodelIcon(submodel: aas.Submodel): string {
        //find out what type of submodel it is and
        //return a somewhat fitting thumbnail
        // Document-related
        // Nameplate-related
        // Contact-related
        // Carbon-related
        // Data-related

        const semId = this.getSubmodelSemanticId(submodel);

        if (semId.toLowerCase().includes('document') || submodel.idShort.toLowerCase().includes('document'))
            return 'bi-file-earmark-richtext';
        if (semId.toLowerCase().includes('contact') || submodel.idShort.toLowerCase().includes('contact'))
            return 'bi-card-text';
        if (semId.toLowerCase().includes('nameplate') || submodel.idShort.toLowerCase().includes('nameplate'))
            return 'bi-file-text';
        if (semId.toLowerCase().includes('carbon') || submodel.idShort.toLowerCase().includes('carbon'))
            return 'bi-leaf';
        if (semId.toLowerCase().includes('data') || submodel.idShort.toLowerCase().includes('data'))
            return 'bi-graph-up';
        if (semId.toLowerCase().includes('structure') || submodel.idShort.toLowerCase().includes('structure'))
            return 'bi-diagram-3';
        if (semId.toLowerCase().includes('assetstatus') || submodel.idShort.toLowerCase().includes('assetstatus'))
            return 'bi-info-circle';
        if (semId.toLowerCase().includes('servicerequest') || submodel.idShort.toLowerCase().includes('servicerequest'))
            return 'bi-person-gear';

        return 'bi-question-circle';
    }

    public openShellView(): (string | { endpoint: string; id: string })[] | undefined {
        const document = this.document();
        if (document === undefined) return undefined;
        const tuple = findRouteForShell(this.viewRoutes, document!);
        const route = tuple.route;

        if (route === undefined) return undefined;

        const endpoint = this.document()?.endpoint;
        if (endpoint === undefined) return undefined;

        const id = this.document()?.id;
        if (id === undefined) return undefined;

        return [`/views/${route.path}`, { endpoint: encodeBase64Url(endpoint), id: encodeBase64Url(id) }];
    }

    public openContentView(): (string | { endpoint: string; id: string })[] | undefined {
        const endpoint = this.document()?.endpoint;
        if (endpoint === undefined) return undefined;

        const id = this.document()?.id;
        if (id === undefined) return undefined;

        return [`/views/content`, { endpoint: encodeBase64Url(endpoint), id: encodeBase64Url(id) }];
    }

    public openBrowserView(): (string | { endpoint: string; id: string })[] | undefined {
        const endpoint = this.document()?.endpoint;
        if (endpoint === undefined) return undefined;

        const id = this.document()?.id;
        if (id === undefined) return undefined;

        return [`/views/Browser`, { endpoint: encodeBase64Url(endpoint), id: encodeBase64Url(id) }];
    }

    public openSubmodelView(submodel: aas.Submodel): (string | { endpoint: string; id: string })[] | undefined {
        const route = findRouteForSubmodel(this.viewRoutes, submodel);

        if (route === undefined) return undefined;

        const endpoint = this.document()?.endpoint;
        if (endpoint === undefined) return undefined;

        const id = this.document()?.id;
        if (id === undefined) return undefined;

        return [`/views/${route.path}`, { endpoint: encodeBase64Url(endpoint), id: encodeBase64Url(id) }];
    }
}
