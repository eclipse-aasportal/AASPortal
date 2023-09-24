/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { head } from 'lodash-es';
import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, EMPTY, map, mergeMap, Observable, Subscription, first } from 'rxjs';
import * as lib from 'aas-lib';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { ProjectService } from '../project/project.service';

import { CommandHandlerService } from 'src/app/aas/command-handler.service';
import { EditElementFormComponent } from './edit-element-form/edit-element-form.component';
import { UpdateElementCommand } from './commands/update-element-command';
import { DeleteCommand } from './commands/delete-command';
import { NewElementCommand } from './commands/new-element-command';
import { AASApiService } from './aas-api.service';
import { NewElementFormComponent, NewElementResult } from './new-element-form/new-element-form.component';
import { DashboardService } from '../dashboard/dashboard.service';
import * as AASActions from './aas.actions';
import * as AASSelectors from './aas.selectors';
import { State } from './aas.state';
import { DashboardChartType } from '../dashboard/dashboard.state';
import { DashboardQuery } from 'src/app/types/dashboard-query-params';
import { getEndpointType } from 'src/app/configuration';
import {
    AASDocument,
    equalDocument,
    TemplateDescriptor,
    aas, isProperty,
    isNumberType,
    isBlob,
    AASEndpointType
} from 'common';

@Component({
    selector: 'fhg-aas',
    templateUrl: './aas.component.html',
    styleUrls: ['./aas.component.scss']
})
export class AASComponent implements OnInit, OnDestroy, AfterViewInit {
    private readonly store: Store<State>;
    private readonly $state = new BehaviorSubject<lib.OnlineState>('offline');
    private readonly subscription = new Subscription();
    private templates: TemplateDescriptor[] = [];
    private dashboardName = '';
    private selectedElements: aas.Referable[] = [];

    constructor(
        store: Store,
        private readonly router: Router,
        private readonly route: ActivatedRoute,
        private readonly modal: NgbModal,
        private readonly project: ProjectService,
        private readonly notify: lib.NotifyService,
        private readonly dashboard: DashboardService,
        private readonly api: AASApiService,
        private readonly download: lib.DownloadService,
        private readonly commandHandler: CommandHandlerService,
        private readonly toolbar: lib.ToolbarService,
        private readonly auth: lib.AuthService,
        private readonly clipboard: lib.ClipboardService
    ) {
        this.store = store as Store<State>;
        this.state = this.$state.asObservable();
        this.search = this.store.select(AASSelectors.selectSearch);
    }

    @ViewChild('aasTree')
    public aasTree: lib.AASTree | null = null;

    public document: AASDocument | null = null;

    public readonly state: Observable<lib.OnlineState>;

    public readonly search: Observable<string>;

    public get endpoint(): string {
        return this.document?.endpoint.address ?? '';
    }

    public get idShort(): string {
        return this.document?.idShort ?? '';
    }

    public get id(): string {
        return this.document?.id ?? '-'
    }

    public get assetId(): string {
        return head(this.document?.content?.assetAdministrationShells)?.assetInformation.globalAssetId ?? '-';
    }

    public get thumbnail(): string {
        if (this.document) {
            const url = lib.encodeBase64Url(this.document?.container);
            const id = lib.encodeBase64Url(this.document?.id);
            return `/api/v1/containers/${url}/documents/${id}/thumbnail`;
        }

        return 'assets/resources/aas.svg'
    }

    public get version(): string {
        return this.versionToString(head(this.document?.content?.assetAdministrationShells)?.administration);
    }

    public get onlineReady(): boolean {
        return this.document?.onlineReady ?? false;
    }

    public get readonly(): boolean {
        return this.document?.readonly ?? true;
    }

