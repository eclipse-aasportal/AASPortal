/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { AfterViewInit, Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY, map, mergeMap, Observable, Subscription, from, of, first, catchError } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { aas, isProperty, isNumberType, isBlob, AASDocument } from 'common';
import { AuthService, ClipboardService, DownloadService, NotifyService, OnlineState } from 'aas-lib';

import { CommandHandlerService } from '../aas/command-handler.service';
import { EditElementFormComponent } from './edit-element-form/edit-element-form.component';
import { UpdateElementCommand } from './commands/update-element-command';
import { DeleteCommand } from './commands/delete-command';
import { NewElementCommand } from './commands/new-element-command';
import { AASApiService } from './aas-api.service';
import { NewElementFormComponent } from './new-element-form/new-element-form.component';
import { DashboardService } from '../dashboard/dashboard.service';
import * as AASActions from './aas.actions';
import * as AASSelectors from './aas.selectors';
import { State } from './aas.state';
import { DashboardChartType } from '../dashboard/dashboard.state';
import { DashboardQuery } from '../types/dashboard-query-params';
import { ToolbarService } from '../toolbar.service';

@Component({
    selector: 'fhg-aas',
    templateUrl: './aas.component.html',
    styleUrls: ['./aas.component.scss'],
})
export class AASComponent implements OnInit, OnDestroy, AfterViewInit {
    private readonly store: Store<State>;
    private readonly subscription = new Subscription();
    private _dashboardPage = '';

    public constructor(
        store: Store,
        private readonly router: Router,
        private readonly route: ActivatedRoute,
        private readonly modal: NgbModal,
        private readonly notify: NotifyService,
        private readonly dashboard: DashboardService,
        private readonly api: AASApiService,
        private readonly download: DownloadService,
        private readonly commandHandler: CommandHandlerService,
        private readonly toolbar: ToolbarService,
        private readonly auth: AuthService,
        private readonly clipboard: ClipboardService,
    ) {
        this.store = store as Store<State>;
        this.document = this.store.select(AASSelectors.selectDocument);
        this.address = this.store.select(AASSelectors.selectAddress);
        this.idShort = this.store.select(AASSelectors.selectIdShort);
        this.id = this.store.select(AASSelectors.selectId);
        this.assetId = this.store.select(AASSelectors.selectAssetId);
        this.version = this.store.select(AASSelectors.selectVersion);
        this.thumbnail = this.store.select(AASSelectors.selectThumbnail);
        this.state = this.store.select(AASSelectors.selectState);
        this.search = this.store.select(AASSelectors.selectSearch);
        this.canPlay = this.store.select(AASSelectors.selectCanPlay);
        this.canStop = this.store.select(AASSelectors.selectCanStop);
        this.readOnly = this.store.select(AASSelectors.selectReadOnly);
        this.canSynchronize = this.store.select(AASSelectors.selectCanSynchronize);

        this.dashboardPages = this.dashboard.pages.pipe(map(pages => pages.map(page => page.name)));
    }

    @ViewChild('aasToolbar', { read: TemplateRef })
    public aasToolbar: TemplateRef<unknown> | null = null;

    public readonly document: Observable<AASDocument | null>;

    public readonly state: Observable<OnlineState>;

    public readonly search: Observable<string>;

    public readonly address: Observable<string>;

    public readonly idShort: Observable<string>;

    public readonly id: Observable<string>;

    public readonly assetId: Observable<string>;

    public readonly thumbnail: Observable<string>;

    public readonly version: Observable<string>;

    public readonly dashboardPages: Observable<string[]>;

    public get dashboardPage(): string {
        return this._dashboardPage;
    }

    public set dashboardPage(value: string) {
        this.dashboard.setPageName(value);
    }

    public selectedElements: aas.Referable[] = [];

    public readonly readOnly: Observable<boolean>;

    public get canUndo(): boolean {
        return this.commandHandler.canUndo;
    }

    public get canRedo(): boolean {
        return this.commandHandler.canRedo;
    }

    public readonly canPlay: Observable<boolean>;

    public readonly canStop: Observable<boolean>;

    public readonly canSynchronize: Observable<boolean>;

    public get canNewElement(): boolean {
        return this.selectedElements.length === 1;
    }

    public get canEditElement(): boolean {
        return this.selectedElements.length === 1;
    }

    public get canDeleteElement(): boolean {
        return (
            this.selectedElements.length > 0 &&
            this.selectedElements.every(item => item.modelType !== 'AssetAdministrationShell')
        );
    }

    public get canAddToDashboard(): boolean {
        const selectedElements = this.selectedElements;
        return (
            this.dashboardPage != null &&
            selectedElements.length > 0 &&
            selectedElements.every(element => this.isNumberProperty(element) || this.isTimeSeries(element))
        );
    }

