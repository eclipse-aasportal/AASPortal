/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Component, EventEmitter, Input, OnDestroy, Output, computed, effect } from '@angular/core';
import { Router } from '@angular/router';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { AASDocument } from 'common';

import { AASTableRow } from './aas-table-row';
import { ClipboardService } from '../clipboard.service';
import { WindowService } from '../window.service';
import { ViewMode } from '../types/view-mode';
import { AASTableStore } from './aas-table.store';
import { MaxLengthPipe } from '../max-length.pipe';

@Component({
    selector: 'fhg-aas-table',
    templateUrl: './aas-table.component.html',
    styleUrls: ['./aas-table.component.scss'],
    standalone: true,
    imports: [NgbTooltip, MaxLengthPipe, TranslateModule],
    providers: [AASTableStore],
})
export class AASTableComponent implements OnDestroy {
    private shiftKey = false;
    private altKey = false;

    public constructor(
        private readonly router: Router,
        private readonly store: AASTableStore,
        private readonly clipboard: ClipboardService,
        private readonly window: WindowService,
    ) {
        effect(() => {
            this.selectedChange.emit(this.store.selectedDocuments());
        });

        this.window.addEventListener('keyup', this.keyup);
        this.window.addEventListener('keydown', this.keydown);
    }

    @Input()
    public get viewMode(): ViewMode {
        return this.store.viewMode();
    }

    public set viewMode(value: ViewMode) {
        this.store.viewMode.set(value);
    }

    @Input()
    public get documents(): AASDocument[] {
        return this.store.rows().map(row => row.element);
    }

    public set documents(values: AASDocument[]) {
        this.store.initialize(values);
    }

    @Output()
    public selectedChange = new EventEmitter<AASDocument[]>();

    @Input()
    public get selected(): AASDocument[] {
        return this.store
            .rows()
            .filter(row => row.selected)
            .map(row => row.element);
    }

    public set selected(values: AASDocument[]) {
        this.store.setSelections(values);
    }

    @Input()
    public get filter(): string {
        return this.store.filterText();
    }

    public set filter(value: string) {
        this.store.filterText.set(value);
    }

    public readonly someSelected = computed(() => {
        const rows = this.store.rows();
        return rows.length > 0 && rows.some(row => row.selected) && !rows.every(row => row.selected);
    });

    public readonly everySelected = computed(() => {
        const rows = this.store.rows();
        return rows.length > 0 && rows.every(row => row.selected);
    });

    public readonly rows = this.store.rows;

    public ngOnDestroy(): void {
        this.window.removeEventListener('keyup', this.keyup);
        this.window.removeEventListener('keydown', this.keydown);
    }

    public expand(row: AASTableRow): void {
        this.store.expandRow(row);
    }

    public collapse(row: AASTableRow): void {
        this.store.collapseRow(row);
    }

    public open(row: AASTableRow): void {
        this.clipboard.set('AASDocument', row.element);
        this.router.navigate(['/aas'], {
            skipLocationChange: true,
            queryParams: {
                id: row.id,
                endpoint: row.endpoint,
            },
        });
    }

    public getToolTip(row: AASTableRow): string {
        return `${row.endpoint}, ${row.element.address}`;
    }

    public toggleSelected(row: AASTableRow): void {
        this.store.toggleSelected(row, this.altKey, this.shiftKey);
    }

    public toggleSelections(): void {
        this.store.toggleSelections();
    }

    private keyup = () => {
        this.shiftKey = false;
        this.altKey = false;
    };

    private keydown = (event: KeyboardEvent) => {
        this.shiftKey = event.shiftKey;
        this.altKey = event.altKey;
    };
}
