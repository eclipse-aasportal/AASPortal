/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Router } from '@angular/router';
import { NgClass } from '@angular/common';
import {
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    OnDestroy,
    TemplateRef,
    ViewChild,
    computed,
    effect,
    model,
} from '@angular/core';

import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { aas, AASDocument, AASEndpoint, QueryParser, stringFormat } from 'aas-core';
import { catchError, EMPTY, first, from, map, mergeMap, Observable, of } from 'rxjs';
import {
    AASTableComponent,
    AuthService,
    ClipboardService,
    CustomerFeedback,
    DownloadService,
    NotifyService,
    SubmodelViewDescriptor,
    ViewMode,
    ViewQuery,
    WindowService,
    ZVEINameplate,
    resolveSemanticId,
    supportedSubmodelTemplates,
} from 'aas-lib';

import { AddEndpointFormComponent } from './add-endpoint-form/add-endpoint-form.component';
import { EndpointSelect, RemoveEndpointFormComponent } from './remove-endpoint-form/remove-endpoint-form.component';
import { UploadFormComponent } from './upload-form/upload-form.component';
import { ToolbarService } from '../toolbar.service';
import { StartApiService } from './start-api.service';
import { FavoritesService } from './favorites.service';
import { FavoritesFormComponent } from './favorites-form/favorites-form.component';
import { StartStore } from './start.store';
import { UpdateEndpointFormComponent } from './update-endpoint-form/update-endpoint-form.component';
import { ExtrasEndpointFormComponent } from './extras-endpoint-form/extras-endpoint-form.component';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'fhg-start',
    templateUrl: './start.component.html',
    styleUrls: ['./start.component.scss'],
    standalone: true,
    imports: [AASTableComponent, NgClass, TranslateModule, NgbModule, FormsModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StartComponent implements OnDestroy, AfterViewInit {
    public constructor(
        private readonly store: StartStore,
        private readonly router: Router,
        private readonly modal: NgbModal,
        private readonly translate: TranslateService,
        private readonly window: WindowService,
        private readonly api: StartApiService,
        private readonly notify: NotifyService,
        private readonly toolbar: ToolbarService,
        private readonly auth: AuthService,
        private readonly download: DownloadService,
        private readonly clipboard: ClipboardService,
        private readonly favorites: FavoritesService,
    ) {
        if (this.store.viewMode() === ViewMode.Undefined) {
            this.auth.ready.pipe(first(ready => ready)).subscribe({
                next: () => this.store.getFirstPage(),
                error: error => this.notify.error(error),
            });
        }

        effect(
            () => {
                const value = this.activeFavorites();
                this.store.activeFavorites.set(value);
                const currentFavorites = this.favorites.get(value);
                if (currentFavorites) {
                    this.store.getFavorites(currentFavorites.name, currentFavorites.documents);
                } else {
                    this.store.getFirstPage();
                }
            },
            { allowSignalWrites: true },
        );

        effect(
            () => {
                const value = Number(this.limit());
                this.store.limit.set(value);
                this.store.getFirstPage();
            },
            { allowSignalWrites: true },
        );
    }

    @ViewChild('startToolbar', { read: TemplateRef })
    public startToolbar: TemplateRef<unknown> | null = null;

    public readonly activeFavorites = model(this.store.activeFavorites());

    public readonly limit = model(this.store.limit());

    public readonly favoritesLists = this.store.favoritesLists;

    public readonly filter = this.store.filter;

    public readonly viewMode = this.store.viewMode;

    public readonly filterText = this.store.filterText;

    public readonly isFirstPage = this.store.isFirstPage;

    public readonly isLastPage = this.store.isLastPage;

    public readonly endpoints = this.api.getEndpoints();

    public readonly documents = this.store.documents;

    public readonly selected = this.store.selected;

    public readonly canDownloadDocument = computed(() => (this.selected().length > 0 ? true : false));

    public readonly canDeleteDocument = computed(() => this.selected().length > 0);

    public readonly canViewUserFeedback = computed(() =>
        this.selected().some(document => this.selectSubmodels(document, CustomerFeedback).length === 1),
    );

    public readonly canViewNameplate = computed(() =>
        this.selected().some(document => this.selectSubmodels(document, ZVEINameplate).length === 1),
    );

    public ngAfterViewInit(): void {
        if (this.startToolbar) {
            this.toolbar.set(this.startToolbar);
        }
    }

    public ngOnDestroy(): void {
        this.toolbar.clear();
    }

    public setViewMode(viewMode: string | ViewMode): void {
        const activeFavorites = this.activeFavorites();
        if (viewMode === ViewMode.List) {
            if (!activeFavorites) {
                this.store.getFirstPage();
            } else {
                const favoritesList = this.favorites.get(activeFavorites);
                if (favoritesList) {
                    this.store.getFavorites(favoritesList.name, favoritesList.documents);
                }
            }
        } else {
            this.store.setTreeView(this.selected());
        }
    }

    public addEndpoint(): Observable<void> {
        return this.auth.ensureAuthorized('editor').pipe(
            mergeMap(() => this.api.getEndpoints()),
            map(endpoints => {
                const modalRef = this.modal.open(AddEndpointFormComponent, { backdrop: 'static' });
                modalRef.componentInstance.initialize(endpoints);
                return modalRef;
            }),
            mergeMap(modalRef => from<Promise<AASEndpoint | undefined>>(modalRef.result)),
            mergeMap(result => {
                if (result === undefined) {
                    return EMPTY;
                }

                return this.api.addEndpoint(result);
            }),
            catchError(error => this.notify.error(error)),
        );
    }

    public updateEndpoint(): Observable<void> {
        return this.auth.ensureAuthorized('editor').pipe(
            mergeMap(() => this.api.getEndpoints()),
            map(endpoints => {
                const modalRef = this.modal.open(UpdateEndpointFormComponent, { backdrop: 'static' });
                modalRef.componentInstance.initialize(endpoints);
                return modalRef;
            }),
            mergeMap(modalRef => from<Promise<AASEndpoint | undefined>>(modalRef.result)),
            mergeMap(result => {
                if (result === undefined) {
                    return EMPTY;
                }

                return this.api.updateEndpoint(result);
            }),
            catchError(error => this.notify.error(error)),
        );
    }

    public removeEndpoint(): Observable<void> {
        return this.auth.ensureAuthorized('editor').pipe(
            mergeMap(() => this.api.getEndpoints()),
            mergeMap(endpoints => {
                const modalRef = this.modal.open(RemoveEndpointFormComponent, { backdrop: 'static' });
                modalRef.componentInstance.endpoints.set(
                    endpoints
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map(
                            item =>
                                ({
                                    name: item.name,
                                    url: item.url,
                                    selected: false,
                                }) as EndpointSelect,
                        ),
                );
                return from<Promise<string[] | undefined>>(modalRef.result);
            }),
            mergeMap(endpoints => from(endpoints ?? [])),
            mergeMap(endpoint => this.api.removeEndpoint(endpoint)),
            catchError(error => this.notify.error(error)),
        );
    }

    public extras(): Observable<void> {
        return this.auth.ensureAuthorized('editor').pipe(
            mergeMap(() => {
                const modalRef = this.modal.open(ExtrasEndpointFormComponent, { backdrop: 'static', scrollable: true });
                return from(modalRef.result);
            }),
        );
    }

    public uploadDocument(): Observable<void> {
        return this.auth.ensureAuthorized('editor').pipe(
            mergeMap(() => this.api.getEndpoints()),
            mergeMap(endpoints => {
                const modalRef = this.modal.open(UploadFormComponent, { backdrop: 'static' });
                modalRef.componentInstance.endpoints.set(endpoints.sort((a, b) => a.name.localeCompare(b.name)));
                modalRef.componentInstance.endpoint.set(endpoints[0]);
                return from<Promise<string | undefined>>(modalRef.result);
            }),
            map(result => {
                if (result) {
                    this.notify.info('INFO_UPLOAD_AASX_FILE_SUCCESS', result);
                }
            }),
            catchError(error => this.notify.error(error)),
        );
    }

    public downloadDocument(): Observable<void> {
        return from(this.selected()).pipe(
            mergeMap(document =>
                this.download.downloadDocument(document.endpoint, document.id, document.idShort + '.aasx'),
            ),
            catchError(error => this.notify.error(error)),
        );
    }

    public deleteDocument(): Observable<void> {
        if (this.selected().length === 0) {
            return EMPTY;
        }

        return of(this.activeFavorites()).pipe(
            mergeMap(activeFavorites => {
                if (activeFavorites) {
                    this.favorites.remove(this.selected(), activeFavorites);
                    this.store.removeFavorites([...this.selected()]);
                    return of(void 0);
                } else {
                    return this.auth.ensureAuthorized('editor').pipe(
                        map(() =>
                            this.window.confirm(
                                stringFormat(
                                    this.translate.instant('CONFIRM_DELETE_DOCUMENT'),
                                    this.selected()
                                        .map(item => item.idShort)
                                        .join(', '),
                                ),
                            ),
                        ),
                        mergeMap(result => from(result ? this.selected() : [])),
                        mergeMap(document => this.api.delete(document.id, document.endpoint)),
                        catchError(error => this.notify.error(error)),
                    );
                }
            }),
        );
    }

    public viewUserFeedback(): void {
        const descriptor: SubmodelViewDescriptor = {
            template: supportedSubmodelTemplates.get(CustomerFeedback),
            submodels: [],
        };

        for (const document of this.selected()) {
            const submodels = this.selectSubmodels(document, CustomerFeedback);
            if (submodels.length === 1) {
                descriptor.submodels.push({
                    id: document.id,
                    endpoint: document.endpoint,
                    idShort: submodels[0].idShort,
                });
            }
        }

        if (descriptor.submodels.length > 0) {
            this.clipboard.set('ViewQuery', { descriptor } as ViewQuery);
            this.router.navigateByUrl('/view?format=ViewQuery', { skipLocationChange: true });
        }
    }

    public viewNameplate(): void {
        const descriptor: SubmodelViewDescriptor = {
            template: supportedSubmodelTemplates.get(ZVEINameplate),
            submodels: [],
        };

        for (const document of this.selected()) {
            const submodels = this.selectSubmodels(document, ZVEINameplate);
            if (submodels.length === 1) {
                descriptor.submodels.push({
                    id: document.id,
                    endpoint: document.endpoint,
                    idShort: submodels[0].idShort,
                });
            }
        }

        if (descriptor.submodels.length > 0) {
            this.clipboard.set('ViewQuery', { descriptor } as ViewQuery);
            this.router.navigateByUrl('/view?format=ViewQuery', { skipLocationChange: true });
        }
    }

    public setFilter(filter: string): void {
        try {
            filter = filter.trim();
            if (filter.length >= 3) {
                new QueryParser(filter).check();
            } else {
                filter = '';
            }

            if (!this.activeFavorites()) {
                this.store.getFirstPage(filter);
            } else {
                this.store.setFilter(filter);
            }
        } catch (error) {
            this.notify.error(error);
        }
    }

    public firstPage(): void {
        this.store.getFirstPage();
    }

    public previousPage(): void {
        this.store.getPreviousPage();
    }

    public nextPage(): void {
        this.store.getNextPage();
    }

    public lastPage(): void {
        this.store.getLastPage();
    }

    public addToFavorites(): Observable<void> {
        return of(this.modal.open(FavoritesFormComponent, { backdrop: 'static', scrollable: true })).pipe(
            mergeMap(modalRef => {
                modalRef.componentInstance.documents = [...this.selected()];
                return from(modalRef.result);
            }),
            map(() => {
                this.selected.set([]);
            }),
        );
    }

    private selectSubmodels(document: AASDocument, semanticId: string): aas.Submodel[] {
        return document.content?.submodels.filter(submodel => resolveSemanticId(submodel) === semanticId) ?? [];
    }
}
