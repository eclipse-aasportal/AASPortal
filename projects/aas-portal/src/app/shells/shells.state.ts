/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { computed, inject, Injectable, linkedSignal, signal, untracked } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { httpResource } from '@angular/common/http';
import { catchError, from, map, mergeMap, Observable, of, skipWhile, Subject, switchMap } from 'rxjs';
import { AASCursor, AASDocument, AASDocumentId, AASPagedResult } from 'aas-core';
import { AuthService, CookieService, encodeBase64Url, EndpointsApi } from 'aas-lib';
import { FavoritesService } from './favorites.service';

export type PageOptions = {
    limit: number;
    filterText: string;
};

export type ShellsData = {
    filterText: string;
    limit: number;
    selected: AASDocument[];
    position: { next: AASDocumentId | null | undefined; previous: AASDocumentId | null | undefined };
};

const cookieName = 'v1.Shells';

const initialData: ShellsData = {
    filterText: '',
    selected: [],
    limit: 10,
    position: { next: undefined, previous: null },
};

@Injectable({
    providedIn: 'root',
})
export class ShellsState {
    private readonly filterText$ = signal(initialData.filterText);
    private readonly cookies = inject(CookieService);
    private readonly auth = inject(AuthService);
    private readonly translate = inject(TranslateService);
    private readonly favorites = inject(FavoritesService);
    private readonly api = inject(EndpointsApi);
    private readonly limit$ = signal(initialData.limit);
    private readonly selected$ = signal(initialData.selected);
    private readonly position$ = signal(initialData.position);
    private readonly subject = new Subject<AASDocument[]>();

    private readonly resource = httpResource<AASPagedResult>(
        () => {
            const filter = this.filterText();
            const cursor: AASCursor = {
                limit: this.limit(),
                next: this.position().next,
                previous: this.position().previous,
            };
            let url = `/api/v1/documents?cursor=${encodeBase64Url(JSON.stringify(cursor))}`;
            if (filter) {
                url += `&filter=${encodeBase64Url(filter)}`;
                url += `&language=${this.translate.getCurrentLang()}`;
            }

            return url;
        },
        { defaultValue: { previous: null, next: null, documents: [] } },
    );

    public constructor() {
        this.auth.ready
            .pipe(
                skipWhile(ready => ready === false),
                takeUntilDestroyed(),
                mergeMap(() => this.cookies.getCookie(cookieName)),
            )
            .subscribe(value => {
                if (value) {
                    const { limit, filterText } = JSON.parse(value) as PageOptions;
                    this.update({ limit, filterText });
                }
            });

        this.subject
            .pipe(
                takeUntilDestroyed(),
                switchMap(documents => this.loadContents(documents)),
            )
            .subscribe(documents => {
                this.documents.set(documents);
            });
    }

    /**
     * The current pagination position, containing the next and previous document IDs for navigation.
     * The 'next' property is undefined when on the first page, null when on the last page, and contains a document ID when there are more pages available in that direction.
     */
    public readonly position = this.position$.asReadonly();

    /**
     * The current filter text used for searching documents.
     */
    public readonly filterText = this.filterText$.asReadonly();

    /**
     * The current limit for the number of documents to be displayed per page.
     */
    public readonly limit = this.limit$.asReadonly();

    /**
     * Indicates whether the pagination is currently on the first page.
     */
    public readonly isFirstPage = computed(() => !this.resource.hasValue() || this.resource.value().previous === null);

    /**
     * Indicates whether the pagination is currently on the last page.
     */
    public readonly isLastPage = computed(() => !this.resource.hasValue() || this.resource.value().next === null);

    /**
     * The list of documents currently loaded.
     */
    public readonly documents = linkedSignal(() => {
        const active = this.favorites.active();
        const documents = active
            ? (this.favorites.get(active)?.documents ?? [])
            : this.resource.hasValue()
              ? this.resource.value().documents
              : [];

        setTimeout(() => this.subject.next(documents), 0);

        return documents;
    });

    /**
     * The list of currently selected documents.
     */
    public readonly selected = this.selected$.asReadonly();

    /**
     * Updates the current state with the provided new state values. Only the properties that are defined
     * in the newState object will be updated, while the others will remain unchanged.
     * @param newState The new state values to update the current state with.
     */
    public update(newState: Partial<ShellsData>): void {
        if (newState.position !== undefined) {
            this.position$.set(newState.position);
        }

        if (newState.limit !== undefined) {
            this.limit$.set(newState.limit);
        }

        if (newState.filterText !== undefined) {
            this.filterText$.set(newState.filterText);
        }

        if (newState.selected) {
            this.selected$.set(newState.selected);
        }
    }

    /**
     * Saves the current page options to a cookie.
     *
     * @returns An Observable that resolves to void when the cookie has been set successfully.
     */
    public save(): Observable<void> {
        return this.cookies.setCookie(
            cookieName,
            JSON.stringify({
                limit: this.limit(),
                filterText: this.filterText(),
            }),
        );
    }

    /**
     * Retrieves the first page of AAS documents cuments per page
     * @returns void
     */
    public getFirstPage(): void {
        this.update({ position: { next: undefined, previous: null } });
    }

    /**
     * Retrieves the next page of documents based on current pagination settings and filter criteria.
     * If no documents are currently available, the method returns without performing any operation.
     * The method makes an API call to fetch documents and processes the results by setting the page
     * and loading contents.
     *
     * @throws {Error} Potential errors from API call or content loading operations
     * @returns {void}
     */
    public getNextPage(): void {
        if (this.resource.hasValue()) {
            this.update({ position: { next: this.resource.value().next, previous: undefined } });
        }
    }

    /**
     * Retrieves the last page of documents using the API.
     * Makes an API call with a null 'next' parameter and the current limit to get the final page.
     * The results are then processed to update the page and load contents.
     * Uses the current filter text and language settings.
     * @returns void
     */
    public getLastPage(): void {
        this.update({ position: { next: null, previous: undefined } });
    }

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
    public getPreviousPage(): void {
        if (this.resource.hasValue()) {
            this.update({ position: { next: undefined, previous: this.resource.value().previous } });
        }
    }

    private loadContents(documents: AASDocument[]): Observable<AASDocument[]> {
        return from(documents).pipe(
            mergeMap(document =>
                this.api.getContent(document.id, document.endpoint).pipe(
                    catchError(() => of(undefined)),
                    map(content => {
                        return untracked(this.documents).map(item => {
                            if (item === document) {
                                return { ...item, content };
                            }

                            return item;
                        });
                    }),
                ),
            ),
        );
    }
}
