/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { computed, effect, Injectable, OnDestroy, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, concat, EMPTY, from, map, mergeMap, Observable, of, skipWhile, Subscription } from 'rxjs';
import { aas, AASDocument, AASDocumentId, AASPagedResult } from 'aas-core';
import { AuthService, EndpointsApi, IndexChangeService, ViewMode } from 'aas-lib';
import { FavoritesService } from './favorites.service';
import { TranslateService } from '@ngx-translate/core';

type ShellsState = {
    limit: number;
    filterText: string;
};

const cookieName = 'v1.Shells';

const initialState: ShellsState = {
    limit: 10,
    filterText: '',
};

@Injectable({
    providedIn: 'root',
})
export class ShellsService implements OnDestroy {
    private readonly state = signal(initialState);
    private readonly subscription = new Subscription();

    public constructor(
        private readonly auth: AuthService,
        private readonly translate: TranslateService,
        private readonly favorites: FavoritesService,
        private readonly api: EndpointsApi,
        private readonly indexChange: IndexChangeService,
    ) {
        this.auth.userId
            .pipe(
                skipWhile(userId => userId === undefined),
                takeUntilDestroyed(),
                mergeMap(() => this.auth.getCookie(cookieName)),
            )
            .subscribe(value => {
                if (value) {
                    this.state.set(JSON.parse(value));
                } else {
                    this.state.update(state => ({ ...state, viewMode: ViewMode.List }));
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

    public readonly limit = computed(() => this.state().limit);

    public readonly filterText = computed(() => this.state().filterText);

    public readonly documents = signal<AASDocument[]>([]);

    public readonly selected = signal<AASDocument[]>([]);

    public readonly previous = signal<AASDocumentId | null>(null);

    public readonly next = signal<AASDocumentId | null>(null);

    public ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    public setLimit(limit: number): void {
        this.state.update(state => ({ ...state, limit }));
    }

    public setFilterText(value: string): void {
        this.state.update(state => ({ ...state, value }));
    }

    public update(limit: number | undefined, filterText: string | undefined): void {
        this.state.update(state => ({
            ...state,
            limit: limit ?? state.limit,
            filterText: filterText ?? state.filterText,
        }));
    }

    public save(): Observable<void> {
        return this.auth.setCookie(cookieName, JSON.stringify(this.state()));
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
                this.translate.currentLang,
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
                this.translate.currentLang,
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
                this.translate.currentLang,
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
                this.translate.currentLang,
            )
            .pipe(mergeMap(result => this.setPageAndLoadContents(result)))
            .subscribe();
    }

    public removeFavorites(favorites: AASDocument[]): void {
        if (!this.favorites.active()) {
            return;
        }

        const documents = this.documents().filter(document =>
            favorites.every(favorite => document.endpoint !== favorite.endpoint || document.id !== favorite.id),
        );

        this.documents.set(documents);
    }

    private getFavorites(documents: AASDocument[]): void {
        this.documents.set(documents);
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

    private setPage(result: AASPagedResult, limit: number | undefined, filter: string | undefined): void {
        this.documents.set(result.documents);
        this.previous.set(result.previous);
        this.next.set(result.next);
        this.update(limit, filter);
    }

    private setContent(document: AASDocument, content: aas.Environment | null | undefined): void {
        this.documents.update(state => {
            const documents = [...state];
            const index = documents.findIndex(item => item.endpoint === document.endpoint && item.id === document.id);
            if (index >= 0) {
                documents[index] = { ...document, content };
            }

            return documents;
        });
    }
}
