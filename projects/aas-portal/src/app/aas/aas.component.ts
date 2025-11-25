import { CommonModule } from '@angular/common';
/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import head from 'lodash-es/head';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { EMPTY, map, Observable, first, combineLatest } from 'rxjs';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import {
    ChangeDetectionStrategy,
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

import { aas, isProperty, isNumberType, isBlob, jsonization, isSubmodel, toJsonValue } from 'aas-core';
import {
    AASTreeComponent,
    decodeBase64Url,
    NotifyService,
    StartService,
    ToolbarService,
    encodeBase64Url,
    EndpointsApi,
    findRouteForShell,
    findRouteForSubmodel,
    VIEW_ROUTES,
} from 'aas-lib';

import { AASState } from './aas.state';
import { DashboardChartType, DashboardPage } from '../dashboard/dashboard-types';
import { DashboardService } from '../dashboard/dashboard.service';

@Component({
    selector: 'fhg-aas',
    templateUrl: './aas.component.html',
    styleUrls: ['./aas.component.scss'],
    imports: [TranslateModule, FormsModule, AASTreeComponent, CommonModule, RouterModule, NgbNavModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
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

    public readonly aasTree = viewChild<AASTreeComponent>('aasTree');

    public readonly treeState = this.state.treeState;

    public readonly address = computed(() => this.state.document()?.address ?? '-');

    public readonly idShort = computed(() => this.state.document()?.idShort ?? '-');

    public readonly id = computed(() => this.state.document()?.id ?? '-');

    public readonly assetId = computed(() => this.state.document()?.assetId ?? '-');

    public readonly readOnly = computed(() => !!this.state.document()?.readonly);

    public readonly version = computed(() =>
        this.versionToString(head(this.state.document()?.content?.assetAdministrationShells)?.administration),
    );

    public readonly document = this.state.document;

    public readonly live = this.state.live;

    public readonly searchExpression = this.state.searchExpression;

    public readonly dashboardPages = this.dashboard.pages;

    public readonly dashboardPage = this.dashboard.activePage;

    public readonly selectedElements = this.state.selectedElements;

    public readonly canPlay = computed(() => {
        const state = this.state.live();
        return (this.state.document()?.onlineReady ?? false) && state === 'offline';
    });

    public readonly canStop = computed(() => {
        const state = this.state.live();
        return (this.state.document()?.onlineReady ?? false) && state === 'online';
    });

    public getSubmodels() {
        if (!this.state.document()) return [];
        if (!this.state.document()?.content) return [];
        if (!this.state.document()?.content?.submodels) return [];

        return this.state.document()?.content?.submodels;
    }

    /**
     * Computed signal that determines if a new element can be created.
     * Returns true if exactly one element is selected, false otherwise.
     * @readonly
     * @returns {Signal<boolean>} A signal indicating whether a new element can be created
     */
    public readonly canNewElement = computed(() => this.selectedElements().length === 1);

    /**
     * Computed signal that determines if editing is allowed for the selected elements.
     * Returns true when exactly one element is selected, false otherwise.
     *
     * @returns {Signal<boolean>} A signal containing true if exactly one element is selected, false otherwise
     */
    public readonly canEditElement = computed(() => this.selectedElements().length === 1);

    /**
     * Computed signal that determines if the selected elements can be deleted.
     * Returns true if there are selected elements and none of them are Asset Administration Shells.
     * @returns {boolean} True if elements can be deleted, false otherwise.
     */
    public readonly canDeleteElement = computed(() => {
        const selectedElements = this.selectedElements();
        return (
            selectedElements.length > 0 && selectedElements.every(item => item.modelType !== 'AssetAdministrationShell')
        );
    });

    /**
     * Computed signal that determines if selected elements can be added to the dashboard.
     *
     * @returns {boolean} True if:
     * - A dashboard page is selected
     * - At least one element is selected
     * - All selected elements are either number properties or time series
     *
     * @remarks
     * This is used to enable/disable dashboard-related functionality based on the current selection state.
     */
    public readonly canAddToDashboard = computed(() => {
        const selectedElements = this.selectedElements();
        return (
            this.dashboardPage() != null &&
            selectedElements.length > 0 &&
            selectedElements.every(element => this.isNumberProperty(element) || this.isTimeSeries(element))
        );
    });

    public ngOnInit(): void {
        combineLatest([this.route.params.pipe(first()), this.route.queryParams.pipe(first())])
            .pipe(
                map(([routeParams, queryParams]) => {
                    return routeParams.id || routeParams.docs ? routeParams : queryParams;
                }),
                first(),
            )
            .subscribe(params => {
                if (params.search) {
                    this.state.update({ searchExpression: params.search });
                }

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

    /**
     * Clears the thumbnail of the current document by setting it to undefined.
     * This method updates the document state while preserving other document properties.
     */
    public clearThumbnail(): void {
        this.state.update({ document: { ...this.document()!, thumbnail: undefined } });
    }

    /**
     * Initiates live mode by updating the state to 'online'.
     * Changes the current state to indicate that the system is actively running.
     * @public
     */
    public play(): void {
        this.state.update({ live: 'online' });
    }

    /**
     * Stops the live mode by updating the state to 'offline'.
     */
    public stop(): void {
        this.state.update({ live: 'offline' });
    }

    /**
     * Adds a chart to the active dashboard page based on the selected elements and chart type.
     * Navigates to the dashboard view after adding the chart.
     *
     * @param chartType - The type of chart to be added to the dashboard
     * @returns void
     * @throws No explicit throws, but will silently return if document or page is null
     */
    public addToDashboard(chartType: string): void {
        const document = this.state.document();
        const page = this.dashboard.activePage();
        if (!document || !page) {
            return;
        }

        this.dashboard.addChart(page.name, document, this.state.selectedElements(), chartType as DashboardChartType);
        this.router.navigate(['/dashboard'], { queryParams: { page } });
    }

    /**
     * Sets the active page in the dashboard.
     * @param page - The dashboard page object to be set as active
     * @throws {Error} When page object is invalid or undefined
     */
    public setDashboardPage(page: DashboardPage): void {
        this.dashboard.setActivePage(page.name);
    }

    /**
     * Updates the search expression.
     * @param value - The new search expression string to be set
     */
    public setSearchExpression(value: string): void {
        this.state.update({ searchExpression: value });
    }

    /**
     * Download the current state's document content or a single selected submodel as a JSON file.
     */
    public download(): void {
        try {
            const document = this.state.document();
            if (!document || !document.content) {
                return;
            }

            const selectedElements = this.selectedElements();
            if (selectedElements.length === 1 && isSubmodel(selectedElements[0])) {
                this.downloadSubmodel(selectedElements[0]);
            } else {
                this.downloadEnvironment(document.idShort, document.content);
            }
        } catch (error) {
            this.notify.error(error);
        }
    }

    public addToStart(): Observable<void> {
        const document = this.document();
        if (
            document &&
            this.start.add('Favorite', `AAS#${document.endpoint}#${document.id}`, {
                endpoint: document.endpoint,
                id: document.id,
                href: `/aas?endpoint=${encodeBase64Url(document.endpoint)}&id=${encodeBase64Url(document.id)}`,
            })
        ) {
            return this.start.save();
        }

        return EMPTY;
    }

    public setSelectedElements(selectedElements: aas.Referable[]): void {
        this.state.update({ selectedElements });
    }

    public findNext(): void {
        this.aasTree()?.findNext();
    }

    public findPrevious(): void {
        this.aasTree()?.findPrevious();
    }

    private downloadSubmodel(submodel: aas.Submodel) {
        const sm = jsonization.submodelFromJsonable(toJsonValue(submodel)).mustValue();
        this.downloadJson(submodel.idShort, jsonization.toJsonable(sm));
    }

    private downloadEnvironment(baseName: string, content: aas.Environment) {
        const env = jsonization.environmentFromJsonable(toJsonValue(content)).mustValue();
        this.downloadJson(baseName, jsonization.toJsonable(env));
    }

    private downloadJson(baseName: string, value: jsonization.JsonValue): void {
        const contentStr = JSON.stringify(value, null, 4);
        const blob = new Blob([contentStr], { type: 'application/json' });
        const filename = `${baseName}.json`;
        const a = this.dom.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.setAttribute('download', filename);
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }

    private isNumberProperty(element: aas.Referable): boolean {
        if (isProperty(element)) {
            return isNumberType(element.valueType);
        }

        return false;
    }

    // Hack, Hack
    private isTimeSeries(element: aas.Referable): boolean {
        return (
            isBlob(element) &&
            element.value != null &&
            element.idShort === 'TimeSeriesHistory' &&
            element.contentType === 'application/json'
        );
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

    public getSubmodelSemanticId(submodel: aas.Submodel) {
        if (!submodel) return '';
        if (!submodel.semanticId) return '';
        if (submodel.semanticId.keys.length <= 0) return '';
        return submodel.semanticId.keys[0].value;
    }

    public getSubmodelIcon(submodel: aas.Submodel) {
        //find out what type of submodel it is and
        //return a somewhat fitting thumbnail
        // Document-related
        // Nameplate-related
        // Contact-related
        // Carbon-related
        // Data-related

        const semId = this.getSubmodelSemanticId(submodel);
        if (!semId) return 'bi-question-circle';

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

        return 'bi-question-circle';
    }

    public openShellView() {
        const document = this.document();
        if (document === undefined) return '';
        const tuple = findRouteForShell(this.viewRoutes, document!);
        const route = tuple.route;

        if (route === undefined) return undefined;

        const endpoint = this.document()?.endpoint;
        if (endpoint === undefined) return undefined;

        const id = this.document()?.id;
        if (id === undefined) return undefined;

        return [`/views/${route.path}`, { endpoint: encodeBase64Url(endpoint), id: encodeBase64Url(id) }];
    }

    public openBrowserView() {
        const endpoint = this.document()?.endpoint;
        if (endpoint === undefined) return undefined;

        const id = this.document()?.id;
        if (id === undefined) return undefined;

        return [`/views/Browser`, { endpoint: encodeBase64Url(endpoint), id: encodeBase64Url(id) }];
    }

    public openSubmodelView(submodel: aas.Submodel) {
        const route = findRouteForSubmodel(this.viewRoutes, submodel);

        if (route === undefined) return undefined;

        const endpoint = this.document()?.endpoint;
        if (endpoint === undefined) return undefined;

        const id = this.document()?.id;
        if (id === undefined) return undefined;

        return [`/views/${route.path}`, { endpoint: encodeBase64Url(endpoint), id: encodeBase64Url(id) }];
    }
}
