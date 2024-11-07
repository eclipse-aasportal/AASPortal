/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Injectable, signal } from '@angular/core';
import { AASDocument } from 'aas-core';
import { AuthService } from 'aas-lib';
import { first, Observable, map, mergeMap, of } from 'rxjs';

export interface FavoritesList {
    name: string;
    documents: AASDocument[];
}

@Injectable({
    providedIn: 'root',
})
export class FavoritesService {
    private readonly _lists = signal<FavoritesList[]>([]);

    public constructor(private readonly auth: AuthService) {
        this.auth.ready
            .pipe(
                first(ready => ready === true),
                mergeMap(() => this.auth.getCookie('.Favorites')),
                map(value => {
                    this._lists.set(value ? (JSON.parse(value) as FavoritesList[]) : []);
                }),
            )
            .subscribe();
    }

    public readonly lists = this._lists.asReadonly();

    public has(name: string): boolean {
        return this._lists().some(list => list.name === name);
    }

    public get(name: string): FavoritesList | undefined {
        return this._lists().find(list => list.name === name);
    }

    public add(documents: AASDocument[], name: string, newName?: string): Observable<void> {
        return of(this._lists()).pipe(
            map(lists => {
                const i = lists.findIndex(list => list.name === name);
                let list: FavoritesList;
                if (i < 0) {
                    list = { name, documents: [] };
                    lists.push(list);
                } else {
                    list = { ...lists[i], documents: [...lists[i].documents] };
                    lists[i] = list;
                }

                if (newName) {
                    list.name = newName;
                }

                for (const document of documents) {
                    if (!list.documents.some(item => item.endpoint === document.endpoint && item.id === document.id)) {
                        list.documents.push({ ...document, content: null });
                    }
                }

                return lists;
            }),
            mergeMap(lists => {
                return this.auth.setCookie('.Favorites', JSON.stringify(lists)).pipe(
                    map(() => {
                        this._lists.set(lists);
                    }),
                );
            }),
        );
    }

    public remove(documents: AASDocument[], name: string): Observable<void> {
        return of(this._lists()).pipe(
            map(lists => {
                const i = lists.findIndex(list => list.name === name);
                if (i < 0) {
                    throw new Error(`A favorites list "${name}" does not exists.`);
                }

                const list = { ...lists[i] };
                list.documents = list.documents.filter(favorite =>
                    documents.every(document => favorite.endpoint !== document.endpoint || favorite.id !== document.id),
                );

                lists[i] = list;

                return lists;
            }),
            mergeMap(lists => {
                return this.auth.setCookie('.Favorites', JSON.stringify(lists)).pipe(
                    map(() => {
                        this._lists.set(lists);
                    }),
                );
            }),
        );
    }

    public delete(name: string): Observable<void> {
        return of(this._lists()).pipe(
            map(lists => lists.filter(list => list.name !== name)),
            mergeMap(lists => {
                return (
                    lists.length > 0
                        ? this.auth.setCookie('.Favorites', JSON.stringify(lists))
                        : this.auth.deleteCookie('.Favorites')
                ).pipe(
                    map(() => {
                        this._lists.set(lists);
                    }),
                );
            }),
        );
    }
}