    public ngOnInit(): void {
        this.subscription.add(
            this.route.queryParams.subscribe(params => {
                if (params?.search) {
                    this.store.dispatch(AASActions.setSearch({ search: params.search }));
                }

                if (params) {
                    const document: AASDocument = this.clipboard.get('AASDocument');
                    if (!document) {
                        this.store.dispatch(AASActions.getDocument({ id: params.id, name: params.endpoint }));
                    } else if (!document.content) {
                        this.store.dispatch(AASActions.getDocumentContent({ document: document }));
                    } else {
                        this.store.dispatch(AASActions.setDocument({ document }));
                    }
                }
            }),
        );

        this.subscription.add(
            this.dashboard.name.subscribe(name => {
                this._dashboardPage = name;
            }),
        );
    }

    public ngAfterViewInit(): void {
        if (this.aasToolbar) {
            this.toolbar.set(this.aasToolbar);
        }
    }

    public ngOnDestroy(): void {
        this.toolbar.clear();
        this.subscription.unsubscribe();
    }

    public play(): void {
        this.store.dispatch(AASActions.setState({ value: 'online' }));
    }

    public stop(): void {
        this.store.dispatch(AASActions.setState({ value: 'offline' }));
    }

    public addToDashboard(chartType: string): Observable<boolean> {
        return this.store.select(AASSelectors.selectDocument).pipe(
            first(),
            mergeMap(document => {
                if (!document) {
                    return EMPTY;
                }

                this.dashboard.add(
                    this.dashboardPage,
                    document,
                    this.selectedElements,
                    chartType as DashboardChartType,
                );

                this.clipboard.set('DashboardQuery', { page: this.dashboardPage } as DashboardQuery);
                return from(
                    this.router.navigateByUrl('/dashboard?format=DashboardQuery', { skipLocationChange: true }),
                );
            }),
            catchError(error => {
                this.notify.error(error);
                return of(false);
            }),
        );
    }

    public synchronize(): Observable<void> {
        return this.auth.ensureAuthorized('editor').pipe(
            mergeMap(() => this.store.select(AASSelectors.selectDocument).pipe(first())),
            mergeMap(document => {
                if (!document) {
                    return EMPTY;
                }

                return this.api.putDocument(document).pipe(
                    map(messages => {
                        if (messages && messages.length > 0) {
                            this.notify.info(messages.join('\r\n'));
                        }

                        this.store.dispatch(AASActions.resetModified({ document }));
                    }),
                );
            }),
            catchError(error => this.notify.error(error)),
        );
    }

    public undo(): void {
        this.commandHandler.undo();
    }

    public redo(): void {
        this.commandHandler.redo();
    }

    public newElement(): Observable<void> {
        return this.auth.ensureAuthorized('editor').pipe(
            mergeMap(() => this.store.select(AASSelectors.selectDocument).pipe(first())),
            mergeMap(document => {
                if (!document || this.selectedElements.length !== 1) {
                    return EMPTY;
                }

                return of(this.modal.open(NewElementFormComponent, { backdrop: 'static' })).pipe(
                    mergeMap(modalRef => {
                        modalRef.componentInstance.initialize(document.content, this.selectedElements[0]);
                        return from<Promise<aas.Referable | undefined>>(modalRef.result);
                    }),
                    map(result => {
                        if (result) {
                            this.commandHandler.execute(
                                new NewElementCommand(this.store, document, this.selectedElements[0], result),
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
            mergeMap(() => this.store.select(AASSelectors.selectDocument).pipe(first())),
            mergeMap(document => {
                if (!document || this.selectedElements.length !== 1) {
                    return EMPTY;
                }

                return of(this.modal.open(EditElementFormComponent, { backdrop: 'static' })).pipe(
                    mergeMap(modalRef => {
                        modalRef.componentInstance.initialize(this.selectedElements[0]);
                        return from<Promise<aas.SubmodelElement | undefined>>(modalRef.result);
                    }),
                    map(result => {
                        if (result) {
                            this.commandHandler.execute(
                                new UpdateElementCommand(this.store, document, this.selectedElements[0], result),
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
            mergeMap(() => this.store.select(AASSelectors.selectDocument).pipe(first())),
            map(document => {
                if (document && this.selectedElements.length > 0) {
                    this.commandHandler.execute(new DeleteCommand(this.store, document, this.selectedElements));
                }
            }),
            catchError(error => this.notify.error(error)),
        );
    }

    public downloadDocument(): void {
        this.store
            .select(AASSelectors.selectDocument)
            .pipe(
                mergeMap(document => {
                    if (!document) {
                        return EMPTY;
                    }

                    return this.download.downloadDocument(document.endpoint, document.id, document.idShort + '.aasx');
                }),
            )
            .subscribe({ error: error => this.notify.error(error) });
    }

    public applySearch(text: string): void {
        this.store.dispatch(AASActions.setSearch({ search: text }));
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
}
