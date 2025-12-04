import { CommonModule } from '@angular/common';
/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ActivatedRoute, Route, Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { EMPTY, map, mergeMap, Observable, from, of, catchError, first, combineLatest } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
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
    signal,
    viewChild,
} from '@angular/core';

import { aas, isProperty, isNumberType, isBlob, jsonization, isSubmodel, toJsonValue } from 'aas-core';
import {
    AASTreeComponent,
    AuthService,
    decodeBase64Url,
    NotifyService,
    StartService,
    ToolbarService,
    encodeBase64Url,
    EndpointsApi,
    findRouteForShell,
    findRouteForSubmodel,
    VIEW_ROUTES,
    CommandHandler,
} from 'aas-lib';

import { EditElementFormComponent } from './edit-element-form/edit-element-form.component';
import { UpdateElementCommand } from './commands/update-element-command';
import { DeleteCommand } from './commands/delete-command';
import { NewElementCommand } from './commands/new-element-command';
import { NewElementFormComponent } from './new-element-form/new-element-form.component';
import { JsonValue } from 'projects/aas-core/dist/types/aas-core/jsonization';
import { EditState } from './edit.state';

@Component({
    selector: 'fhg-edit',
    templateUrl: './edit.component.html',
    styleUrls: ['./edit.component.scss'],
    imports: [TranslateModule, FormsModule, CommonModule, RouterModule, NgbNavModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditComponent implements OnInit, OnDestroy {
    private readonly state = inject(EditState);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly modal = inject(NgbModal);
    private readonly notify = inject(NotifyService);
    private readonly api = inject(EndpointsApi);
    private readonly commandHandler = inject(CommandHandler);
    private readonly toolbar = inject(ToolbarService);
    private readonly start = inject(StartService);
    private readonly auth = inject(AuthService);
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

    public readonly document = this.state.document;

    public readonly readOnly = signal(true);

    public readonly canUndo = this.commandHandler.canUndo;

    public readonly canRedo = this.commandHandler.canRedo;

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
    public readonly canNewElement = computed(() => this.state.selectedElements().length === 1);

    /**
     * Computed signal that determines if editing is allowed for the selected elements.
     * Returns true when exactly one element is selected, false otherwise.
     *
     * @returns {Signal<boolean>} A signal containing true if exactly one element is selected, false otherwise
     */
    public readonly canEditElement = computed(() => this.state.selectedElements().length === 1);

    /**
     * Computed signal that determines if the selected elements can be deleted.
     * Returns true if there are selected elements and none of them are Asset Administration Shells.
     * @returns {boolean} True if elements can be deleted, false otherwise.
     */
    public readonly canDeleteElement = computed(() => {
        const selectedElements = this.state.selectedElements();
        return (
            selectedElements.length > 0 && selectedElements.every(item => item.modelType !== 'AssetAdministrationShell')
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

            const selectedElements = this.state.selectedElements();
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
    }

    public findPrevious(): void {
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

    getSubmodelSemanticId(submodel: aas.Submodel) {
        if (!submodel) return '';
        if (!submodel.semanticId) return '';
        if (submodel.semanticId.keys.length <= 0) return '';
        return submodel.semanticId.keys[0].value;
    }

    getSubmodelIcon(submodel: aas.Submodel) {
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

    openShellView() {
        let route: Route | undefined;
        const document = this.document();
        if (document === undefined) return '';
        const tuple = findRouteForShell(this.viewRoutes, document!);
        route = tuple.route;

        if (route === undefined) return undefined;

        const endpoint = this.document()?.endpoint;
        if (endpoint === undefined) return undefined;

        const id = this.document()?.id;
        if (id === undefined) return undefined;

        return [`/views/${route.path}`, { endpoint: encodeBase64Url(endpoint), id: encodeBase64Url(id) }];
    }

    openBrowserView() {
        const endpoint = this.document()?.endpoint;
        if (endpoint === undefined) return undefined;

        const id = this.document()?.id;
        if (id === undefined) return undefined;

        return [`/views/Browser`, { endpoint: encodeBase64Url(endpoint), id: encodeBase64Url(id) }];
    }

    openSubmodelView(submodel: aas.Submodel) {
        let route: Route | undefined;
        route = findRouteForSubmodel(this.viewRoutes, submodel);

        if (route === undefined) return undefined;

        const endpoint = this.document()?.endpoint;
        if (endpoint === undefined) return undefined;

        const id = this.document()?.id;
        if (id === undefined) return undefined;

        return [`/views/${route.path}`, { endpoint: encodeBase64Url(endpoint), id: encodeBase64Url(id) }];
    }
}
