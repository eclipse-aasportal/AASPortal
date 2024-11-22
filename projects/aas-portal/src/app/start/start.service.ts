/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable, catchError, concat, from, map, mergeMap, of } from 'rxjs';
import { ViewMode } from 'aas-lib';
import { AASDocument, AASDocumentId, AASPagedResult, aas } from 'aas-core';
import { StartApiService } from './start-api.service';
import { StartStore } from './start.store';
import { FavoritesService } from './favorites.service';

@Injectable()
export class StartService {
    public constructor(
        private readonly store: StartStore,
        private readonly api: StartApiService,
        private readonly favorites: FavoritesService,
        private readonly translate: TranslateService,
    ) {}

    public setActiveFavorites(name: string) {
        this.store.activeFavorites$.set(name);
        this.store.selected$.set([]);

        const viewMode = this.store.viewMode;
        if (viewMode === ViewMode.List) {
            const name = this.store.activeFavorites;
            const favorites = this.favorites.get(name);
            if (favorites) {
                this.getFavorites(favorites.name, favorites.documents);
            } else {
                this.getFirstPage();
            }
        } else if (viewMode === ViewMode.Tree) {
            this.getTreeView(this.store.selected);
        }
    }

    public setViewMode(viewMode: ViewMode) {
        this.store.documents$.set([]);
        this.store.viewMode$.set(viewMode);
        if (viewMode === ViewMode.List) {
            const name = this.store.activeFavorites;
            const favorites = this.favorites.get(name);
            if (favorites) {
                this.getFavorites(favorites.name, favorites.documents);
            } else {
                this.getFirstPage();
            }
        } else if (viewMode === ViewMode.Tree) {
            this.getTreeView(this.store.selected);
        }
    }

    public removeFavorites(favorites: AASDocument[]): void {
        if (!this.store.activeFavorites) {
            return;
        }

        const documents = this.store
            .documents$()
            .filter(document =>
                favorites.every(favorite => document.endpoint !== favorite.endpoint || document.id !== favorite.id),
            );

        this.store.documents$.set(documents);
    }

    public getFirstPage(filter?: string, limit?: number): void {
        if (filter === undefined) {
            filter = this.store.filterText;
        }

        this.api
            .getPage(
                {
                    previous: null,
                    limit: limit ?? this.store.limit,
                },
                filter,
                this.translate.currentLang,
            )
            .pipe(mergeMap(page => this.setPageAndLoadContents(page, limit, filter)))
            .subscribe();
    }

    public getNextPage(): void {
        const documents = this.store.documents;
        if (documents.length === 0) {
            return;
        }

        this.api
            .getPage(
                {
                    next: this.getId(documents[documents.length - 1]),
                    limit: this.store.limit,
                },
                this.store.filterText,
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
                    limit: this.store.limit,
                },
                this.store.filterText,
                this.translate.currentLang,
            )
            .pipe(mergeMap(page => this.setPageAndLoadContents(page)))
            .subscribe();
    }

    public getPreviousPage(): void {
        const documents = this.store.documents;
        if (documents.length === 0) {
            return;
        }

        this.api
            .getPage(
                {
                    previous: this.getId(documents[0]),
                    limit: this.store.limit,
                },
                this.store.filterText,
                this.translate.currentLang,
            )
            .pipe(mergeMap(page => this.setPageAndLoadContents(page)))
            .subscribe();
    }

    public refreshPage(): void {
        if (this.store.documents.length === 0) {
            return;
        }

        this.api
            .getPage(
                {
                    previous: this.store.previous,
                    limit: this.store.limit,
                },
                this.store.filterText,
                this.translate.currentLang,
            )
            .pipe(mergeMap(page => this.setPageAndLoadContents(page)))
            .subscribe();
    }

    private getFavorites(activeFavorites: string, documents: AASDocument[]): void {
        this.store.activeFavorites$.set(activeFavorites);
        this.store.documents$.set(documents);
        this.store.viewMode$.set(ViewMode.List);
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

    private getTreeView(documents: AASDocument[]): void {
        from(documents)
            .pipe(
                mergeMap(document => this.api.getHierarchy(document.endpoint, document.id)),
                mergeMap(nodes => this.addTreeAndLoadContents(nodes)),
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
        this.store.viewMode$.set(ViewMode.List);
        this.store.activeFavorites$.set('');
        this.store.documents$.set(page.documents);
        this.store.previous$.set(page.previous);
        this.store.next$.set(page.next);
        if (limit !== undefined) {
            this.store.limit$.set(limit);
        }

        if (filter !== undefined) {
            this.store.filterText$.set(filter);
        }
    }

    private addTreeAndLoadContents(documents: AASDocument[]): Observable<void> {
        this.store.documents$.update(state => [...state, ...documents]);
        return from(documents).pipe(
            mergeMap(document =>
                this.api
                    .getContent(document.endpoint, document.id)
                    .pipe(map(content => this.setContent(document, content))),
            ),
        );
    }

    private setContent(document: AASDocument, content: aas.Environment | null | undefined): void {
        this.store.documents$.update(state => {
            const documents = [...state];
            const index = documents.findIndex(item => item.endpoint === document.endpoint && item.id === document.id);
            if (index >= 0) {
                documents[index] = { ...document, content };
            }

            return documents;
        });
    }
}
