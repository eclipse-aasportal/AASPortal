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

@Injectable({
    providedIn: 'root',
})
export class FavoritesService {
    private _lists: FavoritesList[];

    public constructor(private readonly auth: AuthService) {
        const value = auth.getCookie('.Favorites');
        this._lists = value ? JSON.parse(value) : [];
    }

    public get lists(): FavoritesList[] {
        return this._lists;
    }

    public has(name: string): boolean {
        return this._lists.some(list => list.name === name);
    }

    public get(name: string): FavoritesList | undefined {
        return this._lists.find(list => list.name === name);
    }

    public delete(name: string): void {
        this._lists = this._lists.filter(list => list.name !== name);
        this.auth.setCookie('.Favorites', JSON.stringify(this._lists));
    }

    public add(documents: AASDocument[], name: string, newName?: string): void {
        const i = this._lists.findIndex(list => list.name === name);
        const lists = [...this._lists];
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

        this._lists = lists;
        this.auth.setCookie('.Favorites', JSON.stringify(this._lists));
    }

    public remove(documents: AASDocument[], name: string): void {
        const i = this._lists.findIndex(list => list.name === name);
        if (i < 0) return;

        const lists = [...this.lists];
        const list = { ...lists[i] };
        list.documents = list.documents.filter(favorite =>
            documents.every(document => favorite.endpoint !== document.endpoint || favorite.id !== document.id),
        );

        this._lists = lists;
        this.auth.setCookie('.Favorites', JSON.stringify(this._lists));
    }
}