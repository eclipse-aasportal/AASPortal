/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Injectable, signal } from '@angular/core';
import { Observable, map, mergeMap, skipWhile } from 'rxjs';
import { AASDocument } from 'aas-core';
import { AuthService } from 'aas-lib';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export interface FavoritesList {
    name: string;
    documents: AASDocument[];
}

@Injectable({
    providedIn: 'root',
})
export class FavoritesService {
    private readonly lists$ = signal<FavoritesList[]>([]);

    public constructor(private readonly auth: AuthService) {
        this.auth.userId
            .pipe(
                skipWhile(userId => userId === undefined),
                takeUntilDestroyed(),
                mergeMap(() => this.auth.getCookie('.Favorites')),
                map(value => {
                    this.lists$.set(value ? (JSON.parse(value) as FavoritesList[]) : []);
                }),
            )
            .subscribe();
    }

    public readonly lists = this.lists$.asReadonly();

    public has(name: string): boolean {
        return this.lists$().some(list => list.name === name);
    }

    public get(name: string): FavoritesList | undefined {
        return this.lists$().find(list => list.name === name);
    }

    public add(documents: AASDocument[], name: string, newName?: string): void {
        return this.lists$.update(state => this.addFavorites(state, documents, name, newName));
    }

    public remove(documents: AASDocument[], name: string): void {
        this.lists$.update(state => this.removeFavorites(state, documents, name));
    }

    public delete(name: string): void {
        this.lists$.update(state => this.deleteFavoritesList(state, name));
    }

    public save(): Observable<void> {
        if (this.lists$().length === 0) {
            return this.auth.deleteCookie('.Favorites');
        }

        return this.auth.setCookie('.Favorites', JSON.stringify(this.lists$()));
    }

    private addFavorites(
        lists: FavoritesList[],
        documents: AASDocument[],
        name: string,
        newName: string | undefined,
    ): FavoritesList[] {
        const i = lists.findIndex(list => list.name === name);
        let list: FavoritesList;
        if (i < 0) {
            list = { name: newName || name, documents: documents.map(document => ({ ...document, content: null })) };
            return [...lists, list];
        }

        lists = [...lists];
        list = lists[i];
        list = { ...list, documents: [...list.documents] };
        lists[i] = list;

        if (newName) {
            list.name = newName;
        }

        for (const document of documents) {
            if (!list.documents.some(item => item.endpoint === document.endpoint && item.id === document.id)) {
                list.documents.push({ ...document, content: null });
            }
        }

        return lists;
    }

    private removeFavorites(lists: FavoritesList[], documents: AASDocument[], name: string): FavoritesList[] {
        return lists.map(list => {
            if (list.name !== name) {
                return list;
            }

            return {
                ...list,
                documents: list.documents.filter(favorite =>
                    documents.every(document => !this.equal(document, favorite)),
                ),
            };
        });
    }

    private equal(a: AASDocument, b: AASDocument): boolean {
        return a === b || (a.endpoint === b.endpoint && a.id === b.id);
    }

    private deleteFavoritesList(lists: FavoritesList[], name: string): FavoritesList[] {
        return lists.filter(list => list.name !== name);
    }
}
