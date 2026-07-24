/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateDirective } from '@ngx-translate/core';
import { Component, WritableSignal, computed, effect, inject, input, model, signal, untracked } from '@angular/core';

import { AASDocument } from 'aas-core';

import { MaxLengthPipe } from '../../shared/pipes/max-length.pipe';
import { AASTableFilter } from './aas-table.filter';
import { encodeBase64Url } from '../../utilities';

/** Represents an item in the AASTable. */
export type AASTableItem = {
    name: string;
    id: string;
    endpoint: string;
    document: AASDocument;
    state: 'loaded' | 'unloaded' | 'unavailable';
    thumbnail: string | undefined;
    selected: WritableSignal<boolean>;
};

/**
 * Provides a table of AAS documents.
 */
@Component({
    selector: 'fhg-aas-table',
    templateUrl: './aas-table.html',
    styleUrls: ['./aas-table.scss'],
    imports: [FormsModule, MaxLengthPipe, TranslateDirective, RouterLink],
    providers: [AASTableFilter],
})
export class AASTable {
    private readonly filter = inject(AASTableFilter);
    private readonly items$ = computed(() => {
        const selected = new Set(untracked(this.selected));
        const documents = this.documents();
        return documents.map(document => this.createItem(document, selected.has(document)));
    });

    public constructor() {
        effect(() => {
            const selected = new Set(this.selected());
            untracked(this.items$).forEach(item => item.selected.set(selected.has(item.document)));
        });
    }

    public readonly selected = model<AASDocument[]>([]);

    public readonly documents = input<AASDocument[]>([]);

    public readonly expression = input('');

    public readonly items = computed(() => {
        const rows = this.items$();
        const expression = this.expression();
        if (expression) {
            this.filter.start(expression);
            return rows.filter(row => this.filter.match(row.document));
        }

        return rows;
    });

    public readonly someSelected = computed(() => {
        const rows = this.items();
        return rows.length > 0 && rows.some(row => row.selected()) && !rows.every(row => row.selected());
    });

    public readonly everySelected = computed(() => {
        const rows = this.items();
        return rows.length > 0 && rows.every(row => row.selected());
    });

    public getTrackId(item: AASTableItem): string {
        const content = item.document.content;
        const status: string = content ? 'loaded' : content === null ? 'unloaded' : 'unavailable';
        return `${item.endpoint}-${item.id}-${status}`;
    }

    public getRouterLink(row: AASTableItem): unknown[] | undefined {
        return ['/aas', { endpoint: encodeBase64Url(row.endpoint), id: encodeBase64Url(row.id) }];
    }

    public getToolTip(row: AASTableItem): string {
        return `${row.endpoint}, ${row.document.address}`;
    }

    public toggleSelected(value: boolean, row?: AASTableItem): void {
        if (row) {
            row.selected.set(value);
            this.selected.set(
                this.items$()
                    .filter(row => row.selected())
                    .map(row => row.document),
            );
        } else {
            if (this.items$().every(row => row.selected())) {
                this.items$().forEach(row => row.selected.set(false));
            } else {
                this.items$()
                    .filter(row => !row.selected())
                    .forEach(row => row.selected.set(true));
            }

            this.selected.set(
                this.items$()
                    .filter(row => row.selected())
                    .map(row => row.document),
            );
        }
    }

    private createItem(document: AASDocument, selected: boolean): AASTableItem {
        return {
            name: document.idShort,
            id: document.id,
            endpoint: document.endpoint,
            document,
            state: document.content ? 'loaded' : document.content === null ? 'unloaded' : 'unavailable',
            thumbnail: document.thumbnail ?? '/assets/resources/aas-idta.png',
            selected: signal(selected),
        };
    }
}
