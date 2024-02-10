/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

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

    public ensureItemSelected(): void {
        this.setState(state => {
            if (state.items.length === 0) {
                return state;
            }

            const items = [...state.items];
            if (state.items.every(item => item.selected === false)) {
                items[0] = { ...items[0], selected: true };
            }

            return { ...state, items };
        });
    }

    public setSelected(item: FavoritesItem, value: boolean): void {
        this.setState(state => {
            const items = [...state.items];
            for (let i = 0; i < items.length; i++) {
                if (items[i] === item) {
                    items[i] = { ...items[i], selected: value };
                } else if (items[i].selected) {
                    items[i] = { ...items[i], selected: false };
                }
            }

            return { ...state, items };
        });
    }
}
