/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { computed, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, map, mergeMap, skipWhile } from 'rxjs';
import { AASDocument } from 'aas-core';
import { AuthService } from 'aas-lib';

export type FavoritesList = {
    name: string;
    documents: AASDocument[];
};

export type FavoritesState = { active: string; items: FavoritesList[] };

const cookieName = 'v2.Favorites';

@Injectable({ providedIn: 'root' })
export class FavoritesService {
    private readonly state$ = signal<FavoritesState>({ active: '', items: [] });

    public constructor(private readonly auth: AuthService) {
        this.auth.userId
            .pipe(
                skipWhile(userId => userId === undefined),
                takeUntilDestroyed(),
                mergeMap(() => this.auth.getCookie(cookieName)),
                map(value => {
                    if (value) {
                        this.state$.set(JSON.parse(value));
                    }
                }),
            )
            .subscribe();
    }

    public readonly items = computed(() => this.state$().items);

    public readonly active = computed(() => this.state$().active);

    public has(name: string): boolean {
        return this.state$().items.some(list => list.name === name);
    }

    public get(name: string): FavoritesList | undefined {
        return this.state$().items.find(list => list.name === name);
    }

    public add(documents: AASDocument[], name: string, newName?: string): void {
        return this.state$.update(state => this.addFavorites(state, documents, name, newName));
    }

    public remove(documents: AASDocument[], name: string): void {
        this.state$.update(state => this.removeFavorites(state, documents, name));
    }

    public delete(name: string): void {
        this.state$.update(state => this.deleteFavoritesList(state, name));
    }

    public setActive(name: string): void {
        this.state$.update(state => ({ ...state, active: name }));
    }

    public save(): Observable<void> {
        if (this.state$().items.length === 0) {
            return this.auth.deleteCookie(cookieName);
        }

        return this.auth.setCookie(cookieName, JSON.stringify(this.state$()));
    }

    private addFavorites(
        state: FavoritesState,
        documents: AASDocument[],
        name: string,
        newName: string | undefined,
    ): FavoritesState {
        const i = state.items.findIndex(list => list.name === name);
        let item: FavoritesList;
        if (i < 0) {
            item = { name: newName || name, documents: documents.map(document => ({ ...document, content: null })) };
            return { ...state, items: [...state.items, item] };
        }

        const items = [...state.items];
        item = items[i];
        item = { ...item, documents: [...item.documents] };
        items[i] = item;

        if (newName) {
            item.name = newName;
        }

        for (const document of documents) {
            if (!item.documents.some(item => item.endpoint === document.endpoint && item.id === document.id)) {
                item.documents.push({ ...document, content: null });
            }
        }

        return { ...state, items };
    }

    private removeFavorites(state: FavoritesState, documents: AASDocument[], name: string): FavoritesState {
        return {
            ...state,
            items: state.items.map(list => {
                if (list.name !== name) {
                    return list;
                }

                return {
                    ...list,
                    documents: list.documents.filter(favorite =>
                        documents.every(document => !this.equal(document, favorite)),
                    ),
                };
            }),
        };
    }

    private deleteFavoritesList(state: FavoritesState, name: string): FavoritesState {
        return {
            items: state.items.filter(list => list.name !== name),
            active: state.active === name ? '' : state.active,
        };
    }

    private equal(a: AASDocument, b: AASDocument): boolean {
        return a === b || (a.endpoint === b.endpoint && a.id === b.id);
    }
}
