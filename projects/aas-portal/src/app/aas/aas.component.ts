/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import head from 'lodash-es/head';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { EMPTY, map, mergeMap, Observable, from, of, catchError, first } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
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
    viewChild,
} from '@angular/core';

import { aas, isProperty, isNumberType, isBlob, jsonization, toJsonValue, isSubmodel } from 'aas-core';
import {
    AASTreeComponent,
    AuthService,
    decodeBase64Url,
    NotifyService,
    StartService,
    ToolbarService,
    encodeBase64Url,
    EndpointsApi,
} from 'aas-lib';

import { CommandHandler } from '../aas/command-handler';
import { EditElementFormComponent } from './edit-element-form/edit-element-form.component';
import { UpdateElementCommand } from './commands/update-element-command';
import { DeleteCommand } from './commands/delete-command';
import { NewElementCommand } from './commands/new-element-command';
import { NewElementFormComponent } from './new-element-form/new-element-form.component';
import { DashboardService } from '../dashboard/dashboard.service';
import { AASState } from './aas.state';
import { DashboardChartType, DashboardPage } from '../dashboard/dashboard-types';
import { JsonValue } from 'projects/aas-core/dist/types/aas-core/jsonization';

@Component({
    selector: 'fhg-aas',
    templateUrl: './aas.component.html',
    styleUrls: ['./aas.component.scss'],
    imports: [TranslateModule, FormsModule, AASTreeComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * Component responsible for managing and displaying Asset Administration Shell (AAS) functionality.
 * Handles document viewing, live mode operations, dashboard integration, and element manipulation.
 *
 * @remarks
 * This component provides features including:
 * - Document viewing and modification
 * - Live mode controls (play/stop)
 * - Dashboard integration
 * - Element creation, editing, and deletion
 * - Undo/Redo operations
 * - Search functionality
 * - Document synchronization
 * - Download capabilities
 */
export class AASComponent implements OnInit, OnDestroy {
    private readonly state = inject(AASState);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly modal = inject(NgbModal);
    private readonly notify = inject(NotifyService);
    private readonly dashboard = inject(DashboardService);
    private readonly api = inject(EndpointsApi);
    private readonly commandHandler = inject(CommandHandler);
    private readonly toolbar = inject(ToolbarService);
    private readonly start = inject(StartService);
    private readonly auth = inject(AuthService);
    private readonly dom = inject(DOCUMENT);

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

    public readonly canUndo = this.commandHandler.canUndo;

    public readonly canRedo = this.commandHandler.canRedo;

    public readonly canPlay = computed(() => {
        const state = this.state.live();
        return (this.state.document()?.onlineReady ?? false) && state === 'offline';
    });

    public readonly canStop = computed(() => {
        const state = this.state.live();
        return (this.state.document()?.onlineReady ?? false) && state === 'online';
    });

    public readonly canSynchronize = computed(() => {
        const document = this.state.document();
        return document != null && !document.readonly && document.modified ? document.modified : false;
    });

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
        this.route.params.pipe(first()).subscribe(params => {
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

    public synchronize(): Observable<void> {
        return this.auth.ensureAuthorized('editor').pipe(
            map(() => this.state.document()),
            mergeMap(document => {
                if (!document) {
                    return EMPTY;
                }

                return this.api.putDocument(document).pipe(
                    map(messages => {
                        if (messages && messages.length > 0) {
                            this.notify.info(messages.join('\r\n'));
                        }

                        this.state.update({ document: { ...document, modified: false } });
                    }),
                );
            }),
            catchError(error => this.notify.error(error)),
        );
    }

    /**
     * Executes an undo operation using the command handler.
     * Reverts the last executed command in the command history.
     */
    public undo(): void {
        this.commandHandler.undo();
    }

    /**
     * Executes a redo operation on the command handler.
     * This method restores the state that was undone by the last undo operation.
     */
    public redo(): void {
        this.commandHandler.redo();
    }

    public newElement(): Observable<void> {
        return this.auth.ensureAuthorized('editor').pipe(
            map(() => this.state.document()),
            mergeMap(document => {
                const selectedElements = this.state.selectedElements();
                if (!document || selectedElements.length !== 1) {
                    return EMPTY;
                }

                return of(this.modal.open(NewElementFormComponent, { backdrop: 'static' })).pipe(
                    mergeMap(modalRef => {
                        modalRef.componentInstance.initialize(document.content, selectedElements[0]);
                        return from<Promise<aas.Referable | undefined>>(modalRef.result);
                    }),
                    map(result => {
                        if (result) {
                            this.commandHandler.execute(
                                new NewElementCommand(this.state, document, selectedElements[0], result),
                            );
                        }
                    }),
                );
            }),
            catchError(error => this.notify.error(error)),
        );
    }

    public editElement(): Observable<void> {
        return this.auth.ensureAuthorized('editor').pipe(
            map(() => this.state.document()),
            mergeMap(document => {
                const selectedElements = this.state.selectedElements();
                if (!document || selectedElements.length !== 1) {
                    return EMPTY;
                }

                return of(this.modal.open(EditElementFormComponent, { backdrop: 'static' })).pipe(
                    mergeMap(modalRef => {
                        modalRef.componentInstance.initialize(selectedElements[0]);
                        return from<Promise<aas.SubmodelElement | undefined>>(modalRef.result);
                    }),
                    map(result => {
                        if (result) {
                            this.commandHandler.execute(
                                new UpdateElementCommand(this.state, document, selectedElements[0], result),
                            );
                        }
                    }),
                );
            }),
            catchError(error => this.notify.error(error)),
        );
    }

    public deleteElement(): Observable<void> {
        return this.auth.ensureAuthorized('editor').pipe(
            map(() => this.state.document()),
            map(document => {
                const selectedElements = this.state.selectedElements();
                if (document && selectedElements.length > 0) {
                    this.commandHandler.execute(new DeleteCommand(this.state, document, selectedElements));
                }
            }),
            catchError(error => this.notify.error(error)),
        );
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

    private downloadSubmodel(submodel: aas.Submodel) {
        const sm = jsonization.submodelFromJsonable(toJsonValue(submodel)).mustValue();
        this.downloadJson(submodel.idShort, jsonization.toJsonable(sm));
    }

    private downloadEnvironment(baseName: string, content: aas.Environment) {
        const env = jsonization.environmentFromJsonable(toJsonValue(content)).mustValue();
        this.downloadJson(baseName, jsonization.toJsonable(env));
    }

    private downloadJson(baseName: string, value: JsonValue): void {
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
        this.api.getDocument(id, endpoint).subscribe({
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
}
