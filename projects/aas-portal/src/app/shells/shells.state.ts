/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { computed, effect, inject, Injectable, OnDestroy, signal, untracked } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, concat, EMPTY, from, map, mergeMap, Observable, of, skipWhile, Subscription } from 'rxjs';
import { aas, AASDocument, AASDocumentId, AASPagedResult } from 'aas-core';
import { AuthService, EndpointsApi, IndexChangeService } from 'aas-lib';
import { FavoritesService } from './favorites.service';

export type PageOptions = {
    limit: number;
    filterText: string;
};

export type ShellsData = {
    pageOptions: PageOptions;
    documents: AASDocument[];
    selected: AASDocument[];
    previous: AASDocumentId | null;
    next: AASDocumentId | null;
};

const cookieName = 'v1.Shells';

const initialData: ShellsData = {
    pageOptions: {
        limit: 10,
        filterText: '',
    },
    documents: [],
    selected: [],
    previous: null,
    next: null,
};

@Injectable({
    providedIn: 'root',
})
export class ShellsState implements OnDestroy {
<<<<<<< HEAD
    private readonly data = signal(initialData);
=======
>>>>>>> development
    private readonly subscription = new Subscription();
    private readonly pageOptions$ = signal(initialData.pageOptions);
    private readonly documents$ = signal<AASDocument[]>(initialData.documents);
    private readonly selected$ = signal<AASDocument[]>(initialData.selected);
    private readonly previous$ = signal<AASDocumentId | null>(initialData.previous);
    private readonly next$ = signal<AASDocumentId | null>(initialData.next);
    private readonly auth = inject(AuthService);
    private readonly translate = inject(TranslateService);
    private readonly favorites = inject(FavoritesService);
    private readonly api = inject(EndpointsApi);
    private readonly indexChange = inject(IndexChangeService);

    public constructor() {
        this.auth.ready
            .pipe(
                skipWhile(ready => ready === false),
                takeUntilDestroyed(),
                mergeMap(() => this.auth.getCookie(cookieName)),
            )
            .subscribe(value => {
                if (value) {
                    this.update({ pageOptions: JSON.parse(value) });
                }
            });

        effect(() => {
            const activeFavorites = this.favorites.active();
            if (activeFavorites) {
                this.getFavorites(this.favorites.get(activeFavorites)?.documents ?? []);
            } else {
                this.getFirstPage();
            }
        });

        effect(() => {
            this.refreshPage(this.limit());
        });

        this.subscription.add(this.indexChange.message.subscribe(this.updatePage));
    }

    public readonly active = this.favorites.active;

<<<<<<< HEAD
    public readonly limit = computed(() => this.data().pageOptions.limit);

    public readonly filterText = computed(() => this.data().pageOptions.filterText);
=======
    public readonly limit = computed(() => this.pageOptions$().limit);

    public readonly filterText = computed(() => this.pageOptions$().filterText);
>>>>>>> development

    public readonly documents = this.documents$.asReadonly();

    public readonly selected = this.selected$.asReadonly();

    public readonly previous = this.previous$.asReadonly();

    public readonly next = this.next$.asReadonly();

    public ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

<<<<<<< HEAD
=======
    /**
     * Updates the state with new data.
     * @param newState - A partial object containing the state properties to update
     * @property {PageOptions} [newState.pageOptions] - New page options to set
     * @property {Document[]} [newState.documents] - New documents array to set
     * @property {Document} [newState.selected] - New selected document to set
     * @property {string} [newState.next] - New next page URL to set
     * @property {string} [newState.previous] - New previous page URL to set
     */
>>>>>>> development
    public update(newState: Partial<ShellsData>): void {
        if (newState.pageOptions !== undefined) {
            this.pageOptions$.set(newState.pageOptions);
        }

        if (newState.documents) {
            this.documents$.set(newState.documents);
        }

        if (newState.selected) {
            this.selected$.set(newState.selected);
        }

        if (newState.next) {
            this.next$.set(newState.next);
        }

        if (newState.previous) {
            this.previous$.set(newState.previous);
        }
    }

<<<<<<< HEAD
    public save(): Observable<void> {
        return this.auth.setCookie(cookieName, JSON.stringify(this.data().pageOptions));
    }

=======
    /**
     * Saves the current page options to a cookie.
     *
     * @returns An Observable that resolves to void when the cookie has been set successfully.
     */
    public save(): Observable<void> {
        return this.auth.setCookie(cookieName, JSON.stringify(this.pageOptions$()));
    }

