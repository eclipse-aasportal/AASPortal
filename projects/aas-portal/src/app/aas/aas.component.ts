/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import {
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    OnDestroy,
    OnInit,
    TemplateRef,
    ViewChild,
    computed,
    signal,
} from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY, map, mergeMap, Observable, from, of, catchError, first } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import head from 'lodash-es/head';
import { aas, isProperty, isNumberType, isBlob, AASDocument } from 'aas-core';
import {
    AASTreeComponent,
    AuthService,
    ClipboardService,
    DownloadService,
    NotifyService,
    SecuredImageComponent,
} from 'aas-lib';

import { CommandHandlerService } from '../aas/command-handler.service';
import { EditElementFormComponent } from './edit-element-form/edit-element-form.component';
import { UpdateElementCommand } from './commands/update-element-command';
import { DeleteCommand } from './commands/delete-command';
import { NewElementCommand } from './commands/new-element-command';
import { AASApiService } from './aas-api.service';
import { NewElementFormComponent } from './new-element-form/new-element-form.component';
import { DashboardChartType, DashboardPage, DashboardService } from '../dashboard/dashboard.service';
import { DashboardQuery } from '../types/dashboard-query-params';
import { ToolbarService } from '../toolbar.service';
import { AASStore } from './aas.store';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'fhg-aas',
    templateUrl: './aas.component.html',
    styleUrls: ['./aas.component.scss'],
    standalone: true,
    imports: [SecuredImageComponent, AASTreeComponent, TranslateModule, FormsModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AASComponent implements OnInit, OnDestroy, AfterViewInit {
    public constructor(
        private readonly store: AASStore,
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
    ) {}

    @ViewChild('aasToolbar', { read: TemplateRef })
    public aasToolbar: TemplateRef<unknown> | null = null;

    public readonly document = this.store.document;

    public readonly address = computed(() => this.store.document()?.address ?? '-');

    public readonly idShort = computed(() => this.store.document()?.idShort ?? '-');

    public readonly id = computed(() => this.store.document()?.id ?? '-');

    public readonly assetId = computed(() => this.store.document()?.assetId ?? '-');

    public readonly thumbnail = computed(() => this.store.document()?.thumbnail ?? '-');

    public readonly readOnly = computed(() => this.store.document()?.readonly ?? false);

    public readonly version = computed(() =>
        this.versionToString(head(this.store.document()?.content?.assetAdministrationShells)?.administration),
    );

    public readonly state = this.store.state;

    public readonly searchExpression = this.store.searchExpression;

    public readonly dashboardPages = this.dashboard.pages;

    public readonly dashboardPage = this.dashboard.activePage;

    public readonly selectedElements = signal<aas.Referable[]>([]);

    public readonly canUndo = this.commandHandler.canUndo;

    public readonly canRedo = this.commandHandler.canRedo;

    public readonly canPlay = computed(() => {
        const state = this.store.state();
        return (this.store.document()?.onlineReady ?? false) && state === 'offline';
    });

    public readonly canStop = computed(() => {
        const state = this.store.state();
        return (this.store.document()?.onlineReady ?? false) && state === 'online';
    });

    public readonly canSynchronize = computed(() => {
        const document = this.store.document();
        return document != null && !document.readonly && document.modified ? document.modified : false;
    });

    public readonly canNewElement = computed(() => this.selectedElements().length === 1);

    public readonly canEditElement = computed(() => this.selectedElements().length === 1);

    public readonly canDeleteElement = computed(
        () =>
            this.selectedElements().length > 0 &&
            this.selectedElements().every(item => item.modelType !== 'AssetAdministrationShell'),
    );

    public readonly canAddToDashboard = computed(() => {
        const selectedElements = this.selectedElements();
        return (
            this.dashboardPage() != null &&
            selectedElements.length > 0 &&
            selectedElements.every(element => this.isNumberProperty(element) || this.isTimeSeries(element))
        );
    });

    public ngOnInit(): void {
        this.route.queryParams.pipe(first()).subscribe(params => {
            if (params?.search) {
                this.store.searchExpression.set(params.search);
            }

            if (params) {
                const document: AASDocument = this.clipboard.get('AASDocument');
                if (!document) {
                    this.store.getDocument(params.id, params.endpoint);
                } else if (!document.content) {
                    this.store.getDocumentContent(document);
                } else {
                    this.store.setDocument(document);
                }
            }
        });
    }

    public ngAfterViewInit(): void {
        if (this.aasToolbar) {
            this.toolbar.set(this.aasToolbar);
        }
    }

    public ngOnDestroy(): void {
        this.toolbar.clear();
    }

    public play(): void {
        this.store.state.set('online');
    }

    public stop(): void {
        this.store.state.set('offline');
    }

    public setDashboardPage(page: DashboardPage): void {
        this.dashboard.setPage(page);
    }

    public addToDashboard(chartType: string): void {
        const document = this.store.document();
        const page = this.dashboard.activePage();
        if (!document || !page) {
            return;
        }

        this.dashboard.add(page, document, this.selectedElements(), chartType as DashboardChartType);
        this.clipboard.set('DashboardQuery', { page: this.dashboardPage().name } as DashboardQuery);
        this.router.navigateByUrl('/dashboard?format=DashboardQuery', { skipLocationChange: true });
    }

    public synchronize(): Observable<void> {
        return this.auth.ensureAuthorized('editor').pipe(
            map(() => this.store.document()),
            mergeMap(document => {
                if (!document) {
                    return EMPTY;
                }

                return this.api.putDocument(document).pipe(
                    map(messages => {
                        if (messages && messages.length > 0) {
                            this.notify.info(messages.join('\r\n'));
                        }

                        this.store.resetModified(document);
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
            map(() => this.store.document()),
            mergeMap(document => {
                if (!document || this.selectedElements().length !== 1) {
                    return EMPTY;
                }

                return of(this.modal.open(NewElementFormComponent, { backdrop: 'static' })).pipe(
                    mergeMap(modalRef => {
                        modalRef.componentInstance.initialize(document.content, this.selectedElements()[0]);
                        return from<Promise<aas.Referable | undefined>>(modalRef.result);
                    }),
                    map(result => {
                        if (result) {
                            this.commandHandler.execute(
                                new NewElementCommand(this.store, document, this.selectedElements()[0], result),
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
            map(() => this.store.document()),
            mergeMap(document => {
                if (!document || this.selectedElements().length !== 1) {
                    return EMPTY;
                }

                return of(this.modal.open(EditElementFormComponent, { backdrop: 'static' })).pipe(
                    mergeMap(modalRef => {
                        modalRef.componentInstance.initialize(this.selectedElements()[0]);
                        return from<Promise<aas.SubmodelElement | undefined>>(modalRef.result);
                    }),
                    map(result => {
                        if (result) {
                            this.commandHandler.execute(
                                new UpdateElementCommand(this.store, document, this.selectedElements()[0], result),
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
            map(() => this.store.document()),
            map(document => {
                if (document && this.selectedElements().length > 0) {
                    this.commandHandler.execute(new DeleteCommand(this.store, document, this.selectedElements()));
                }
            }),
            catchError(error => this.notify.error(error)),
        );
    }

    public downloadDocument(): Observable<void> {
        return of(this.store.document()).pipe(
            mergeMap(document => {
                if (!document) {
                    return EMPTY;
                }

                return this.download.downloadDocument(document.endpoint, document.id, document.idShort + '.aasx');
            }),
            catchError(error => this.notify.error(error)),
        );
    }

    public searchExpressionChange(value: string): void {
        this.store.searchExpression.set(value);
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