    public ngOnInit(): void {
        const params = this.route.snapshot.queryParams as lib.AASQueryParams;
        let query: lib.AASQuery | undefined;
        if (params.format) {
            query = this.clipboard.get(params.format);
        } else if (params.id) {
            query = {
                id: params.id
            };
        }

        if (query?.search) {
            this.store.dispatch(AASActions.setSearch({ search: query.search }));
        }

        this.toolbar.setToolbar(this.createToolbar());

        if (query) {
            let document: Observable<AASDocument> | undefined;
            if (query.url) {
                document = this.project.getDocument(query.id, query.url);
            } else {
                document = this.project.getDocument(query.id);
            }

            document?.pipe(first()).subscribe(value => this.store.dispatch(AASActions.setDocument({ document: value })));
        }

        this.subscription.add(this.store.select(AASSelectors.selectDocument).pipe()
            .subscribe((value) => {
                if (!equalDocument(this.document, value)) {
                    this.commandHandler.clear();
                }

                this.document = value;
            }));

        this.subscription.add(this.store.select(AASSelectors.selectTemplateStorage).pipe(
            mergeMap(templateStorage => {
                if (templateStorage.timestamp === 0) {
                    return this.api.getTemplates().pipe(
                        map(templates => this.store.dispatch(AASActions.setTemplateStorage({ templates })))
                    );
                } else {
                    return EMPTY;
                }
            })
        ).subscribe({
            error: error => this.notify.error(error)
        }));

        this.subscription.add(this.store.select(AASSelectors.selectTemplates).pipe()
            .subscribe(templates => {
                this.templates = templates;
            }));

        this.subscription.add(this.dashboard.name.subscribe(name => {
            this.dashboardName = name;
        }));
    }

    public ngAfterViewInit(): void {
        if (this.aasTree) {
            this.subscription.add(this.aasTree.selectedElements.subscribe(values => this.selectedElements = values));
        }
    }

    public ngOnDestroy(): void {
        this.toolbar.setToolbar();
        this.subscription.unsubscribe();
    }

    public play(): void {
        if (this.onlineReady && this.$state.value === 'offline') {
            this.$state.next('online');
        }
    }

    public stop(): void {
        this.$state.next('offline');
    }

    public canAddToDashboard(): boolean {
        const selectedElements = this.selectedElements;
        return this.dashboardName != null && this.document != null &&
            selectedElements.length > 0 &&
            selectedElements.every(element => this.isNumberProperty(element) || this.isTimeSeries(element));
    }

    public async addToDashboard(chartType: DashboardChartType): Promise<boolean> {
        if (this.document) {
            try {
                this.dashboard.add(this.dashboardName, this.document, this.selectedElements, chartType);
                this.clipboard.set('DashboardQuery', { page: this.dashboardName } as DashboardQuery);
                return await this.router.navigateByUrl('/dashboard?format=DashboardQuery');
            } catch (error) {
                this.notify.error(error);
            }
        }

        return false;
    }

    public canSynchronize(): boolean {
        return this.document != null && !this.document.readonly && this.document.modified ? this.document.modified : false;
    }

    public synchronize(): void {
        try {
            this.auth.ensureAuthorized('editor').pipe(map(() => {
                
            })).subscribe();

            if (this.canSynchronize() && this.document) {
                const messages = await this.api.putDocumentAsync(this.document);
                if (messages && messages.length > 0) {
                    this.notify.info(messages.join('\r\n'));
                }

                this.store.dispatch(AASActions.resetModified({ document: this.document }));
            }
        } catch (error) {
            this.notify.error(error);
        }
    }

    public canUndo(): boolean {
        return !this.readonly && this.commandHandler.canUndo;
    }

    public undo(): void {
        if (this.canUndo()) {
            this.commandHandler.undo();
        }
    }

    public canRedo(): boolean {
        return !this.readonly && this.commandHandler.canRedo;
    }

    public redo(): void {
        if (this.canRedo()) {
            this.commandHandler.redo();
        }
    }

    public canNewElement(): boolean {
        return this.selectedElements.length === 1;
    }

    public async newElement(): Promise<void> {
        await this.auth.ensureAuthorizedAsync('editor');
        if (this.document?.content && this.selectedElements.length === 1) {
            const modalRef = this.modal.open(NewElementFormComponent, { backdrop: 'static' });
            modalRef.componentInstance.initialize(this.document.content, this.selectedElements[0], this.templates);
            const result: NewElementResult = await modalRef.result;
            if (result.element) {
                try {
                    this.commandHandler.execute(new NewElementCommand(
                        this.store,
                        this.document,
                        this.selectedElements[0],
                        result.element));
                } catch (error) {
                    this.notify.error(error);
                }
            }
        }
    }

    public canEditElement(): boolean {
        return this.selectedElements.length === 1;
    }

    public async editElement(): Promise<void> {
        await this.auth.ensureAuthorizedAsync('editor');
        if (this.document && this.selectedElements.length === 1) {
            const modalRef = this.modal.open(EditElementFormComponent, { backdrop: 'static' });
            modalRef.componentInstance.initialize(this.selectedElements[0]);
            const result: aas.SubmodelElement = await modalRef.result;
            if (result) {
                try {
                    this.commandHandler.execute(new UpdateElementCommand(
                        this.store,
                        this.document,
                        this.selectedElements[0],
                        result));
                } catch (error) {
                    this.notify.error(error);
                }
            }
        }
    }

