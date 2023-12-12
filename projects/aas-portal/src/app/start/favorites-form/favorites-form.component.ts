/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from "@ngx-translate/core";
import { AASDocument } from 'common';
import { FavoritesService } from '../favorites.service';

interface FavoritesItem {
    selected: boolean;
    active: boolean;
    name: string;
}

@Component({
    selector: 'fhg-favorites-form',
    templateUrl: './favorites-form.component.html',
    styleUrls: ['./favorites-form.component.css']
})
export class FavoritesFormComponent {
    public constructor(
        private modal: NgbActiveModal,
        private favorites: FavoritesService,
        private translate: TranslateService,
    ) {
        this.items = favorites.lists.map(list => ({ name: list.name, selected: false, active: false }));
        this.items.push({ name: '', selected: false, active: false });
    }

    public messages: string[] = [];

    public documents: AASDocument[] = [];

    public readonly items: FavoritesItem[];

    public canSelect(item: FavoritesItem): boolean {
        return true;
    }

    public inputName(item: FavoritesItem, value: string): void {
        item.name = value;
    }

    public selectedChange(item: FavoritesItem, value: boolean): void {
        item.selected = value;
    }

    public submit(): void {
        this.clearMessages();

        if (this.documents.length > 0) {
            const selectedItem = this.items.find(item => item.selected);
            if (selectedItem) {
                this.favorites.add(this.documents, selectedItem.name);
                this.modal.close();
            }
        }
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