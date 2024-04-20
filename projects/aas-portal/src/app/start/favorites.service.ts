/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Injectable } from '@angular/core';
import { FavoritesList } from './start.state';
import { AASDocument } from 'common';
import { AuthService } from 'aas-lib';
import { BehaviorSubject, Observable, first, map, mergeMap } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class FavoritesService {
    private readonly lists$ = new BehaviorSubject<FavoritesList[]>([]);

    public constructor(private readonly auth: AuthService) {
        this.auth.getCookie('.Favorites').subscribe(value => {
            this.lists$.next(value ? (JSON.parse(value) as FavoritesList[]) : []);
        });

        this.lists = this.lists$.asObservable();
    }

    public readonly lists: Observable<FavoritesList[]>;

    public has(name: string): boolean {
        return this.lists$.getValue().some(list => list.name === name);
    }

    public get(name: string): FavoritesList | undefined {
        return this.lists$.getValue().find(list => list.name === name);
    }

    public delete(name: string): Observable<void> {
        return this.lists$.pipe(
            first(),
            map(lists => lists.filter(list => list.name !== name)),
            map(lists => this.lists$.next(lists)),
            mergeMap(lists => this.auth.setCookie('.Favorites', JSON.stringify(lists))),
        );
    }

    public add(documents: AASDocument[], name: string, newName?: string): Observable<void> {
        return this.lists$.pipe(
            map(lists => [...lists]),
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
            map(lists => this.lists$.next(lists)),
            mergeMap(lists => this.auth.setCookie('.Favorites', JSON.stringify(lists))),
        );
    }

    public remove(documents: AASDocument[], name: string): Observable<void> {
        return this.lists$.pipe(
            map(lists => [...lists]),
            map(lists => {
                const i = lists.findIndex(list => list.name === name);
                if (i < 0) {
                    throw new Error(`A favorites list with the name "${name}" does not exists.`);
                }

                const list = { ...lists[i] };
                list.documents = list.documents.filter(favorite =>
                    documents.every(document => favorite.endpoint !== document.endpoint || favorite.id !== document.id),
                );

                return lists;
            }),
            map(lists => this.lists$.next(lists)),
            mergeMap(list => this.auth.setCookie('.Favorites', JSON.stringify(list))),
        );
    }
}
