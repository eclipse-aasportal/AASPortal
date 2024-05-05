/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { AASDocument } from 'common';
import { Subscription } from 'rxjs';

import { AASTableRow } from './aas-table-row';
import { ClipboardService } from '../clipboard.service';
import { WindowService } from '../window.service';
import { ViewMode } from '../types/view-mode';
import { TranslateService } from '@ngx-translate/core';
import { AASTableStore } from './aas-table.store';

@Component({
    selector: 'fhg-aas-table',
    templateUrl: './aas-table.component.html',
    styleUrls: ['./aas-table.component.scss'],
    providers: [AASTableStore],
})
export class AASTableComponent implements OnInit, OnDestroy {
    private readonly subscription = new Subscription();
    private shiftKey = false;
    private altKey = false;

    public constructor(
        private readonly router: Router,
        private readonly translate: TranslateService,
        private readonly store: AASTableStore,
        private readonly clipboard: ClipboardService,
        private readonly window: WindowService,
    ) {
        this.window.addEventListener('keyup', this.keyup);
        this.window.addEventListener('keydown', this.keydown);
    }

    @Input()
    public get viewMode(): ViewMode {
        return this.store.viewMode;
    }

    public set viewMode(value: ViewMode) {
        this.store.setViewMode(value);
    }

    @Input()
    public get documents(): AASDocument[] {
        return this.store.rows.map(row => row.element);
    }

    public set documents(values: AASDocument[]) {
        this.store.initialize(values);
    }

    @Output()
    public selectedChange = new EventEmitter<AASDocument[]>();

    @Input()
    public get selected(): AASDocument[] {
        return this.store.rows.filter(row => row.selected).map(row => row.element);
    }

    @Input()
    public get filter(): string {
        return this.store.filter;
    }

    public set filter(value: string) {
        this.store.filter = value;
    }

    public set selected(values: AASDocument[]) {
        this.store.setSelections(values);
    }

    public get someSelected(): boolean {
        const rows = this.store.rows;
        return rows.length > 0 && rows.some(row => row.selected) && !rows.every(row => row.selected);
    }

    public get everySelected(): boolean {
        const rows = this.store.rows;
        return rows.length > 0 && rows.every(row => row.selected);
    }

    public get rows(): AASTableRow[] {
        return this.store.rows;
    }

    public ngOnInit(): void {
        this.subscription.add(
            this.store.selectedDocuments.pipe().subscribe(documents => {
                this.selectedChange.emit(documents);
            }),
        );
    }

    public ngOnDestroy(): void {
        this.subscription.unsubscribe();
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
