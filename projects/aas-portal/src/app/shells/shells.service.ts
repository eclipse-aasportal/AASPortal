/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { effect, untracked, Injectable, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { EMPTY, Observable, Subscription, catchError, concat, from, map, mergeMap, of } from 'rxjs';
import { IndexChangeService, ViewMode } from 'aas-lib';
import { AASDocument, AASDocumentId, AASPagedResult, aas } from 'aas-core';
import { ShellsApiService } from './shells-api.service';
import { ShellsStore } from './shells.store';
import { FavoritesService } from './favorites.service';

@Injectable()
export class ShellsService implements OnDestroy {
    private readonly subscription = new Subscription();

    public constructor(
        private readonly store: ShellsStore,
        private readonly api: ShellsApiService,
        private readonly favorites: FavoritesService,
        private readonly translate: TranslateService,
        private readonly indexChange: IndexChangeService,
    ) {
        effect(() => {
            this.refreshPage(this.store.limit());
        });

        effect(() => {
            this.setViewMode(this.store.viewMode());
        });

        effect(() => {
            this.setActiveFavorites(this.favorites.active());
        });

        this.subscription.add(this.indexChange.message.subscribe(this.updatePage));
    }

    public ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    public removeFavorites(favorites: AASDocument[]): void {
        if (!this.favorites.active()) {
            return;
        }

        const documents = this.store
            .documents()
            .filter(document =>
                favorites.every(favorite => document.endpoint !== favorite.endpoint || document.id !== favorite.id),
            );

        this.store.documents.set(documents);
    }

    public getFirstPage(filter?: string, limit?: number): void {
        if (filter === undefined) {
            filter = untracked(this.store.filterText);
        }

        this.api
            .getPage(
                {
                    previous: null,
                    limit: limit ?? untracked(this.store.limit),
                },
                filter,
                this.translate.currentLang,
            )
            .pipe(mergeMap(result => this.setPageAndLoadContents(result, limit, filter)))
            .subscribe();
    }

    public getNextPage(): void {
        const documents = untracked(this.store.documents);
        if (documents.length === 0) {
            return;
        }

        this.api
            .getPage(
                {
                    next: untracked(this.store.next),
                    limit: untracked(this.store.limit),
                },
                untracked(this.store.filterText),
                this.translate.currentLang,
            )
            .pipe(mergeMap(result => this.setPageAndLoadContents(result)))
            .subscribe();
    }

    public getLastPage(): void {
        this.api
            .getPage(
                {
                    next: null,
                    limit: untracked(this.store.limit),
                },
                untracked(this.store.filterText),
                this.translate.currentLang,
            )
            .pipe(mergeMap(result => this.setPageAndLoadContents(result)))
            .subscribe();
    }

    public getPreviousPage(): void {
        const documents = untracked(this.store.documents);
        if (documents.length === 0) {
            return;
        }

        this.api
            .getPage(
                {
                    previous: untracked(this.store.previous),
                    limit: untracked(this.store.limit),
                },
                untracked(this.store.filterText),
                this.translate.currentLang,
            )
            .pipe(mergeMap(result => this.setPageAndLoadContents(result)))
            .subscribe();
    }

    private setViewMode(viewMode: ViewMode): void {
        if (viewMode === ViewMode.List) {
            this.store.selected.set([]);
            const favorites = this.favorites.get(this.favorites.active());
            if (favorites) {
                this.getFavorites(favorites.documents);
            } else {
                this.getFirstPage();
            }
        } else if (viewMode === ViewMode.Tree) {
            this.store.documents.set([]);
            this.getTreeView(this.store.selected());
        }
    }

    private setActiveFavorites(name: string): void {
        this.store.selected.set([]);
        const favorites = this.favorites.get(name);
        if (favorites) {
            this.getFavorites(favorites.documents);
        } else {
            this.getFirstPage();
        }
    }

    private refreshPage(limit: number): void {
        if (untracked(this.store.documents).length === 0) {
            return;
        }

        this.api
            .getPage(
                {
                    next: this.getId(untracked(this.store.documents)[0]),
                    limit,
                },
                untracked(this.store.filterText),
                this.translate.currentLang,
            )
            .pipe(mergeMap(result => this.setPageAndLoadContents(result)))
            .subscribe();
    }

    private readonly updatePage = () => {
        const documents = untracked(this.store.documents);
        if (documents.length === 0) {
            return;
        }

        this.api
            .getPage(
                {
                    next: this.getId(documents[0]),
                    limit: untracked(this.store.limit),
                },
                untracked(this.store.filterText),
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

    private getFavorites(documents: AASDocument[]): void {
        this.store.documents.set(documents);
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

    private setPageAndLoadContents(result: AASPagedResult, limit?: number, filter?: string): Observable<void> {
        return concat(
            of(this.setPage(result, limit, filter)),
            from(result.documents).pipe(
                mergeMap(document =>
                    this.api.getContent(document.endpoint, document.id).pipe(
                        catchError(() => of(void 0)),
                        map(content => this.setContent(document, content)),
                    ),
                ),
            ),
        );
    }

    private setPage(result: AASPagedResult, limit: number | undefined, filter: string | undefined): void {
        this.store.documents.set(result.documents);
        this.store.previous.set(result.previous);
        this.store.next.set(result.next);
        this.store.update(limit, filter);
    }

    private addTreeAndLoadContents(documents: AASDocument[]): Observable<void> {
        this.store.documents.update(state => [...state, ...documents]);
        return from(documents).pipe(
            mergeMap(document =>
                this.api
                    .getContent(document.endpoint, document.id)
                    .pipe(map(content => this.setContent(document, content))),
            ),
        );
    }

    private setContent(document: AASDocument, content: aas.Environment | null | undefined): void {
        this.store.documents.update(state => {
            const documents = [...state];
            const index = documents.findIndex(item => item.endpoint === document.endpoint && item.id === document.id);
            if (index >= 0) {
                documents[index] = { ...document, content };
            }

            return documents;
        });
    }
}
