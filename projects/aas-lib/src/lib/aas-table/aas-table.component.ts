/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { AASDocument, equalArray } from 'common';
import { Observable, Subscription } from 'rxjs';

import { AASTableRow, AASTableFeatureState } from './aas-table.state';
import * as AASTableSelectors from './aas-table.selectors';
import * as AASTableActions from './aas-table.actions';
import { AASQuery } from '../types/aas-query-params';
import { ClipboardService } from '../clipboard.service';
import { WindowService } from '../window.service';
import { ViewMode } from '../types/view-mode';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'fhg-aas-table',
    templateUrl: './aas-table.component.html',
    styleUrls: ['./aas-table.component.scss'],
})
export class AASTableComponent implements OnInit, OnChanges, OnDestroy {
    private readonly store: Store<AASTableFeatureState>;
    private readonly subscription: Subscription = new Subscription();
    private _selected: AASDocument[] = [];
    private _filter: Observable<string> | null = null;
    private shiftKey = false;
    private altKey = false;

    public constructor(
        private readonly router: Router,
        private readonly translate: TranslateService,
        store: Store,
        private readonly clipboard: ClipboardService,
        private readonly window: WindowService,
    ) {
        this.store = store as Store<AASTableFeatureState>;
        this.rows = this.store.select(AASTableSelectors.selectRows(this.translate));
        this.everySelected = this.store.select(AASTableSelectors.selectEverySelected);
        this.someSelected = this.store.select(AASTableSelectors.selectSomeSelected);

        this.subscription.add(
            this.store
                .select(AASTableSelectors.selectSelectedDocuments)
                .pipe()
                .subscribe(values => (this._selected = values)),
        );

        this.window.addEventListener('keyup', this.keyup);
        this.window.addEventListener('keydown', this.keydown);
    }

    @Input()
    public viewMode: Observable<ViewMode> | null = null;

    @Input()
    public documents: Observable<AASDocument[]> | null = null;

    @Output()
    public selectedChange = new EventEmitter<AASDocument[]>();

    @Input()
    public get selected(): AASDocument[] {
        return this._selected;
    }

    @Input()
    public get filter(): Observable<string> | null {
        return this._filter;
    }

    public set filter(value: Observable<string> | null) {
        if (value !== this._filter) {
            this._filter = value;
            if (this._filter) {
                this.subscription.add(
                    this._filter.subscribe(value => this.store.dispatch(AASTableActions.setFilter({ filter: value }))),
                );
            }
        }
    }

    public set selected(values: AASDocument[]) {
        if (!equalArray(this._selected, values)) {
            this.store.dispatch(AASTableActions.setSelections({ documents: values }));
        }
    }

    public readonly someSelected: Observable<boolean>;

    public readonly everySelected: Observable<boolean>;

    public readonly rows: Observable<AASTableRow[]>;

    public ngOnInit(): void {
        this.subscription.add(
            this.store
                .select(AASTableSelectors.selectSelectedDocuments)
                .pipe()
                .subscribe(documents => {
                    this._selected = documents;
                    this.selectedChange.emit(documents);
                }),
        );
    }

    public ngOnChanges(changes: SimpleChanges): void {
        if (changes['viewMode'] && this.viewMode != null) {
            this.subscription.add(
                this.viewMode.subscribe(value => {
                    this.store.dispatch(AASTableActions.setViewMode({ viewMode: value }));
                }),
            );
        }

        if (changes['documents'] && this.documents != null) {
            this.subscription.add(
                this.documents.subscribe(values => {
                    this.store.dispatch(AASTableActions.updateView({ documents: values }));
                }),
            );
        }
    }

    public ngOnDestroy(): void {
        this.subscription.unsubscribe();
        this.window.removeEventListener('keyup', this.keyup);
        this.window.removeEventListener('keydown', this.keydown);
    }

    public expand(row: AASTableRow): void {
        this.store.dispatch(AASTableActions.expandRow({ row }));
    }

    public collapse(row: AASTableRow): void {
        this.store.dispatch(AASTableActions.collapseRow({ row }));
    }

    public open(row: AASTableRow): void {
        const query: AASQuery = {
            id: row.id,
            name: row.endpoint,
            document: row.document,
        };

        this.clipboard.set('AASQuery', query);
        this.router.navigateByUrl('/aas?format=AASQuery', { skipLocationChange: true });
    }

    public getToolTip(row: AASTableRow): string {
        return `${row.endpoint}, ${row.document.address}`;
    }

    public toggleSelected(row: AASTableRow): void {
        this.store.dispatch(AASTableActions.toggleSelected({ row, altKey: this.altKey, shiftKey: this.shiftKey }));
    }

    public toggleSelections(): void {
        this.store.dispatch(AASTableActions.toggleSelections());
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
