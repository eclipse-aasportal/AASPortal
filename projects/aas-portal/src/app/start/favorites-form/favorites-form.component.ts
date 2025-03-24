/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { NgbActiveModal, NgbToast } from '@ng-bootstrap/ng-bootstrap';
import { AASDocument, stringFormat } from 'aas-core';
import { FavoritesService } from '../favorites.service';
import { messageToString } from 'aas-lib';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

interface FavoritesItem {
    selected: boolean;
    active: boolean;
    name: string;
    id: string;
    length: number;
    added: boolean;
    delete: boolean;
}

@Component({
    selector: 'fhg-favorites-form',
    templateUrl: './favorites-form.component.html',
    styleUrls: ['./favorites-form.component.css'],
    imports: [NgbToast, TranslateModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FavoritesFormComponent {
    private _items = signal<FavoritesItem[]>([]);
    private _messages = signal<string[]>([]);

    public constructor(
        private readonly modal: NgbActiveModal,
        private readonly favorites: FavoritesService,
        private readonly translate: TranslateService,
    ) {
        const items = this.favorites
            .lists()
            .map(
                (list, index) =>
                    ({
                        name: list.name,
                        id: list.name,
                        length: list.documents.length,
                        selected: index === 0,
                        active: false,
                        delete: false,
                    }) as FavoritesItem,
            )
            .sort((a, b) => a.name.localeCompare(b.name));

        if (items.length === 0) {
            items.push({
                name: this.uniqueName(),
                id: '',
                selected: true,
                active: false,
                added: true,
                delete: false,
                length: 0,
            });
        }

        this._items.set(items);
    }

    public readonly messages = this._messages.asReadonly();

    public documents: AASDocument[] = [];

    public readonly items = computed(() => this._items().filter(item => item.delete === false));

    public readonly text = computed(() => {
        const selectedItem = this._items().find(item => item.selected);
        if (selectedItem === undefined) {
            return '';
        }

        if (this.documents.length === 0) {
            return stringFormat(this.translate.instant('FavoritesForm.COUNT'), selectedItem.length);
        }

        if (this.documents.length === 1) {
            return stringFormat(this.translate.instant('TEXT_ADD_FAVORITE'), selectedItem.length);
        }

        return stringFormat(this.translate.instant('TEXT_ADD_FAVORITES'), this.documents.length, selectedItem.length);
    });

    public delete(item: FavoritesItem): void {
        if (item.added) {
            this._items.update(items => items.filter(value => value !== item));
        } else {
            this._items.update(items => items.map(i => (i === item ? { ...i, delete: true } : i)));
        }
    }

    public addNew(): void {
        this._items.update(items => {
            items.forEach(i => (i.selected = false));
            return [
                ...items,
                {
                    name: this.uniqueName(),
                    id: '',
                    selected: true,
                    active: false,
                    added: true,
                    delete: false,
                    length: 0,
                },
            ];
        });
    }

    public valueChanged(target: EventTarget | null, item: FavoritesItem): void {
        item.name = (target as HTMLInputElement).value;
    }

    public selected(target: EventTarget | null, item: FavoritesItem): void {
        this._items.update(state =>
            state.map(i => {
                i.selected = i === item ? (target as HTMLInputElement).checked : false;
                return i;
            }),
        );
    }

    public submit(): void {
        this.clearMessages();
        this.checkNames();
        if (this.messages.length > 0) {
            return;
        }

        for (const item of this._items()) {
            if (item.delete) {
                this.favorites.delete(item.name);
            } else if (item.selected) {
                if (item.id !== item.name) {
                    this.favorites.add(this.documents, item.id, item.name);
                } else if (this.documents.length > 0) {
                    this.favorites.add(this.documents, item.id);
                }
            } else if (item.id !== item.name) {
                this.favorites.add([], item.id, item.name);
            }
        }

        this.favorites.save().subscribe({
            complete: () => this.modal.close(),
            error: error => this._messages.update(state => [...state, messageToString(error, this.translate)]),
        });
    }

    public cancel(): void {
        this.modal.close();
    }

    private uniqueName(): string {
        const set = new Set(this._items().map(item => item.name));
        for (let i = 1; i < Number.MAX_SAFE_INTEGER; i++) {
            const name = 'Favorites ' + i;
            if (!set.has(name)) {
                return name;
            }
        }

        throw new Error('Invalid operation.');
    }

    private checkNames(): void {
        const set = new Set<string>();
        for (const item of this._items()) {
            item.name = item.name.trim();
            if (!item.name) {
                this._messages.update(state => [
                    ...state,
                    this.translate.instant('FavoritesForm.ERROR_INVALID_EMPTY_FAVORITES_LIST_NAME'),
                ]);
            }

            if (set.has(item.name)) {
                this._messages.update(state => [
                    ...state,
                    stringFormat(
                        this.translate.instant('FavoritesForm.ERROR_FAVORITES_LIST_NAME_USED_SEVERAL_TIMES'),
                        item.name,
                    ),
                ]);
            }

            set.add(item.name);
        }
    }

    private clearMessages(): void {
        if (this._messages.length > 0) {
            this._messages.set([]);
        }
    }
}