    /**
     * Retrieves the first page of documents based on the provided filter and limit.
     * If no filter is provided, uses the current untracked filter text.
     *
     * @param filter - Optional string to filter the documents
     * @param limit - Optional number to limit the amount of documents per page
     * @returns void
     *
     * @remarks
     * This method makes an API call to get documents with the following:
     * - No previous page reference (starts from beginning)
     * - Uses provided limit or falls back to untracked limit
     * - Applies language settings from translation service
     * - Pipes the result through setPageAndLoadContents
     */
>>>>>>> development
    public getFirstPage(filter?: string, limit?: number): void {
        if (filter === undefined) {
            filter = untracked(this.filterText);
        }

        this.api
            .getDocuments(
                {
                    previous: null,
                    limit: limit ?? untracked(this.limit),
                },
                filter,
                this.translate.getCurrentLang(),
            )
            .pipe(mergeMap(result => this.setPageAndLoadContents(result, limit, filter)))
            .subscribe();
    }

<<<<<<< HEAD
=======
    /**
     * Retrieves the next page of documents based on current pagination settings and filter criteria.
     * If no documents are currently available, the method returns without performing any operation.
     * The method makes an API call to fetch documents and processes the results by setting the page
     * and loading contents.
     *
     * @throws {Error} Potential errors from API call or content loading operations
     * @returns {void}
     */
>>>>>>> development
    public getNextPage(): void {
        const documents = untracked(this.documents);
        if (documents.length === 0) {
            return;
        }

        this.api
            .getDocuments(
                {
                    next: untracked(this.next),
                    limit: untracked(this.limit),
                },
                untracked(this.filterText),
                this.translate.getCurrentLang(),
            )
            .pipe(mergeMap(result => this.setPageAndLoadContents(result)))
            .subscribe();
    }

<<<<<<< HEAD
=======
    /**
     * Retrieves the last page of documents using the API.
     * Makes an API call with a null 'next' parameter and the current limit to get the final page.
     * The results are then processed to update the page and load contents.
     * Uses the current filter text and language settings.
     * @returns void
     */
>>>>>>> development
    public getLastPage(): void {
        this.api
            .getDocuments(
                {
                    next: null,
                    limit: untracked(this.limit),
                },
                untracked(this.filterText),
                this.translate.getCurrentLang(),
            )
            .pipe(mergeMap(result => this.setPageAndLoadContents(result)))
            .subscribe();
    }

<<<<<<< HEAD
=======
    /**
     * Retrieves the previous page of documents based on current pagination settings.
     * This method makes an API call to fetch documents using the current 'previous' cursor,
     * limit, filter text, and language settings. If there are no documents currently loaded,
     * the method returns early without making any requests.
     *
     * The retrieved documents are then processed through setPageAndLoadContents and the
     * results are subscribed to update the current state.
     *
     * @returns {void}
     */
>>>>>>> development
    public getPreviousPage(): void {
        const documents = untracked(this.documents);
        if (documents.length === 0) {
            return;
        }

        this.api
            .getDocuments(
                {
                    previous: untracked(this.previous),
                    limit: untracked(this.limit),
                },
                untracked(this.filterText),
                this.translate.getCurrentLang(),
            )
            .pipe(mergeMap(result => this.setPageAndLoadContents(result)))
            .subscribe();
    }

    private getFavorites(documents: AASDocument[]): void {
        this.update({ documents });
        from(documents)
            .pipe(
                mergeMap(document =>
                    this.api.getContent(document.id, document.endpoint).pipe(
                        catchError(() => of(undefined)),
                        map(content => this.setContent(document, content)),
                    ),
                ),
            )
            .subscribe();
    }

    private refreshPage(limit: number): void {
        if (untracked(this.documents).length === 0) {
            return;
        }

        this.api
            .getDocuments(
                {
                    next: this.getId(untracked(this.documents)[0]),
                    limit,
                },
                untracked(this.filterText),
                this.translate.currentLang,
            )
            .pipe(mergeMap(result => this.setPageAndLoadContents(result)))
            .subscribe();
    }

    private readonly updatePage = () => {
        const documents = untracked(this.documents);
        if (documents.length === 0) {
            return;
        }

        this.api
            .getDocuments(
                {
                    next: this.getId(documents[0]),
                    limit: untracked(this.limit),
                },
                untracked(this.filterText),
                this.translate.currentLang,
            )
            .pipe(
                mergeMap(result => {
                    return this.equal(documents, result.documents) ? EMPTY : this.setPageAndLoadContents(result);
                }),
            )
            .subscribe();
    };

    private equal(a: AASDocument[], b: AASDocument[]): boolean {
        if (b.length !== a.length) {
            return false;
        }

        let i = 0;
        for (const reference of b) {
            const document = a[i++];
            if (document.endpoint !== reference.endpoint || document.id !== reference.id) {
                return false;
            }
        }

        return true;
    }

    private getId(document: AASDocument): AASDocumentId {
        return { id: document.id, endpoint: document.endpoint };
    }

    private setPageAndLoadContents(result: AASPagedResult, limit?: number, filter?: string): Observable<void> {
        return concat(
            of(this.setPage(result, limit, filter)),
            from(result.documents).pipe(
                mergeMap(document =>
                    this.api.getContent(document.id, document.endpoint).pipe(
                        catchError(() => of(void 0)),
                        map(content => this.setContent(document, content)),
                    ),
                ),
            ),
        );
    }

    private setPage(result: AASPagedResult, limit: number | undefined, filterText: string | undefined): void {
        const newState: Partial<ShellsData> = {
            documents: result.documents,
            previous: result.previous,
            next: result.next,
        };

        if (limit !== undefined || filterText !== undefined) {
            if (limit === undefined) {
                limit = this.limit();
            }

            if (filterText === undefined) {
                filterText = this.filterText();
            }

            newState.pageOptions = {
                limit,
                filterText,
            };
        }

        this.update(newState);
    }

    private setContent(document: AASDocument, content: aas.Environment | null | undefined): void {
        const documents = [...this.documents()];
        const index = documents.findIndex(item => item.endpoint === document.endpoint && item.id === document.id);
        if (index >= 0) {
            documents[index] = { ...document, content };
        }

        this.update({ documents });
    }
}
