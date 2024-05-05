import { Injectable } from '@angular/core';
import { Observable, catchError, concat, from, map, mergeMap, of } from 'rxjs';
import { ViewMode } from 'aas-lib';
import { AASDocument, AASDocumentId, AASPage, aas } from 'common';
import { StartApiService } from './start-api.service';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
    providedIn: 'root',
})
export class StartStore {
    private _viewMode = ViewMode.Undefined;
    private _filterText = '';
    private _limit = 10;
    private _previous: AASDocumentId | null = null;
    private _next: AASDocumentId | null = null;
    private _totalCount = 0;
    private _documents: AASDocument[] = [];
    private _activeFavorites = '';

    public constructor(
        private readonly api: StartApiService,
        private readonly translate: TranslateService,
    ) {}

    public get viewMode(): ViewMode {
        return this._viewMode;
    }

    public get documents(): AASDocument[] {
        return this._documents;
    }

    public get activeFavorites(): string {
        return this._activeFavorites;
    }

    public get limit(): number {
        return this._limit;
    }

    public get filterText(): string {
        return this._filterText;
    }

    public get isFirstPage(): boolean {
        return this._previous === null;
    }

    public get isLastPage(): boolean {
        return this._next === null;
    }

    public setViewMode(viewMode: ViewMode): void {
        this._viewMode = viewMode;
        this._documents = [];
    }

    public addTree(nodes: AASDocument[]): void {
        this._documents = [...this._documents, ...nodes];
    }

    public setContent(document: AASDocument, content: aas.Environment | null | undefined): void {
        const documents = [...this._documents];
        const index = documents.findIndex(item => item.endpoint === document.endpoint && item.id === document.id);
        if (index >= 0) {
            documents[index] = { ...document, content };
        }

        this._documents = documents;
    }

    public removeFavorites(favorites: AASDocument[]): void {
        if (!this._activeFavorites) {
            return;
        }

        const documents = this._documents.filter(document =>
            favorites.every(favorite => document.endpoint !== favorite.endpoint || document.id !== favorite.id),
        );

        this._documents = documents;
    }

    public setFilter(filter: string): void {
        this._filterText = filter;
    }

    public getFirstPage(filter?: string, limit?: number): void {
        this.api
            .getPage(
                {
                    previous: null,
                    limit: limit ?? this._limit,
                },
                filter ?? this._filterText,
                this.translate.currentLang,
            )
            .pipe(mergeMap(page => this.setPageAndLoadContents(page, limit, filter)))
            .subscribe();
    }

    public getNextPage(): void {
        if (this._documents.length === 0) {
            return;
        }

        this.api
            .getPage(
                {
                    next: this.getId(this._documents[this._documents.length - 1]),
                    limit: this._limit,
                },
                this._filterText,
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
                    limit: this._limit,
                },
                this._filterText,
                this.translate.currentLang,
            )
            .pipe(mergeMap(page => this.setPageAndLoadContents(page)))
            .subscribe();
    }

    public getPreviousPage(): void {
        if (this._documents.length === 0) {
            return;
        }

        this.api
            .getPage(
                {
                    previous: this.getId(this._documents[0]),
                    limit: this._limit,
                },
                this._filterText,
                this.translate.currentLang,
            )
            .pipe(mergeMap(page => this.setPageAndLoadContents(page)))
            .subscribe();
    }

    public refreshPage(): void {
        if (this._documents.length === 0) {
            return;
        }

        this.api
            .getPage(
                {
                    previous: this._previous,
                    limit: this._limit,
                },
                this._filterText,
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
        this._activeFavorites = activeFavorites;
        this._documents = documents;
        this._viewMode = ViewMode.List;
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

    private setPageAndLoadContents(page: AASPage, limit?: number, filter?: string): Observable<void> {
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

    private setPage(page: AASPage, limit: number | undefined, filter: string | undefined): void {
        this._viewMode = ViewMode.List;
        this._activeFavorites = '';
        this._documents = page.documents;
        this._previous = page.previous;
        this._next = page.next;
        if (limit) {
            this._limit = limit;
        }

        if (filter) {
            this._filterText = filter;
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
