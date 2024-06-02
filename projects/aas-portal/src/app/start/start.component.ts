/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { AfterViewInit, Component, OnDestroy, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { aas, AASDocument, AASEndpoint, QueryParser, stringFormat } from 'common';
import { BehaviorSubject, catchError, EMPTY, first, from, map, mergeMap, Observable, of, Subscription } from 'rxjs';
import {
    AASTableComponent,
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
import { UploadFormComponent } from './upload-form/upload-form.component';
import { ToolbarService } from '../toolbar.service';
import { StartApiService } from './start-api.service';
import { FavoritesService } from './favorites.service';
import { FavoritesFormComponent } from './favorites-form/favorites-form.component';
import { StartStore } from './start.store';
import { AsyncPipe, NgClass } from '@angular/common';

@Component({
    selector: 'fhg-start',
    templateUrl: './start.component.html',
    styleUrls: ['./start.component.scss'],
    standalone: true,
    imports: [AASTableComponent, NgClass, AsyncPipe, TranslateModule, NgbModule],
})
export class StartComponent implements OnDestroy, AfterViewInit {
    private readonly subscription = new Subscription();
    private readonly someSelectedDocuments = new BehaviorSubject<boolean>(true);
    private _selected: AASDocument[] = [];

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
        private readonly indexChange: IndexChangeService,
    ) {
        this.endpoints = this.api.getEndpoints();

        if (this.store.viewMode === ViewMode.Undefined) {
            this.auth.ready.pipe(first(ready => ready)).subscribe({
                next: () => this.store.getFirstPage(),
                error: error => this.notify.error(error),
            });
        }
    }

    @ViewChild('startToolbar', { read: TemplateRef })
    public startToolbar: TemplateRef<unknown> | null = null;

    public get activeFavorites(): string {
        return this.store.activeFavorites;
    }

    public get favoritesLists(): string[] {
        return ['', ...this.favorites.lists.map(list => list.name)];
    }

    public get filter(): string {
        return this.store.activeFavorites ? this.store.filterText : '';
    }

    public get viewMode(): ViewMode {
        return this.store.viewMode;
    }

    public get limit(): number {
        return this.store.limit;
    }

    public get filterText(): string {
        return this.store.filterText;
    }

    public get isFirstPage(): boolean {
        return this.store.isFirstPage;
    }

    public get isLastPage(): boolean {
        return this.store.isLastPage;
    }

    public readonly endpoints: Observable<AASEndpoint[]>;

    public get documents(): AASDocument[] {
        return this.store.documents;
    }

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

    public setActiveFavorites(value: string): void {
        const currentFavorites = this.favorites.get(value);
        if (currentFavorites) {
            this.store.getFavorites(currentFavorites.name, currentFavorites.documents);
        } else {
            this.store.getFirstPage();
        }
    }

    public setViewMode(viewMode: string | ViewMode): Observable<void> {
        return of(this.activeFavorites).pipe(
            map(currentFavorites => {
                if (viewMode === ViewMode.List) {
                    if (!currentFavorites) {
                        this.store.getFirstPage();
                    } else {
                        const favoritesList = this.favorites.get(currentFavorites);
                        if (favoritesList) {
                            this.store.getFavorites(favoritesList.name, favoritesList.documents);
                        }
                    }
                } else {
                    this.store.setTreeView(this._selected);
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

        return of(this.activeFavorites).pipe(
            mergeMap(activeFavorites => {
                if (activeFavorites) {
                    this.favorites.remove(this._selected, activeFavorites);
                    this.store.removeFavorites([...this._selected]);
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

            if (!this.activeFavorites) {
                this.store.getFirstPage(filter);
            } else {
                this.store.setFilter(filter);
            }
        } catch (error) {
            this.notify.error(error);
        }
    }

    public setLimit(value: string | number): void {
        this.store.getFirstPage(undefined, Number(value));
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

    public refreshPage(): void {
        this.store.refreshPage();
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
