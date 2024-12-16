/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Route, Router } from '@angular/router';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
    ChangeDetectionStrategy,
    Component,
    OnDestroy,
    TemplateRef,
    computed,
    effect,
    signal,
    viewChild,
} from '@angular/core';

import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AASEndpoint, QueryParser, stringFormat } from 'aas-core';
import { catchError, EMPTY, first, from, map, mergeMap, Observable, of } from 'rxjs';
import {
    AASTableComponent,
    AuthService,
    DownloadService,
    NotifyService,
    ViewMode,
    WindowService,
    encodeBase64Url,
    viewRoutes,
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
import { StartService } from './start.service';

@Component({
    selector: 'fhg-start',
    templateUrl: './start.component.html',
    styleUrls: ['./start.component.scss'],
    standalone: true,
    imports: [AASTableComponent, NgClass, TranslateModule, NgbModule, FormsModule],
    providers: [StartService],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StartComponent implements OnDestroy {
    public constructor(
        private readonly service: StartService,
        private readonly store: StartStore,
        private readonly api: StartApiService,
        private readonly router: Router,
        private readonly modal: NgbModal,
        private readonly translate: TranslateService,
        private readonly window: WindowService,
        private readonly notify: NotifyService,
        private readonly toolbar: ToolbarService,
        private readonly auth: AuthService,
        private readonly download: DownloadService,
        private readonly favorites: FavoritesService,
    ) {
        if (this.store.viewMode === ViewMode.Undefined) {
            this.auth.userId
                .pipe(first(userId => userId !== undefined))
                .subscribe(() => this.viewMode.set(ViewMode.List));
        } else {
            this.service.restore();
        }

        effect(
            () => {
                this.service.vieModeChange(this.store.viewMode$());
            },
            { allowSignalWrites: true },
        );

        effect(
            () => {
                this.service.activeFavoritesChange(this.activeFavorites());
            },
            { allowSignalWrites: true },
        );

        effect(
            () => {
                this.service.limitChange(this.limit());
            },
            { allowSignalWrites: true },
        );

        effect(
            () => {
                const startToolbar = this.startToolbar();
                if (startToolbar) {
                    this.toolbar.set(startToolbar);
                }
            },
            { allowSignalWrites: true },
        );
    }

    public readonly startToolbar = viewChild<TemplateRef<unknown>>('startToolbar');

    public readonly activeFavorites = this.store.activeFavorites$;

    public readonly limit = this.store.limit$;

    public readonly viewMode = this.store.viewMode$;

    public readonly favoritesLists = computed(() => ['', ...this.favorites.lists().map(list => list.name)]);

    public readonly filter = computed(() => {
        const filterText = this.store.filterText$();
        return this.store.activeFavorites$() ? filterText : '';
    });

    public readonly filterText = this.store.filterText$;

    public readonly isFirstPage = computed(() => this.store.previous$() === null);

    public readonly isLastPage = computed(() => this.store.next$() === null);

    public readonly documents = this.store.documents$.asReadonly();

    public readonly selected = this.store.selected$;

    public readonly someSelected = computed(() => this.store.selected$().length > 0);

    public readonly views = signal(viewRoutes).asReadonly();

    public ngOnDestroy(): void {
        this.toolbar.clear();
        this.store.save().subscribe();
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
        return from(this.store.selected).pipe(
            mergeMap(document =>
                this.download.downloadDocument(document.endpoint, document.id, document.idShort + '.aasx'),
            ),
            catchError(error => this.notify.error(error)),
        );
    }

    public deleteDocument(): Observable<void> {
        if (this.store.selected.length === 0) {
            return EMPTY;
        }

        return of(this.store.activeFavorites).pipe(
            mergeMap(activeFavorites => {
                if (activeFavorites) {
                    this.favorites.remove(this.store.selected, activeFavorites);
                    this.service.removeFavorites([...this.store.selected]);
                    return of(void 0);
                } else {
                    return this.auth.ensureAuthorized('editor').pipe(
                        map(() =>
                            this.window.confirm(
                                stringFormat(
                                    this.translate.instant('CONFIRM_DELETE_DOCUMENT'),
                                    this.store.selected.map(item => item.idShort).join(', '),
                                ),
                            ),
                        ),
                        mergeMap(result => from(result ? this.store.selected : [])),
                        mergeMap(document => this.api.delete(document.id, document.endpoint)),
                        catchError(error => this.notify.error(error)),
                    );
                }
            }),
        );
    }

    public openView(view: Route): Promise<boolean> {
        const documents = this.store.selected;
        if (documents.length === 1) {
            return this.router.navigate([`/view/${view.path}`], {
                queryParams: {
                    endpoint: encodeBase64Url(documents[0].endpoint),
                    id: encodeBase64Url(documents[0].id),
                },
                state: { data: JSON.stringify(this.store.selected) },
            });
        }

        return this.router.navigate([`/view/${view.path}`], {
            state: { data: JSON.stringify(documents) },
        });
    }

    public setFilter(filter: string): void {
        try {
            filter = filter.trim();
            if (filter.length >= 3) {
                new QueryParser(filter).check();
            } else {
                filter = '';
            }

            if (!this.store.activeFavorites) {
                this.service.getFirstPage(filter);
            } else {
                this.store.filterText$.set(filter);
            }
        } catch (error) {
            this.notify.error(error);
        }
    }

    public firstPage(): void {
        this.service.getFirstPage();
    }

    public previousPage(): void {
        this.service.getPreviousPage();
    }

    public nextPage(): void {
        this.service.getNextPage();
    }

    public lastPage(): void {
        this.service.getLastPage();
    }

    public addToFavorites(): Observable<void> {
        return of(this.modal.open(FavoritesFormComponent, { backdrop: 'static', scrollable: true })).pipe(
            mergeMap(modalRef => {
                modalRef.componentInstance.documents = [...this.store.selected];
                return from(modalRef.result);
            }),
            map(() => {
                this.selected.set([]);
            }),
        );
    }
}
