/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
    ChangeDetectionStrategy,
    Component,
    Inject,
    WritableSignal,
    computed,
    effect,
    input,
    model,
    signal,
    untracked,
} from '@angular/core';

import { AASDocument } from 'aas-core';

import { MaxLengthPipe } from '../../pipes/max-length.pipe';
import { AASTableFilter } from './aas-table.filter';
import { encodeBase64Url } from '../../utilities';
import { WINDOW } from '../../services/window.service';

/** Represents an AASDocument in the AASTable. */
export class AASTableRow {
    public constructor(
        public readonly document: AASDocument,
        selected: boolean = false,
    ) {
        this.selected = signal(selected);
    }

    public readonly selected: WritableSignal<boolean>;

    public get trackId(): string {
        return this.document.endpoint + '.' + this.document.id;
    }

    public get id(): string {
        return this.document.id;
    }

    public get name(): string {
        return this.document.idShort;
    }

    public get thumbnail(): string {
        return this.document.thumbnail || '/assets/resources/aas.32.png';
    }

    public get endpoint(): string {
        return this.document.endpoint;
    }

    public get state(): 'loaded' | 'unloaded' | 'unavailable' {
        if (this.document.content === null) {
            return 'unloaded';
        }

        if (this.document.content) {
            return 'loaded';
        }

        return 'unavailable';
    }
}

/**
 * Provides a table of AAS documents.
 */
@Component({
    selector: 'fhg-aas-table',
    templateUrl: './aas-table.html',
    styleUrls: ['./aas-table.scss'],
    imports: [FormsModule, NgbTooltip, MaxLengthPipe, TranslateModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AASTable {
    private readonly _rows = computed(() => {
        const selected = new Set(untracked(this.selected));
        return this.documents().map(document => {
            const row = new AASTableRow(document, selected.has(document));
            return row;
        });
    });

    public constructor(
        private readonly router: Router,
        @Inject(WINDOW) private readonly window: Window,
        private readonly translate: TranslateService,
    ) {
        effect(() => {
            const selected = new Set(this.selected());
            untracked(this._rows).forEach(row => row.selected.set(selected.has(row.document)));
        });
    }

    public readonly documents = input<AASDocument[]>([]);

    public readonly selected = model<AASDocument[]>([]);

    public readonly filter = input('');

    public readonly rows = computed(() => {
        const rows = this._rows();
        const filterText = this.filter();
        if (filterText) {
            const filter = new AASTableFilter(filterText, this.translate.currentLang);
            return rows.filter(row => filter.match(row.document));
        }

        return rows;
    });

    public readonly someSelected = computed(() => {
        const rows = this.rows();
        return rows.length > 0 && rows.some(row => row.selected()) && !rows.every(row => row.selected());
    });

    public readonly everySelected = computed(() => {
        const rows = this.rows();
        return rows.length > 0 && rows.every(row => row.selected());
    });

    public open(row: AASTableRow): void {
        this.router.navigate(['/aas'], {
            queryParams: {
                endpoint: encodeBase64Url(row.endpoint),
                id: encodeBase64Url(row.id),
            },
            state: { data: JSON.stringify(row.document) },
        });
    }

    public getToolTip(row: AASTableRow): string {
        return `${row.endpoint}, ${row.document.address}`;
    }

    public toggleSelected(row: AASTableRow, value: boolean): void {
        row.selected.set(value);
        this.selected.set(
            this._rows()
                .filter(row => row.selected())
                .map(row => row.document),
        );
    }

    public toggleSelections(): void {
        if (this._rows().every(row => row.selected())) {
            this._rows().forEach(row => row.selected.set(false));
        } else {
            this._rows()
                .filter(row => !row.selected())
                .forEach(row => row.selected.set(true));
        }

        this.selected.set(
            this._rows()
                .filter(row => row.selected())
                .map(row => row.document),
        );
    }
}
