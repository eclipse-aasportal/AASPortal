/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { computed, effect, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, from, map, mergeMap, Observable, of, skipWhile } from 'rxjs';
import { AASDocument, AASDocumentId } from 'aas-core';
import { AuthService, EndpointsApi, ViewMode } from 'aas-lib';
import { FavoritesService } from './favorites.service';

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
export class ShellsStore {
    private readonly state = signal(initialState);

    public constructor(
        private readonly auth: AuthService,
        private readonly favorites: FavoritesService,
        private readonly api: EndpointsApi,
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
            const active = this.favorites.active();
            if (active) {
                this.getFavorites(this.favorites.get(active)?.documents);
            } else {
                this.getFirstPage();
            }
        });
    }

    public readonly active = this.favorites.active;

    public readonly limit = computed(() => this.state().limit);

    public readonly filterText = computed(() => this.state().filterText);

    public readonly documents = signal<AASDocument[]>([]);

    public readonly selected = signal<AASDocument[]>([]);

    public readonly previous = signal<AASDocumentId | null>(null);

    public readonly next = signal<AASDocumentId | null>(null);

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
}