    public canDeleteElement(): boolean {
        return this.selectedElements.length > 0 &&
            this.selectedElements.every(item => item.modelType !== 'AssetAdministrationShell');
    }

    public async deleteElement(): Promise<void> {
        await this.auth.ensureAuthorizedAsync('editor');
        if (this.document && this.selectedElements.length > 0) {
            try {
                this.commandHandler.execute(new DeleteCommand(this.store, this.document, this.selectedElements));
            } catch (error) {
                this.notify.error(error);
            }
        }
    }

    public canDownloadDocument(): boolean {
        let type: AASEndpointType | undefined;
        if (this.document) {
            type = getEndpointType(this.document.container);
        }

        return type === 'AasxDirectory' || type === 'AasxServer';
    }

    public async downloadDocument(): Promise<void> {
        try {
            await this.download.downloadDocumentAsync(
                this.document!.idShort + '.aasx',
                this.document!.id,
                this.document!.container);
        } catch (error) {
            this.notify.error(error);
        }
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

    private isNumberProperty(element: aas.Referable): boolean {
        if (isProperty(element)) {
            return isNumberType(element.valueType);
        }

        return false;
    }

    // Hack, Hack 
    private isTimeSeries(element: aas.Referable): boolean {
        return isBlob(element) &&
            element.value != null &&
            element.idShort === 'TimeSeriesHistory' &&
            element.contentType === 'application/json';
    }

    private createToolbar(): lib.Toolbar {
        return {
            groups: [
                this.toolbar.createGroup(
                    [
                        this.toolbar.createButton(
                            'bi bi-play-fill',
                            () => this.play(),
                            () => this.$state.getValue() === 'offline'),
                        this.toolbar.createButton(
                            'bi bi-stop-fill',
                            () => this.stop(),
                            () => this.$state.getValue() === 'online')
                    ],
                    this.store.select(AASSelectors.selectOnlineReady)),
                this.toolbar.createGroup(
                    [
                        this.toolbar.createSelect(
                            this.dashboard.pages.pipe(map(pages => pages.map(page => this.toolbar.createOption(
                                page.name,
                                page.name)))),
                            this.dashboard.name,
                            (page) => this.dashboard.setPageName(page)),
                        this.toolbar.createButton(
                            'bi bi-graph-up',
                            () => this.addToDashboard(DashboardChartType.Line),
                            () => this.canAddToDashboard()),
                        this.toolbar.createButton(
                            'bi bi-bar-chart-line-fill',
                            () => this.addToDashboard(DashboardChartType.BarVertical),
                            () => this.canAddToDashboard())

                    ]),
                this.toolbar.createGroup(
                    [
                        this.toolbar.createButton('bi bi-arrow-repeat', () => this.synchronize(), () => this.canSynchronize()),
                    ],
                    this.store.select(AASSelectors.selectEditable)),
                this.toolbar.createGroup(
                    [
                        this.toolbar.createButton('bi bi-download', () => this.downloadDocument(), () => this.canDownloadDocument())
                    ]),
                this.toolbar.createGroup(
                    [
                        this.toolbar.createButton('bi bi-arrow-90deg-left', () => this.undo(), () => this.canUndo()),
                        this.toolbar.createButton('bi bi-arrow-90deg-right', () => this.redo(), () => this.canRedo()),
                    ],
                    this.store.select(AASSelectors.selectEditable)),
                this.toolbar.createGroup(
                    [
                        this.toolbar.createButton('bi bi-plus-lg', () => this.newElement(), () => this.canNewElement()),
                        this.toolbar.createButton('bi bi-pencil', () => this.editElement(), () => this.canEditElement()),
                        this.toolbar.createButton('bi bi-trash', () => this.deleteElement(), () => this.canDeleteElement()),
                    ],
                    this.store.select(AASSelectors.selectEditable)),
                this.toolbar.createGroup(
                    [
                        this.toolbar.createTextInput(
                            'bi bi-search',
                            this.search.pipe(first()),
                            'PLACEHOLDER_SEARCH',
                            (text: string) => this.store.dispatch(AASActions.setSearch({ search: text }))),
                        this.toolbar.createButton('bi bi-chevron-down', () => this.aasTree?.findNext()),
                        this.toolbar.createButton('bi bi-chevron-up', () => this.aasTree?.findPrevious()),
                    ])
            ]
        }
    }
}