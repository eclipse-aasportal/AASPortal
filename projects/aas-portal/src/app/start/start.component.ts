/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { AfterViewInit, Component, OnDestroy, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { aas, AASDocument, AASEndpoint, QueryParser, stringFormat } from 'common';
import { BehaviorSubject, catchError, EMPTY, first, from, map, mergeMap, Observable, of, Subscription } from 'rxjs';
import {
    AuthService,
    ClipboardService,
    CustomerFeedback,
    DownloadService,
    IndexChangeService,
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
import * as StartActions from './start.actions';
import * as StartSelectors from './start.selectors';
import { StartFeatureState } from './start.state';
import { UploadFormComponent } from './upload-form/upload-form.component';
import { ToolbarService } from '../toolbar.service';
import { StartApiService } from './start-api.service';
import { FavoritesService } from './favorites.service';
import { FavoritesFormComponent } from './favorites-form/favorites-form.component';

@Component({
    selector: 'fhg-start',
    templateUrl: './start.component.html',
    styleUrls: ['./start.component.scss'],
})
export class StartComponent implements OnDestroy, AfterViewInit {
    private readonly store: Store<StartFeatureState>;
    private readonly subscription = new Subscription();
    private readonly someSelectedDocuments = new BehaviorSubject<boolean>(true);
    private _selected: AASDocument[] = [];

    public constructor(
        store: Store,
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
        private readonly indexChange: IndexChangeService,
    ) {
        this.store = store as Store<StartFeatureState>;
        this.filter = this.store.select(StartSelectors.selectFilter);
        this.filterFavorites = this.store.select(StartSelectors.selectFilterFavorites);
        this.limit = this.store.select(StartSelectors.selectLimit);
        this.isFirstPage = this.store.select(StartSelectors.selectIsFirstPage);
        this.isLastPage = this.store.select(StartSelectors.selectIsLastPage);
        this.documents = this.store.select(StartSelectors.selectDocuments);
        this.viewMode = this.store.select(StartSelectors.selectViewMode);
        this.currentFavorites = this.store.select(StartSelectors.selectCurrentFavorites);
        this.endpoints = this.api.getEndpoints();

        this.store
            .select(StartSelectors.selectViewMode)
            .pipe(
                first(viewMode => viewMode === ViewMode.Undefined),
                mergeMap(() => this.auth.ready),
                first(ready => ready),
                first(),
            )
            .subscribe({
                next: () => this.store.dispatch(StartActions.getFirstPage({})),
                error: error => this.notify.error(error),
            });
    }

    @ViewChild('startToolbar', { read: TemplateRef })
    public startToolbar: TemplateRef<unknown> | null = null;

    public readonly currentFavorites: Observable<string>;

    public readonly favoritesLists: Observable<string[]> = this.favorites.lists.pipe(
        map(lists => ['', ...lists.map(list => list.name)]),
    );

    public readonly viewMode: Observable<ViewMode>;

    public readonly filter: Observable<string>;

    public readonly filterFavorites: Observable<string>;

    public readonly limit: Observable<number>;

    public readonly isFirstPage: Observable<boolean>;

    public readonly isLastPage: Observable<boolean>;

    public readonly endpoints: Observable<AASEndpoint[]>;

    public readonly documents: Observable<AASDocument[]>;

    public readonly count = this.indexChange.count;

    public get selected(): AASDocument[] {
        return this._selected;
    }

    public set selected(values: AASDocument[]) {
        this._selected = values;
        this.someSelectedDocuments.next(values.length > 0);
    }

    public get canDownloadDocument(): boolean {
        return this._selected.length > 0 ? true : false;
    }

    public get canDeleteDocument(): boolean {
        return this._selected.length > 0;
    }

    public get canViewUserFeedback(): boolean {
        return this._selected.some(document => this.selectSubmodels(document, CustomerFeedback).length === 1);
    }

    public get canViewNameplate(): boolean {
        return this._selected.some(document => this.selectSubmodels(document, ZVEINameplate).length === 1);
    }

    public ngAfterViewInit(): void {
        if (this.startToolbar) {
            this.toolbar.set(this.startToolbar);
        }
    }

    public ngOnDestroy(): void {
        this.toolbar.clear();
        this.subscription.unsubscribe();
    }

    public setCurrentFavorites(value: string): void {
        const currentFavorites = this.favorites.get(value);
        if (currentFavorites) {
            this.store.dispatch(
                StartActions.getFavorites({
                    name: currentFavorites.name,
                    documents: currentFavorites.documents,
                }),
            );
        } else {
            this.store.dispatch(StartActions.getFirstPage({}));
        }
    }

    public setViewMode(viewMode: string | ViewMode): Observable<void> {
        return this.currentFavorites.pipe(
            first(),
            map(currentFavorites => {
                if (viewMode === ViewMode.List) {
                    if (!currentFavorites) {
                        this.store.dispatch(StartActions.setListView());
                    } else {
                        const favoritesList = this.favorites.get(currentFavorites);
                        if (favoritesList) {
                            this.store.dispatch(
                                StartActions.getFavorites({
                                    name: favoritesList.name,
                                    documents: favoritesList.documents,
                                }),
                            );
                        }
                    }
                } else {
                    this.store.dispatch(StartActions.setTreeView({ documents: this._selected }));
                }
            }),
        );
    }

    public addEndpoint(): Observable<void> {
        return this.auth.ensureAuthorized('editor').pipe(
            mergeMap(() => this.api.getEndpoints()),
            map(endpoints => {
                const modalRef = this.modal.open(AddEndpointFormComponent, { backdrop: 'static' });
                modalRef.componentInstance.endpoints = endpoints;
                return modalRef;
            }),
            mergeMap(modalRef => from<Promise<AASEndpoint | undefined>>(modalRef.result)),
            mergeMap(result => {
                if (!result) return EMPTY;

                return this.api.addEndpoint(result);
            }),
            catchError(error => this.notify.error(error)),
        );
    }

    public removeEndpoint(): Observable<void> {
        return this.auth.ensureAuthorized('editor').pipe(
            mergeMap(() => this.api.getEndpoints()),
            mergeMap(endpoints => {
                const modalRef = this.modal.open(RemoveEndpointFormComponent, { backdrop: 'static' });
                modalRef.componentInstance.endpoints = endpoints
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map(
                        item =>
                            ({
                                name: item.name,
                                url: item.url,
                                selected: false,
                            }) as EndpointSelect,
                    );
                return from<Promise<string[] | undefined>>(modalRef.result);
            }),
            mergeMap(endpoints => from(endpoints ?? [])),
            mergeMap(endpoint => this.api.removeEndpoint(endpoint)),
            catchError(error => this.notify.error(error)),
        );
    }

    public reset(): Observable<void> {
        return this.auth.ensureAuthorized('editor').pipe(
            map(() => this.window.confirm(this.translate.instant('CONFIRM_RESET_CONFIGURATION'))),
            mergeMap(result => {
                if (!result) return of(void 0);

                return this.api.reset();
            }),
            catchError(error => this.notify.error(error)),
        );
    }

    public uploadDocument(): Observable<void> {
        return this.auth.ensureAuthorized('editor').pipe(
            mergeMap(() => this.api.getEndpoints()),
            mergeMap(endpoints => {
                const modalRef = this.modal.open(UploadFormComponent, { backdrop: 'static' });
                modalRef.componentInstance.endpoints = endpoints.sort((a, b) => a.name.localeCompare(b.name));
                modalRef.componentInstance.endpoint = endpoints[0];
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
        return from(this._selected).pipe(
            mergeMap(document =>
                this.download.downloadDocument(document.endpoint, document.id, document.idShort + '.aasx'),
            ),
            catchError(error => this.notify.error(error)),
        );
    }

    public deleteDocument(): Observable<void> {
        if (this._selected.length === 0) {
            return EMPTY;
        }

        return this.currentFavorites.pipe(
            first(),
            mergeMap(currentFavorites => {
                if (currentFavorites) {
                    this.favorites.remove(this._selected, currentFavorites);
                    this.store.dispatch(StartActions.removeFavorites({ favorites: [...this._selected] }));
                    return of(void 0);
                } else {
                    return this.auth.ensureAuthorized('editor').pipe(
                        map(() =>
                            this.window.confirm(
                                stringFormat(
                                    this.translate.instant('CONFIRM_DELETE_DOCUMENT'),
                                    this._selected.map(item => item.idShort).join(', '),
                                ),
                            ),
                        ),
                        mergeMap(result => from(result ? this._selected : [])),
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

        for (const document of this._selected) {
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

        for (const document of this._selected) {
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

            if (!this.currentFavorites) {
                this.store.dispatch(StartActions.getFirstPage({ filter }));
            } else {
                this.store.dispatch(StartActions.setFilter({ filter }));
            }
        } catch (error) {
            this.notify.error(error);
        }
    }

    public setLimit(value: string | number): void {
        this.store.dispatch(StartActions.getFirstPage({ limit: Number(value) }));
    }

    public firstPage(): void {
        this.store.dispatch(StartActions.getFirstPage({}));
    }

    public previousPage(): void {
        this.store.dispatch(StartActions.getPreviousPage());
    }

    public nextPage(): void {
        this.store.dispatch(StartActions.getNextPage());
    }

    public lastPage(): void {
        this.store.dispatch(StartActions.getLastPage());
    }

    public refreshPage(): void {
        this.store.dispatch(StartActions.refreshPage());
        this.indexChange.clear();
    }

    public addToFavorites(): Observable<void> {
        return of(this.modal.open(FavoritesFormComponent, { backdrop: 'static', scrollable: true })).pipe(
            mergeMap(modalRef => {
                modalRef.componentInstance.documents = [...this._selected];
                return from(modalRef.result);
            }),
            map(() => {
                this.selected = [];
            }),
        );
    }

    private selectSubmodels(document: AASDocument, semanticId: string): aas.Submodel[] {
        return document.content?.submodels.filter(submodel => resolveSemanticId(submodel) === semanticId) ?? [];
    }
}
