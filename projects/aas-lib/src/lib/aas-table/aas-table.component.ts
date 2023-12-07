/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { AASDocument, equalArray } from 'common';
import { Observable, Subscription, map, mergeMap } from 'rxjs';

import { AASTableRow, AASTableFeatureState } from './aas-table.state';
import * as AASTableSelectors from './aas-table.selectors';
import * as AASTableActions from './aas-table.actions';
import { AASQuery } from '../types/aas-query-params';
import { ClipboardService } from '../clipboard.service';
import { WindowService } from '../window.service';
import { ViewMode } from '../types/view-mode';

@Component({
    selector: 'fhg-aas-table',
    templateUrl: './aas-table.component.html',
    styleUrls: ['./aas-table.component.scss']
})
export class AASTableComponent implements OnInit, OnChanges, OnDestroy {
    private readonly store: Store<AASTableFeatureState>;
    private readonly subscription: Subscription = new Subscription();
    private _selected: AASDocument[] = [];
    private shiftKey = false;
    private altKey = false;

    constructor(
        private readonly router: Router,
        store: Store,
        private readonly clipboard: ClipboardService,
        private readonly window: WindowService
    ) {
        this.store = store as Store<AASTableFeatureState>;
        this.rows = this.store.select(AASTableSelectors.selectRows);
        this.everySelected = this.store.select(AASTableSelectors.selectEverySelected);
        this.someSelected = this.store.select(AASTableSelectors.selectSomeSelected);

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

    public set selected(values: AASDocument[]) {
        if (!equalArray(this._selected, values)) {
            this._selected = values;
            this.store.dispatch(AASTableActions.setSelections({ documents: values }));
        }
    }

    public readonly someSelected: Observable<boolean>;

    public readonly everySelected: Observable<boolean>;

    public readonly rows: Observable<AASTableRow[]>;

    public ngOnInit(): void {
        this.subscription.add(this.store.select(AASTableSelectors.selectSelectedDocuments).pipe()
            .subscribe(documents => {
                this._selected = documents;
                this.selectedChange.emit(documents);
            }));
    }

    public ngOnChanges(changes: SimpleChanges): void {
        if (changes['viewMode'] || changes['documents']) {
            this.initialize();
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
            id: row.document.id,
            name: row.document.endpoint,
        };

        this.clipboard.set('AASQuery', query);
        this.router.navigateByUrl('/aas?format=AASQuery', { skipLocationChange: true });
    }

    public getToolTip(row: AASTableRow): string {
        return `${row.document.endpoint}, ${row.document.address}`;
    }

    public toggleSelected(row: AASTableRow): void {
        this.store.dispatch(AASTableActions.toggleSelected({ row, altKey: this.altKey, shiftKey: this.shiftKey }));
    }

    public toggleSelections(): void {
        this.store.dispatch(AASTableActions.toggleSelections());
    }

    private initialize(): void {
        if (this.viewMode != null && this.documents != null) {
            const viewMode = this.viewMode;
            this.subscription.add(this.documents.pipe(
                mergeMap(documents => viewMode.pipe(
                    map(viewMode => ({ viewMode, documents }))))).subscribe(tuple => {
                        if (tuple.viewMode === ViewMode.List) {
                            this.store.dispatch(AASTableActions.updateListView({ documents: tuple.documents }));
                        } else {
                            this.store.dispatch(AASTableActions.updateTreeView({ documents: tuple.documents }));
                        }
                    }));
        }
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