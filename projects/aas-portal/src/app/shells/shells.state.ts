/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { computed, effect, Injectable, OnDestroy, signal, untracked } from '@angular/core';
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
    private readonly data = signal(initialData);
    private readonly subscription = new Subscription();
    private readonly pageOptions$ = signal(initialData.pageOptions);
    private readonly documents$ = signal<AASDocument[]>(initialData.documents);
    private readonly selected$ = signal<AASDocument[]>(initialData.selected);
    private readonly previous$ = signal<AASDocumentId | null>(initialData.previous);
    private readonly next$ = signal<AASDocumentId | null>(initialData.next);

    public constructor(
        private readonly auth: AuthService,
        private readonly translate: TranslateService,
        private readonly favorites: FavoritesService,
        private readonly api: EndpointsApi,
        private readonly indexChange: IndexChangeService,
    ) {
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

    public readonly limit = computed(() => this.data().pageOptions.limit);

    public readonly filterText = computed(() => this.data().pageOptions.filterText);

    public readonly documents = this.documents$.asReadonly();

    public readonly selected = this.selected$.asReadonly();

    public readonly previous = this.previous$.asReadonly();

    public readonly next = this.next$.asReadonly();

    public ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

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

    public save(): Observable<void> {
        return this.auth.setCookie(cookieName, JSON.stringify(this.data().pageOptions));
    }

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
