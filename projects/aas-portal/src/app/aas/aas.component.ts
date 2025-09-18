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
    OnDestroy,
    OnInit,
    TemplateRef,
    computed,
    effect,
    inject,
    viewChild,
} from '@angular/core';

import { aas, isProperty, isNumberType, isBlob } from 'aas-core';
import {
    AASTreeComponent,
    AuthService,
    decodeBase64Url,
    DownloadService,
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

@Component({
    selector: 'fhg-aas',
    templateUrl: './aas.component.html',
    styleUrls: ['./aas.component.scss'],
    imports: [TranslateModule, FormsModule, AASTreeComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AASComponent implements OnInit, OnDestroy {
    private readonly state = inject(AASState);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly modal = inject(NgbModal);
    private readonly notify = inject(NotifyService);
    private readonly dashboard = inject(DashboardService);
    private readonly api = inject(EndpointsApi);
    private readonly download = inject(DownloadService);
    private readonly commandHandler = inject(CommandHandler);
    private readonly toolbar = inject(ToolbarService);
    private readonly start = inject(StartService);
    private readonly auth = inject(AuthService);

    public constructor() {
        effect(() => {
            const aasToolbar = this.aasToolbar();
            if (aasToolbar !== undefined) {
                this.toolbar.set(aasToolbar);
            }
        });
    }

    public readonly aasToolbar = viewChild<TemplateRef<unknown>>('aasToolbar');

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

    public readonly canNewElement = computed(() => this.selectedElements().length === 1);

    public readonly canEditElement = computed(() => this.selectedElements().length === 1);

    public readonly canDeleteElement = computed(() => {
        const selectedElements = this.selectedElements();
        return (
            selectedElements.length > 0 && selectedElements.every(item => item.modelType !== 'AssetAdministrationShell')
        );
    });

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

    public getThumbnail(): string {
        const thumbnail = this.document()?.thumbnail;
        if (thumbnail) {
            return thumbnail;
        }

        return '/assets/resources/aas-idta.png';
    }

    public clearThumbnail(): void {
        this.state.update({ document: { ...this.document()!, thumbnail: undefined } });
    }

    public play(): void {
        this.state.update({ live: 'online' });
    }

    public stop(): void {
        this.state.update({ live: 'offline' });
    }

    public addToDashboard(chartType: string): void {
        const document = this.state.document();
        const page = this.dashboard.activePage();
        if (!document || !page) {
            return;
        }

        this.dashboard.addChart(page.name, document, this.state.selectedElements(), chartType as DashboardChartType);
        this.router.navigate(['/dashboard'], { queryParams: { page } });
    }

    public setDashboardPage(page: DashboardPage): void {
        this.dashboard.setActivePage(page.name);
    }

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

    public undo(): void {
        this.commandHandler.undo();
    }

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

    public downloadDocument(): Observable<void> {
        return of(this.state.document()).pipe(
            mergeMap(document => {
                if (!document) {
                    return EMPTY;
                }

                return this.download.downloadPackage(document.endpoint, document.id, document.idShort + '.aasx');
            }),
            catchError(error => this.notify.error(error)),
        );
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
