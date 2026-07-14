/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Router } from '@angular/router';
import { TranslateDirective, TranslatePipe } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { EMPTY, Observable } from 'rxjs';
import {
    Component,
    DOCUMENT,
    OnDestroy,
    TemplateRef,
    computed,
    effect,
    inject,
    linkedSignal,
    signal,
    viewChild,
} from '@angular/core';

import {
    aas,
    isProperty,
    isNumberType,
    isBlob,
    isSubmodel,
    toJsonValue,
    jsonization,
    AASDocument,
    equalArray,
} from 'aas-core';

import { AASTreeComponent } from '../../components/aas-tree/aas-tree.component';
import { NotifyService } from '../../core/notify/notify.service';
import { DashboardService } from '../../features/dashboard/dashboard.service';
import { ToolbarService } from '../../services/toolbar.service';
import { StartService } from '../../services/start.service';
import { encodeBase64Url } from '../../utilities';
import { DashboardChartType, DashboardPage } from '../../features/dashboard/dashboard-types';
import { CompositeView } from '../composite-view';
import { VIEW_ROUTE_NAME } from '../view-route-name';
import { LiveState } from '../../types';

export type DocumentContentData = {
    document: AASDocument | null;
    live: LiveState;
    searchExpression: string;
    selectedElements: aas.Referable[];
};

const initialState: DocumentContentData = {
    document: null,
    live: 'offline',
    searchExpression: '',
    selectedElements: [],
};

@Component({
    selector: 'fhg-aas',
    templateUrl: './document-content.html',
    styleUrls: ['./document-content.scss'],
    providers: [{ provide: VIEW_ROUTE_NAME, useValue: 'content' }],
    imports: [TranslateDirective, TranslatePipe, FormsModule, AASTreeComponent],
})
/**
 * Represents the main content view for an Asset Administration Shell (AAS) document.
 */
export class DocumentContent extends CompositeView implements OnDestroy {
    private readonly router = inject(Router);
    private readonly notify = inject(NotifyService);
    private readonly dashboard = inject(DashboardService);
    private readonly toolbar = inject(ToolbarService);
    private readonly start = inject(StartService);
    private readonly dom = inject(DOCUMENT);
    private readonly live$ = signal(initialState.live);
    private readonly searchExpression$ = signal(initialState.searchExpression);
    private readonly selectedElements$ = signal(initialState.selectedElements, {
        equal: (a, b) => equalArray(a, b),
    });

    public constructor() {
        super();

        effect(() => {
            const template = this.toolbarTemplate();
            if (template !== undefined) {
                this.toolbar.set(template);
            }
        });
    }

    /**
     * A template reference that defines the toolbar layout.
     * Accessed via ViewChild decorator targeting an element with the 'toolbar' template reference variable.
     */
    public readonly toolbarTemplate = viewChild<TemplateRef<unknown>>('toolbar');

    public readonly aasTree = viewChild<AASTreeComponent>('aasTree');

    public readonly live = this.live$.asReadonly();

    public readonly searchExpression = this.searchExpression$.asReadonly();

    public readonly dashboardPages = this.dashboard.pages;

    public readonly dashboardPage = this.dashboard.activePage;

    public readonly selectedElements = this.selectedElements$.asReadonly();

    public readonly canPlay = computed(() => {
        const live = this.live();
        return (this.document()?.onlineReady ?? false) && live === 'offline';
    });

    public readonly canStop = computed(() => {
        const live = this.live();
        return (this.document()?.onlineReady ?? false) && live === 'online';
    });

    public getSubmodels(): aas.Submodel[] | undefined {
        return this.document()?.content?.submodels ?? [];
    }

    /**
     * Computed signal that determines if a new element can be created.
     * Returns true if exactly one element is selected, false otherwise.
     * @returns A signal indicating whether a new element can be created
     */
    public readonly canNewElement = computed(() => this.selectedElements().length === 1);

    /**
     * Computed signal that determines if editing is allowed for the selected elements.
     * Returns true when exactly one element is selected, false otherwise.
     * @returns A signal containing true if exactly one element is selected, false otherwise
     */
    public readonly canEditElement = computed(() => this.selectedElements().length === 1);

    /**
     * Computed signal that determines if the selected elements can be deleted.
     * Returns true if there are selected elements and none of them are Asset Administration Shells.
     * @returns True if elements can be deleted, false otherwise.
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
     * @returns True if:
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
        this.update({ document: { ...this.document()!, thumbnail: undefined } });
    }

    /**
     * Initiates live mode by updating the state to 'online'.
     * Changes the current state to indicate that the system is actively running.
     */
    public play(): void {
        this.update({ live: 'online' });
    }

    /**
     * Stops the live mode by updating the state to 'offline'.
     */
    public stop(): void {
        this.update({ live: 'offline' });
    }

    /**
     * Adds a chart to the active dashboard page based on the selected elements and chart type.
     * Navigates to the dashboard view after adding the chart.
     * @param chartType - The type of chart to be added to the dashboard
     */
    public addToDashboard(chartType: string): void {
        const document = this.document();
        const page = this.dashboard.activePage();
        if (!document || !page) {
            return;
        }

        this.dashboard.addChart(page.name, document, this.selectedElements(), chartType as DashboardChartType);
        this.router.navigate(['/dashboard'], { queryParams: { page } });
    }

    /**
     * Sets the active page in the dashboard.
     * @param page - The dashboard page object to be set as active
     */
    public setDashboardPage(page: DashboardPage): void {
        this.dashboard.setActivePage(page.name);
    }

    /**
     * Updates the search expression.
     * @param value - The new search expression string to be set
     */
    public setSearchExpression(value: string): void {
        this.update({ searchExpression: value });
    }

    /**
     * Download the current state's document content or a single selected submodel as a JSON file.
     */
    public download(): void {
        try {
            const document = this.document();
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
                href: `/aas;endpoint=${encodeBase64Url(document.endpoint)};id=${encodeBase64Url(document.id)}`,
            })
        ) {
            return this.start.save();
        }

        return EMPTY;
    }

    public setSelectedElements(selectedElements: aas.Referable[]): void {
        this.update({ selectedElements });
    }

    public findNext(): void {
        this.aasTree()?.findNext();
    }

    public findPrevious(): void {
        this.aasTree()?.findPrevious();
    }

    private downloadSubmodel(submodel: aas.Submodel): void {
        const sm = jsonization.submodelFromJsonable(toJsonValue(submodel)).mustValue();
        this.downloadJson(submodel.idShort, jsonization.toJsonable(sm));
    }

    private downloadEnvironment(baseName: string, content: aas.Environment): void {
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

    private update(newState: Partial<DocumentContentData>): void {
        if (newState.live) {
            this.live$.set(newState.live);
        }

        if (newState.searchExpression !== undefined) {
            this.searchExpression$.set(newState.searchExpression);
        }

        if (newState.selectedElements) {
            this.selectedElements$.set(newState.selectedElements);
        }
    }
}
