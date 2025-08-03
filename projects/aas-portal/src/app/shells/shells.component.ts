/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
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
    Inject,
    OnDestroy,
    TemplateRef,
    computed,
    effect,
    signal,
    viewChild,
} from '@angular/core';

import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { catchError, EMPTY, from, map, mergeMap, Observable, of } from 'rxjs';
import { AASEndpoint, QueryParser, stringFormat } from 'aas-core';
import {
    AASTable,
    AuthService,
    DownloadService,
    EndpointsService,
    NotifyService,
    StartService,
    ToolbarService,
    WINDOW,
    encodeBase64Url,
    viewRoutes,
} from 'aas-lib';

import { AddEndpointFormComponent } from './add-endpoint-form/add-endpoint-form.component';
import { EndpointSelect, RemoveEndpointFormComponent } from './remove-endpoint-form/remove-endpoint-form.component';
import { UploadFormComponent } from './upload-form/upload-form.component';
import { FavoritesService } from './favorites.service';
import { FavoritesFormComponent } from './favorites-form/favorites-form.component';
import { ShellsService } from './shells.service';
import { UpdateEndpointFormComponent } from './update-endpoint-form/update-endpoint-form.component';
import { ExtrasEndpointFormComponent } from './extras-endpoint-form/extras-endpoint-form.component';

@Component({
    selector: 'fhg-shells',
    templateUrl: './shells.component.html',
    styleUrls: ['./shells.component.scss'],
    imports: [AASTable, NgClass, TranslateModule, NgbModule, FormsModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellsComponent implements OnDestroy {
    public constructor(
        private readonly service: ShellsService,
        private readonly api: EndpointsService,
        private readonly router: Router,
        private readonly modal: NgbModal,
        private readonly translate: TranslateService,
        @Inject(WINDOW) private readonly window: Window,
        private readonly notify: NotifyService,
        private readonly toolbar: ToolbarService,
        private readonly auth: AuthService,
        private readonly download: DownloadService,
        private readonly favorites: FavoritesService,
        private readonly start: StartService,
    ) {
        effect(() => {
            const template = this.toolbarTemplate();
            if (template) {
                this.toolbar.set(template);
            }
        });
    }

    public readonly toolbarTemplate = viewChild<TemplateRef<unknown>>('shellsToolbar');

    public readonly activeFavorites = this.favorites.active;

    public readonly limit = this.service.limit;

    public readonly favoritesLists = computed(() => ['', ...this.favorites.items().map(list => list.name)]);

    public readonly filter = computed(() => {
        const filterText = this.filterText();
        return this.favorites.active() ? filterText : '';
    });

    public readonly filterText = this.service.filterText;

    public readonly isFirstPage = computed(() => this.service.previous() === null);

    public readonly isLastPage = computed(() => this.service.next() === null);

    public readonly documents = this.service.documents.asReadonly();

    public readonly selected = this.service.selected;

    public readonly someSelected = computed(() => this.selected().length > 0);

    public readonly views = signal(viewRoutes).asReadonly();

    public ngOnDestroy(): void {
        this.toolbar.clear();
        this.service.save().subscribe();
    }

    public setActiveFavorites(name: string): void {
        this.favorites.setActive(name);
        this.favorites.save().subscribe();
    }

    public setLimit(value: number): void {
        this.service.setLimit(value);
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
        return from(this.service.selected()).pipe(
            mergeMap(document =>
                this.download.downloadPackage(document.endpoint, document.id, document.idShort + '.aasx'),
            ),
            catchError(error => this.notify.error(error)),
        );
    }

    public deleteDocument(): Observable<void> {
        if (this.service.selected().length === 0) {
            return EMPTY;
        }

        return of(this.favorites.active()).pipe(
            mergeMap(activeFavorites => {
                if (activeFavorites) {
                    this.favorites.remove(this.service.selected(), activeFavorites);
                    this.service.removeFavorites([...this.service.selected()]);
                    return this.favorites.save();
                } else {
                    return this.auth.ensureAuthorized('editor').pipe(
                        map(() =>
                            this.window.confirm(
                                stringFormat(
                                    this.translate.instant('CONFIRM_DELETE_DOCUMENT'),
                                    this.service
                                        .selected()
                                        .map(item => item.idShort)
                                        .join(', '),
                                ),
                            ),
                        ),
                        mergeMap(result => from(result ? this.service.selected() : [])),
                        mergeMap(document => this.api.delete(document.id, document.endpoint)),
                        catchError(error => this.notify.error(error)),
                    );
                }
            }),
        );
    }

    public openView(view: Route): Promise<boolean> {
        const documents = this.service.selected();
        if (documents.length === 0) {
            return Promise.resolve(false);
        }

        if (documents.length === 1) {
            return this.router.navigate([
                `/views/${view.path}`,
                {
                    endpoint: encodeBase64Url(documents[0].endpoint),
                    id: encodeBase64Url(documents[0].id),
                },
            ]);
        }

        return this.router.navigate([
            `/views/${view.path}`,
            { docs: encodeBase64Url(JSON.stringify(documents.map(document => [document.endpoint, document.id]))) },
        ]);
    }

    public setFilter(filter: string): void {
        try {
            filter = filter.trim();
            if (filter.length >= 3) {
                new QueryParser(filter).check();
            } else {
                filter = '';
            }

            this.service.setFilterText(filter);
            if (!this.favorites.active()) {
                this.service.getFirstPage(filter);
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
                modalRef.componentInstance.documents = [...this.service.selected()];
                return from(modalRef.result);
            }),
            map(() => {
                this.selected.set([]);
            }),
        );
    }

    public addToStart(): Observable<void> {
        for (const document of this.service.selected()) {
            this.start.add('Favorite', `${document.endpoint}.${document.id}`, {
                id: document.id,
                endpoint: document.endpoint,
            });
        }

        return this.start.save();
    }
}
