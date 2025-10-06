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
    inject,
    signal,
    viewChild,
} from '@angular/core';

import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { catchError, EMPTY, from, map, mergeMap, Observable, of } from 'rxjs';
import { AASDocument, AASEndpoint, QueryParser, stringFormat } from 'aas-core';
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
import { ShellsState } from './shells.state';
import { UpdateEndpointFormComponent } from './update-endpoint-form/update-endpoint-form.component';
import { ExtrasEndpointFormComponent } from './extras-endpoint-form/extras-endpoint-form.component';

@Component({
    selector: 'fhg-shells',
    templateUrl: './shells.component.html',
    styleUrls: ['./shells.component.scss'],
    imports: [AASTable, NgClass, TranslateModule, NgbModule, FormsModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
/**
 * Component responsible for managing AAS (Asset Administration Shell) documents and endpoints.
 * Provides functionality for:
 * - Document management (upload, download, delete)
 * - Endpoint management (add, update, remove)
 * - Favorites management
 * - Document filtering and pagination
 * - View navigation
 * - Toolbar integration
 *
 * Key features:
 * - Document selection and bulk operations
 * - Favorites list management
 * - Pagination controls
 * - Search filtering with query parsing
 * - Authorization checks for privileged operations
 * - Integration with start menu and toolbar
 * - Modal dialogs for user interactions
 */
export class ShellsComponent implements OnDestroy {
    @Inject(WINDOW) private readonly window = inject(WINDOW);
    private readonly state = inject(ShellsState);
    private readonly api = inject(EndpointsService);
    private readonly router = inject(Router);
    private readonly modal = inject(NgbModal);
    private readonly translate = inject(TranslateService);
    private readonly notify = inject(NotifyService);
    private readonly toolbar = inject(ToolbarService);
    private readonly auth = inject(AuthService);
    private readonly download = inject(DownloadService);
    private readonly favorites = inject(FavoritesService);
    private readonly start = inject(StartService);

    public constructor() {
        effect(() => {
            const template = this.toolbarTemplate();
            if (template) {
                this.toolbar.set(template);
            }
        });
    }

    public readonly toolbarTemplate = viewChild<TemplateRef<unknown>>('toolbar');

    public readonly activeFavorites = this.favorites.active;

    public readonly limit = this.state.limit;

    public readonly favoritesLists = computed(() => ['', ...this.favorites.items().map(list => list.name)]);

    public readonly filter = computed(() => {
        const filterText = this.filterText();
        return this.favorites.active() ? filterText : '';
    });

    public readonly filterText = this.state.filterText;

    public readonly isFirstPage = computed(() => this.state.previous() === null);

    public readonly isLastPage = computed(() => this.state.next() === null);

    public readonly documents = this.state.documents;

    public readonly selected = this.state.selected;

    public readonly someSelected = computed(() => this.selected().length > 0);

    public readonly views = signal(viewRoutes).asReadonly();

    public ngOnDestroy(): void {
        this.toolbar.clear();
        this.state.save().subscribe();
    }

    /**
     * Sets the specified favorite list as active and persists the change.
     * @param name - The name of the favorite list to set as active
     */
    public setActiveFavoriteList(name: string): void {
        this.favorites.setActive(name);
        this.favorites.save().subscribe();
    }

    /**
     * Updates the page options in the state with a new limit value.
     * @param limit - The number of items to display per page
     */
    public setLimit(limit: number): void {
        this.state.update({ pageOptions: { limit, filterText: this.filterText() } });
    }

    /**
     * Updates the state by setting the selected documents.
     * @param documents - An array of AASDocument objects to be set as selected
     */
    public setSelected(documents: AASDocument[]): void {
        this.state.update({ selected: documents });
    }

    /**
     * Adds a new AAS endpoint after ensuring user authorization.
     * The method performs the following steps:
     * 1. Verifies that the user has 'editor' privileges
     * 2. Retrieves existing endpoints
     * 3. Opens a modal dialog for endpoint configuration
     * 4. Adds the new endpoint if user confirms the dialog
     *
     * @returns An Observable that completes when the endpoint is successfully added,
     *          or emits an error if the operation fails. Returns EMPTY if user cancels the operation.
     * @throws Will be caught and handled by the notification service
     */
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

    /**
     * Updates an AAS endpoint after user authorization and endpoint selection.
     *
     * This method performs the following steps:
     * 1. Ensures the user has 'editor' authorization
     * 2. Retrieves available endpoints
     * 3. Opens a modal dialog for endpoint selection and updates
     * 4. Processes the user's selection and updates the endpoint
     *
     * @returns An Observable that completes when the endpoint is updated, or emits an error if the operation fails
     *
     * @throws Error if unauthorized, endpoint retrieval fails, or update operation fails
     */
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

    /**
     * Removes one or multiple endpoints after user selection through a modal dialog.
     * This operation requires editor authorization.
     *
     * The process includes:
     * 1. Verifying user authorization
     * 2. Fetching available endpoints
     * 3. Displaying a selection modal
     * 4. Processing user selection
     * 5. Removing selected endpoints
     *
     * @returns An Observable that completes when the endpoint removal process is finished
     * @throws Handled by the notification service if any error occurs during the process
     */
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
        return from(this.state.selected()).pipe(
            mergeMap(document =>
                this.download.downloadPackage(document.endpoint, document.id, document.idShort + '.aasx'),
            ),
            catchError(error => this.notify.error(error)),
        );
    }

    public deleteDocument(): Observable<void> {
        if (this.state.selected().length === 0) {
            return EMPTY;
        }

        return of(this.favorites.active()).pipe(
            mergeMap(activeFavorites => {
                if (activeFavorites) {
                    this.favorites.remove(this.state.selected(), activeFavorites);
                    this.removeFavorites([...this.state.selected()]);
                    return this.favorites.save();
                } else {
                    return this.auth.ensureAuthorized('editor').pipe(
                        map(() =>
                            this.window.confirm(
                                stringFormat(
                                    this.translate.instant('CONFIRM_DELETE_DOCUMENT'),
                                    this.state
                                        .selected()
                                        .map(item => item.idShort)
                                        .join(', '),
                                ),
                            ),
                        ),
                        mergeMap(result => from(result ? this.state.selected() : [])),
                        mergeMap(document => this.api.delete(document.id, document.endpoint)),
                        catchError(error => this.notify.error(error)),
                    );
                }
            }),
        );
    }

    public openView(view: Route): Promise<boolean> {
        const documents = this.state.selected();
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

    public setFilter(filterText: string): void {
        try {
            filterText = filterText.trim();
            if (filterText.length >= 3) {
                new QueryParser(filterText).check();
            } else {
                filterText = '';
            }

            this.state.update({ pageOptions: { limit: this.state.limit(), filterText } });
            if (!this.favorites.active()) {
                this.state.getFirstPage(filterText);
            }
        } catch (error) {
            this.notify.error(error);
        }
    }

    public firstPage(): void {
        this.state.getFirstPage();
    }

    public previousPage(): void {
        this.state.getPreviousPage();
    }

    public nextPage(): void {
        this.state.getNextPage();
    }

    public lastPage(): void {
        this.state.getLastPage();
    }

    public addToFavorites(): Observable<void> {
        return of(this.modal.open(FavoritesFormComponent, { backdrop: 'static', scrollable: true })).pipe(
            mergeMap(modalRef => {
                modalRef.componentInstance.documents = [...this.state.selected()];
                return from(modalRef.result);
            }),
            map(() => {
                this.state.update({ selected: [] });
            }),
        );
    }

    public addToStart(): Observable<void> {
        for (const document of this.state.selected()) {
            this.start.add('Favorite', `${document.endpoint}.${document.id}`, {
                id: document.id,
                endpoint: document.endpoint,
            });
        }

        return this.start.save();
    }

    private removeFavorites(favorites: AASDocument[]): void {
        if (!this.favorites.active()) {
            return;
        }

        const documents = this.documents().filter(document =>
            favorites.every(favorite => document.endpoint !== favorite.endpoint || document.id !== favorite.id),
        );

        this.state.update({ documents });
    }
}
