/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Route, Router } from '@angular/router';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpEventType } from '@angular/common/http';
import {
    Component,
    ElementRef,
    OnDestroy,
    TemplateRef,
    computed,
    effect,
    inject,
    model,
    signal,
    viewChild,
} from '@angular/core';

import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateDirective, TranslatePipe, TranslateService } from '@ngx-translate/core';
import { catchError, concatMap, EMPTY, from, map, mergeMap, Observable, of } from 'rxjs';
import { AASDocument, AASEndpoint, QueryParser } from 'aas-core';
import {
    AASTable,
    AuthService,
    ConfirmDialog,
    EndpointsApi,
    NotifyService,
    ProgressService,
    StartService,
    ToolbarService,
    encodeBase64Url,
    viewRoutes,
} from 'aas-lib';

import { UploadFormComponent } from './upload-form/upload-form.component';
import { FavoritesService } from './favorites.service';
import { FavoritesFormComponent } from './favorites-form/favorites-form.component';
import { ShellsState } from './shells.state';
import { INFO } from '../messages';

@Component({
    selector: 'fhg-shells',
    templateUrl: './shells.component.html',
    styleUrls: ['./shells.component.scss'],
    imports: [AASTable, NgClass, TranslateDirective, TranslatePipe, NgbModule, FormsModule],
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
    private readonly state = inject(ShellsState);
    private readonly router = inject(Router);
    private readonly modal = inject(NgbModal);
    private readonly translate = inject(TranslateService);
    private readonly notify = inject(NotifyService);
    private readonly toolbar = inject(ToolbarService);
    private readonly auth = inject(AuthService);
    private readonly api = inject(EndpointsApi);
    private readonly favorites = inject(FavoritesService);
    private readonly start = inject(StartService);
    private readonly progress = inject(ProgressService);

    public constructor() {
        effect(() => {
            const template = this.toolbarTemplate();
            if (template) {
                this.toolbar.set(template);
            }
        });

        effect(() => {
            const files = this.files();
            const inputFiles = this.inputFiles();
            if (!files || !inputFiles) {
                return;
            }

            const fileList = inputFiles.nativeElement.files;
            if (!fileList) {
                return;
            }

            this.progress.begin();
            this.uploadPackages(Array.from(fileList)).subscribe({
                error: () => {
                    this.progress.end();
                    this.files.set(undefined);
                },
                complete: () => {
                    this.progress.end();
                    this.files.set(undefined);
                },
            });
        });
    }

    /**
     * Reference to the toolbar template defined in the component's HTML.
     * This template is used to populate the application's toolbar when this component is active.
     */
    public readonly toolbarTemplate = viewChild<TemplateRef<unknown>>('toolbar');

    /**
     * Reference to the file input element used for uploading AASX package files.
     */
    public readonly inputFiles = viewChild<ElementRef<HTMLInputElement>>('inputFiles');

    /**
     * The files selected for upload.
     */
    public readonly files = model<string[]>();

    /**
     * Name of the currently active favorites list. An empty string indicates that no favorites list is activated.
     */
    public readonly activeFavoritesList = this.favorites.active;

    /**
     * The maximum number of items used for paging or limiting result sets.
     */
    public readonly limit = this.state.limit;

    /**
     * Array of favorite list names for use in the UI.
     *
     * The array always begins with an empty string (intended as a "no selection" or placeholder),
     * followed by the name of each favorite list returned by this.favorites.items().
     */
    public readonly favoritesLists = computed(() => ['', ...this.favorites.items().map(list => list.name)]);

    /**
     * The current active filter expression.
     */
    public readonly filter = computed(() => {
        const filterText = this.filterText();
        return this.favorites.active() ? filterText : '';
    });

    /**
     * The filter expression.
     */
    public readonly filterText = this.state.filterText;

    /**
     * Indicates whether the pagination is currently on the first page.
     */
    public readonly isFirstPage = this.state.isFirstPage;

    /**
     * Indicates whether the pagination is currently on the last page.
     */
    public readonly isLastPage = this.state.isLastPage;

    /**
     * The visible documents.
     */
    public readonly documents = this.state.documents.asReadonly();

    /**
     * The selected documents.
     */
    public readonly selected = this.state.selected;

    /**
     * Indicates that at least one document is selected.
     */
    public readonly someSelected = computed(() => this.selected().length > 0);

    /**
     * Provides a list of available views.
     */
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
        this.state.update({ limit });
    }

    /**
     * Updates the state by setting the selected documents.
     * @param documents - An array of AASDocument objects to be set as selected
     */
    public setSelected(documents: AASDocument[]): void {
        this.state.update({ selected: documents });
    }

    /**
     * Updates the state by setting the selected documents.
     * @param documents - An array of AASDocument objects to be set as selected
     */
    public emptySelected(): void {
        this.state.update({ selected: [] });
    }

    /**
     * Initiates download(s) of the AASX package files for the currently selected document(s).
     *
     * @returns An Observable that completes when the download request(s) complete.
     */
    public downloadPackages(): Observable<void> {
        return from(this.state.selected()).pipe(
            mergeMap(document => this.api.downloadPackage(document.endpoint, document.id, document.idShort + '.aasx')),
            catchError(error => of(this.notify.error(error))),
        );
    }

    /**
     * Deletes the currently selected documents.
     * - If there is an active favorites collection:
     *   - Removes the selected items from that favorites collection (calls `favorites.remove` and local `removeFavorites`).
     *   - Persists the favorites change and returns the observable produced by `favorites.save()`.
     * - Otherwise (no active favorites):
     *   - Deletes the corresponding AASX packages from the endpoint.
     *   - Ensures the user is authorized.
     *   - Shows a confirmation dialog.
     *
     * @returns Observable that completes when the operation finishes (or EMPTY if there was nothing to delete).
     */
    public deletePackages(): Observable<void> {
        if (this.state.selected().length === 0) {
            return EMPTY;
        }

        return of(this.favorites.active()).pipe(
            mergeMap(activeFavorites => {
                if (activeFavorites) {
                    this.favorites.remove(this.state.selected(), activeFavorites);
                    return this.favorites.save();
                } else {
                    return this.auth.checkAuthorized('user').pipe(
                        mergeMap(() =>
                            ConfirmDialog.open(
                                this.modal,
                                this.translate.instant('Shells.CONFIRM_DELETE_DOCUMENT', {
                                    documents: this.state
                                        .selected()
                                        .map(item => item.idShort)
                                        .join(', '),
                                }),
                            ),
                        ),
                        mergeMap(result => from(result ? this.state.selected() : [])),
                        mergeMap(document => this.api.deletePackage(document.id, document.endpoint)),
                        catchError(error => {
                            this.notify.error(error);
                            return of(void 0);
                        }),
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

    public setFilterText(filterText: string): void {
        try {
            filterText = filterText.trim();
            if (filterText.length >= 3) {
                new QueryParser(filterText).check();
            } else {
                filterText = '';
            }

            this.state.update({ filterText });
            if (!this.favorites.active()) {
                this.state.getFirstPage();
            }
        } catch (error) {
            this.notify.error(error);
        }
    }

    public getFirstPage(): void {
        this.state.getFirstPage();
    }

    public getPreviousPage(): void {
        this.state.getPreviousPage();
    }

    public getNextPage(): void {
        this.state.getNextPage();
    }

    public getLastPage(): void {
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
                href: `/aas;endpoint=${encodeBase64Url(document.endpoint)};id=${encodeBase64Url(document.id)}`,
                id: document.id,
                endpoint: document.endpoint,
            });
        }

        return this.start.save();
    }

    private uploadPackages(files: File[]): Observable<void> {
        return this.auth.checkAuthorized('user').pipe(
            mergeMap(() => this.api.getEndpoints()),
            mergeMap(endpoints => {
                if (endpoints.length <= 1) {
                    return of(endpoints.at(0));
                }

                const modalRef = this.modal.open(UploadFormComponent, { backdrop: 'static' });
                modalRef.componentInstance.endpoints.set(endpoints.sort((a, b) => a.name.localeCompare(b.name)));
                modalRef.componentInstance.endpoint.set(endpoints.at(0));
                return from<Promise<AASEndpoint | undefined>>(modalRef.result);
            }),
            mergeMap(endpoint => {
                if (!endpoint) {
                    return EMPTY;
                }

                return of(...files).pipe(
                    concatMap(file => {
                        const inputFiles = this.inputFiles()?.nativeElement.files;
                        if (!inputFiles) {
                            return EMPTY;
                        }

                        return this.api.uploadPackage(endpoint.name, file).pipe(
                            catchError(error => {
                                this.notify.error(error);
                                return of();
                            }),
                            map(event => {
                                if (event.type === HttpEventType.UploadProgress) {
                                    this.progress.set(Math.round((event.loaded / event.total!) * 100), file.name);
                                } else if (event.type === HttpEventType.Response) {
                                    this.notify.info(INFO.FILE_SUCCESSFULLY_UPLOADED, { file: file.name });
                                }
                            }),
                        );
                    }),
                );
            }),
        );
    }
}
