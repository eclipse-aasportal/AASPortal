import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';

export interface FavoritesItem {
    selected: boolean;
    active: boolean;
    name: string;
    id: string;
}

export interface FavoritesFormState {
    items: FavoritesItem[];
}

@Injectable()
export class FavoritesFormStore extends ComponentStore<FavoritesFormState> {
    public constructor() {
        super({ items: [] });
    }
}
