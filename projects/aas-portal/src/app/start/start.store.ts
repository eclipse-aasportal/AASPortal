import { Injectable, computed, signal } from '@angular/core';
import { Observable, catchError, concat, from, map, mergeMap, of } from 'rxjs';
import { ViewMode } from 'aas-lib';
import { AASDocument, AASDocumentId, AASPagedResult, aas, equalArray } from 'aas-core';
import { StartApiService } from './start-api.service';
import { TranslateService } from '@ngx-translate/core';
import { FavoritesService } from './favorites.service';

@Injectable({
    providedIn: 'root',
})
export class StartStore {
    private readonly _viewMode = signal(ViewMode.Undefined);
    private readonly _filterText = signal('');
    private readonly _limit = signal(10);
    private readonly _previous = signal<AASDocumentId | null>(null);
    private readonly _next = signal<AASDocumentId | null>(null);
    private readonly _documents = signal<AASDocument[]>([], { equal: (a, b) => equalArray(a, b) });
    private readonly _activeFavorites = signal('');

    public constructor(
        private readonly api: StartApiService,
        private readonly translate: TranslateService,
        private readonly favorites: FavoritesService,
    ) {}

    public readonly viewMode = this._viewMode.asReadonly();

    public readonly documents = this._documents.asReadonly();

    public readonly favoritesLists = computed(() => ['', ...this.favorites.lists().map(list => list.name)]);

    public readonly activeFavorites = this._activeFavorites.asReadonly();

    public readonly limit = this._limit.asReadonly();

    public readonly filterText = this._filterText.asReadonly();

    public readonly selected = signal<AASDocument[]>([], { equal: (a, b) => equalArray(a, b) });

    public readonly filter = computed(() => {
        const filterText = this._filterText();
        return this._activeFavorites() ? filterText : '';
    });

    public readonly isFirstPage = computed(() => this._previous() === null);

    public readonly isLastPage = computed(() => this._next() === null);

    public setViewMode(viewMode: ViewMode): void {
        this._viewMode.set(viewMode);
        this._documents.set([]);
    }

    public addTree(nodes: AASDocument[]): void {
        this._documents.update(values => [...values, ...nodes]);
    }

    public setContent(document: AASDocument, content: aas.Environment | null | undefined): void {
        const documents = [...this._documents()];
        const index = documents.findIndex(item => item.endpoint === document.endpoint && item.id === document.id);
        if (index >= 0) {
            documents[index] = { ...document, content };
        }

        this._documents.set(documents);
    }

    public removeFavorites(favorites: AASDocument[]): void {
        if (!this._activeFavorites) {
            return;
        }

        const documents = this._documents().filter(document =>
            favorites.every(favorite => document.endpoint !== favorite.endpoint || document.id !== favorite.id),
        );

        this._documents.set(documents);
    }

    public setFilter(filter: string): void {
        this._filterText.set(filter);
        if (!this._activeFavorites()) {
            this.getFirstPage();
        }
    }

    public getFirstPage(filter?: string, limit?: number): void {
        if (!filter) {
            if (!this._activeFavorites()) {
                filter = this._filterText();
            }
        }

        this.api
            .getPage(
                {
                    previous: null,
                    limit: limit ?? this._limit(),
                },
                filter,
                this.translate.currentLang,
            )
            .pipe(mergeMap(page => this.setPageAndLoadContents(page, limit, filter)))
            .subscribe();
    }

    public getNextPage(): void {
        if (this._documents().length === 0) {
            return;
        }

        this.api
            .getPage(
                {
                    next: this.getId(this._documents()[this._documents().length - 1]),
                    limit: this._limit(),
                },
                this._filterText(),
                this.translate.currentLang,
            )
            .pipe(mergeMap(page => this.setPageAndLoadContents(page)))
            .subscribe();
    }

    public getLastPage() {
        this.api
            .getPage(
                {
                    next: null,
                    limit: this._limit(),
                },
                this._filterText(),
                this.translate.currentLang,
            )
            .pipe(mergeMap(page => this.setPageAndLoadContents(page)))
            .subscribe();
    }

    public getPreviousPage(): void {
        if (this._documents().length === 0) {
            return;
        }

        this.api
            .getPage(
                {
                    previous: this.getId(this._documents()[0]),
                    limit: this._limit(),
                },
                this._filterText(),
                this.translate.currentLang,
            )
            .pipe(mergeMap(page => this.setPageAndLoadContents(page)))
            .subscribe();
    }

    public refreshPage(): void {
        if (this._documents().length === 0) {
            return;
        }

        this.api
            .getPage(
                {
                    previous: this._previous(),
                    limit: this._limit(),
                },
                this._filterText(),
                this.translate.currentLang,
            )
            .pipe(mergeMap(page => this.setPageAndLoadContents(page)))
            .subscribe();
    }

    public setTreeView(documents: AASDocument[]): void {
        of(this.setViewMode(ViewMode.Tree))
            .pipe(
                mergeMap(() =>
                    from(documents).pipe(
                        mergeMap(document => this.api.getHierarchy(document.endpoint, document.id)),
                        mergeMap(nodes => this.addTreeAndLoadContents(nodes)),
                    ),
                ),
            )
            .subscribe();
    }

    public getFavorites(activeFavorites: string, documents: AASDocument[]): void {
        this._activeFavorites.set(activeFavorites);
        this._documents.set(documents);
        this._viewMode.set(ViewMode.List);
        from(documents)
            .pipe(
                mergeMap(document =>
                    this.api.getContent(document.endpoint, document.id).pipe(
                        catchError(() => of(undefined)),
                        map(content => this.setContent(document, content)),
                    ),
                ),
            )
            .subscribe();
    }

    private getId(document: AASDocument): AASDocumentId {
        return { id: document.id, endpoint: document.endpoint };
    }

    private setPageAndLoadContents(page: AASPagedResult, limit?: number, filter?: string): Observable<void> {
        return concat(
            of(this.setPage(page, limit, filter)),
            from(page.documents).pipe(
                mergeMap(document =>
                    this.api.getContent(document.endpoint, document.id).pipe(
                        catchError(() => of(undefined)),
                        map(content => this.setContent(document, content)),
                    ),
                ),
            ),
        );
    }

    private setPage(page: AASPagedResult, limit: number | undefined, filter: string | undefined): void {
        this._viewMode.set(ViewMode.List);
        this._activeFavorites.set('');
        this._documents.set(page.documents);
        this._previous.set(page.previous);
        this._next.set(page.next);
        if (limit) {
            this._limit.set(limit);
        }

        if (filter) {
            this._filterText.set(filter);
        }
    }

    private addTreeAndLoadContents(documents: AASDocument[]): Observable<void> {
        return concat(
            of(this.addTree(documents)),
            from(documents).pipe(
                mergeMap(document =>
                    this.api
                        .getContent(document.endpoint, document.id)
                        .pipe(map(content => this.setContent(document, content))),
                ),
            ),
        );
    }
}
