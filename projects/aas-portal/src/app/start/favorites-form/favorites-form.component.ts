/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AASDocument, ApplicationError, stringFormat } from 'common';
import { FavoritesService } from '../favorites.service';
import { first, from, map, mergeMap, of, tap } from 'rxjs';
import { messageToString } from 'aas-lib';
import { TranslateService } from '@ngx-translate/core';

interface FavoritesItem {
    selected: boolean;
    active: boolean;
    name: string;
    id: string;
    added: boolean;
    delete: boolean;
}

@Component({
    selector: 'fhg-favorites-form',
    templateUrl: './favorites-form.component.html',
    styleUrls: ['./favorites-form.component.css'],
})
export class FavoritesFormComponent {
    private _items: FavoritesItem[] = [];

    public constructor(
        private readonly modal: NgbActiveModal,
        private readonly favorites: FavoritesService,
        private readonly translate: TranslateService,
    ) {
        this.favorites.lists
            .pipe(
                first(),
                map(lists =>
                    lists.map(
                        list =>
                            ({
                                name: list.name,
                                id: list.name,
                                selected: false,
                                active: false,
                                delete: false,
                            }) as FavoritesItem,
                    ),
                ),
                map(items => {
                    if (items.length > 0) {
                        items.sort((a, b) => a.name.localeCompare(b.name));
                        items[0].selected = true;
                    } else {
                        items.push({
                            name: 'Favorites 1',
                            id: 'Favorites 1',
                            selected: true,
                            active: false,
                            added: false,
                            delete: false,
                        });
                    }

                    return items;
                }),
            )
            .subscribe(items => (this._items = items));
    }

    public messages: string[] = [];

    public documents: AASDocument[] = [];

    public get items(): FavoritesItem[] {
        return this._items.filter(item => item.delete === false);
    }

    public get text(): string {
        if (this.documents.length === 0) {
            return '';
        }

        if (this.documents.length === 1) {
            return this.translate.instant('TEXT_ADD_FAVORITE');
        }

        return stringFormat(this.translate.instant('TEXT_ADD_FAVORITES'), this.documents.length);
    }

    public delete(item: FavoritesItem): void {
        if (item.added) {
            this._items.splice(this._items.indexOf(item), 1);
        } else {
            item.delete = true;
        }
    }

    public addNew(): void {
        const name = this.uniqueName();
        this._items.forEach(i => (i.selected = false));
        this._items.push({
            name: name,
            id: name,
            selected: true,
            active: false,
            added: true,
            delete: false,
        });
    }

    public valueChanged(target: EventTarget | null, item: FavoritesItem): void {
        item.name = (target as HTMLInputElement).value;
    }

    public selected(target: EventTarget | null, item: FavoritesItem): void {
        if (!item.selected) {
            this._items.forEach(i => (i.selected = false));
            item.selected = (target as HTMLInputElement).checked;
        }
    }

    public submit(): void {
        this.clearMessages();

        of(this._items)
            .pipe(
                tap(items => this.checkNames(items)),
                mergeMap(items => from(items)),
                mergeMap(item => {
                    if (item.selected) {
                        if (item.id || item.id === item.name) {
                            return this.favorites.add(this.documents, item.name);
                        } else {
                            return this.favorites.add(this.documents, item.id, item.name);
                        }
                    } else if (item.delete) {
                        return this.favorites.delete(item.name);
                    }

                    return of(void 0);
                }),
            )
            .subscribe({
                complete: () => this.modal.close(),
                error: error => this.messages.push(messageToString(error, this.translate)),
            });
    }

    public cancel(): void {
        this.modal.close();
    }

    private uniqueName(): string {
        const set = new Set(this._items.map(item => item.name));
        for (let i = 1; i < Number.MAX_SAFE_INTEGER; i++) {
            const name = 'Favorites ' + i;
            if (!set.has(name)) {
                return name;
            }
        }

        throw new Error('Invalid operation.');
    }

    private checkNames(items: FavoritesItem[]): void {
        const set = new Set<string>();
        for (const item of items) {
            item.name = item.name.trim();

            if (!item.name) {
                throw new ApplicationError(`Invalid empty name.`, 'ERROR_INVALID_EMPTY_FAVORITES_LIST_NAME');
            }

            if (set.has(item.name)) {
                throw new ApplicationError(
                    `"${item.name}" is used several times.`,
                    'ERROR_FAVORITES_LIST_NAME_USED_SEVERAL_TIMES',
                    item.name,
                );
            }

            set.add(item.name);
        }
    }

    private clearMessages(): void {
        if (this.messages.length > 0) {
            this.messages = [];
        }
    }
}
