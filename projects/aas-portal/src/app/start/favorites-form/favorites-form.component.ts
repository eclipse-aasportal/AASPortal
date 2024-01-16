/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AASDocument } from 'common';
import { FavoritesService } from '../favorites.service';
import { FavoritesFormStore, FavoritesItem } from './favorites-form.store';
import { Observable, first } from 'rxjs';

@Component({
    selector: 'fhg-favorites-form',
    templateUrl: './favorites-form.component.html',
    styleUrls: ['./favorites-form.component.css'],
    providers: [FavoritesFormStore],
})
export class FavoritesFormComponent {
    private _documents: AASDocument[] = [];

    public constructor(
        private readonly modal: NgbActiveModal,
        private readonly favorites: FavoritesService,
        private readonly store: FavoritesFormStore,
    ) {
        this.items = this.store.select(state => state.items);

        const items = favorites.lists.map(list => ({ name: list.name, id: list.name, selected: false, active: false }));
        items.sort((a, b) => a.name.localeCompare(b.name));
        items.push({ name: '', id: '', selected: false, active: false });
        this.store.setState(state => ({ ...state, items }));
    }

    public messages: string[] = [];

    public get documents(): AASDocument[] {
        return this._documents;
    }

    public set documents(values: AASDocument[]) {
        this._documents = values;
        if (values.length > 0) {
            this.store.ensureItemSelected();
        }
    }

    public readonly items: Observable<FavoritesItem[]>;

    public canDelete(item: FavoritesItem): boolean {
        return (item.active || item.selected) && this.favorites.has(item.id);
    }

    public inputName(item: FavoritesItem, value: string): void {
        item.name = value;
    }

    public selectedChange(item: FavoritesItem, value: boolean): void {
        this.store.setSelected(item, value);
    }

    public submit(): void {
        this.clearMessages();

        this.items.pipe(first()).subscribe(items => {
            const selectedItem = items.find(item => item.selected);
            if (selectedItem) {
                if (selectedItem.id || selectedItem.id === selectedItem.name) {
                    this.favorites.add(this.documents, selectedItem.name);
                } else {
                    this.favorites.add(this.documents, selectedItem.id, selectedItem.name);
                }

                this.modal.close();
            }
        });
    }

    public cancel(): void {
        this.modal.close();
    }

    public setActive(item: FavoritesItem, value: boolean): void {
        item.active = value;
    }

    private clearMessages(): void {
        if (this.messages.length > 0) {
            this.messages = [];
        }
    }
}
