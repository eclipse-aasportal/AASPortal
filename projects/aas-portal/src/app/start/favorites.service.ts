/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Injectable } from '@angular/core';
import { FavoritesList } from './start.state';
import { AASDocument } from 'common';
import { AuthService } from 'projects/aas-lib/src/public-api';

@Injectable({
    providedIn: 'root'
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

    public get(name: string): FavoritesList | undefined {
        return this._lists.find(list => list.name === name);
    }

    public delete(name: string): void {
        const index = this._lists.findIndex(list => list.name === name);
        if (index >= 0) {
            this._lists.splice(index, 1);
            this.auth.setCookie('.Favorites', JSON.stringify(this._lists));
        }
    }

    public add(documents: AASDocument[], name: string): void {
        let list = this._lists.find(list => list.name === name);
        if (!list) {
            list = { name, documents: [] };
            this._lists.push(list);
        }

        for (const document of documents) {
            if (!list.documents.some(item => item.endpoint === document.endpoint && item.id === document.id)) {
                list.documents.push({ ...document, content: null });
            }
        }

        this.auth.setCookie('.Favorites', JSON.stringify(this._lists));
    }

    public remove(documents: AASDocument[], name: string): void {
        const i = this._lists.findIndex(list => list.name === name);
        if (i < 0) return;

        const lists = [...this.lists];
        const list = { ...lists[i] };
        for (const document of documents) {
            const j = list.documents.findIndex(favorite => favorite.endpoint === document.endpoint &&
                favorite.id === document.id);

            if (j >= 0) {
                list.documents.splice(j, 1);
            }
        }

        this._lists = lists;
        this.auth.setCookie('.Favorites', JSON.stringify(this._lists));
    }
}