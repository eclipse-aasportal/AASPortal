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
import { AASDocument } from 'common';
import { Observable, Subscription } from 'rxjs';

import { ViewMode } from '../types/view-mode';
import { AASTableRow, AASTableFeatureState } from './aas-table.state';
import * as AASTableSelectors from './aas-table.selectors';
import * as AASTableActions from './aas-table.actions';
import { AASQuery } from '../types/aas-query-params';
import { ClipboardService } from '../clipboard.service';
import { WindowService } from '../window.service';

@Component({
    selector: 'fhg-aas-table',
    templateUrl: './aas-table.component.html',
    styleUrls: ['./aas-table.component.scss']
})
export class AASTableComponent implements OnInit, OnChanges, OnDestroy {
    private readonly store: Store<AASTableFeatureState>;
    private readonly subscription: Subscription = new Subscription();
    private _filter = '';
    private _limit = 10;
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
        this.isFirstPage = this.store.select(AASTableSelectors.selectIsFirstPage);
        this.isLastPage = this.store.select(AASTableSelectors.selectIsLastPage);
        this.totalCount = this.store.select(AASTableSelectors.selectTotalCount);
        this.everySelected = this.store.select(AASTableSelectors.selectEverySelected);
        this.someSelected = this.store.select(AASTableSelectors.selectSomeSelected);

        this.subscription.add(this.store.select(AASTableSelectors.selectSelectedDocuments).pipe()
            .subscribe(documents => this.selectedChange.emit({ documents })));

        this.window.addEventListener('keyup', this.keyup);
        this.window.addEventListener('keydown', this.keydown);
    }

    @Input()
    public viewMode: ViewMode = ViewMode.List;

    @Input()
    public filter: Observable<string> | null = null;

    @Input()
    public limit: Observable<number> | null = null;

    @Output()
    public selectedChange = new EventEmitter<{ documents: AASDocument[] }>();

    public someSelected: Observable<boolean>;

    public everySelected: Observable<boolean>;

    public readonly isFirstPage: Observable<boolean>;

    public readonly isLastPage: Observable<boolean>;

    public readonly totalCount: Observable<number>;

    public readonly rows: Observable<AASTableRow[]>;

    public ngOnInit(): void {
        this.store.dispatch(AASTableActions.initialize());
    }

    public ngOnChanges(changes: SimpleChanges): void {
        if (changes['filter'] && this.filter) {
            this.subscription.add(this.filter.subscribe(filter => {
                if (filter !== this._filter) {
                    this._filter = filter;
                    this.store.dispatch(AASTableActions.getFirstPage({ filter, limit: this._limit }));
                }
            }));
        }

        if (changes['limit'] && this.limit) {
            this.subscription.add(this.limit.subscribe(limit => {
                if (limit !== this._limit) {
                    this._limit = limit;
                    this.store.dispatch(AASTableActions.getFirstPage({ filter: this._filter, limit }));
                }
            }));
        }
    }

    public ngOnDestroy(): void {
        this.subscription.unsubscribe();
        this.window.removeEventListener('keyup', this.keyup);
        this.window.removeEventListener('keydown', this.keydown);
    }

    public firstPage(): void {
        this.store.dispatch(AASTableActions.getFirstPage({ filter: this._filter, limit: this._limit }));
    }

    public previousPage(): void {
        this.store.dispatch(AASTableActions.getPreviousPage({ filter: this._filter, limit: this._limit }))
    }

    public nextPage(): void {
        this.store.dispatch(AASTableActions.getNextPage({ filter: this._filter, limit: this._limit }))
    }

    public lastPage(): void {
        this.store.dispatch(AASTableActions.getLastPage({ filter: this._filter, limit: this._limit }))
    }

    public expand(row: AASTableRow): void {
        if (this.viewMode === ViewMode.Tree) {
            this.store.dispatch(AASTableActions.expandRow({ row }));
        }
    }

    public collapse(row: AASTableRow): void {
        if (this.viewMode === ViewMode.Tree) {
            this.store.dispatch(AASTableActions.collapseRow({ row }));
        }
    }

    public open(row: AASTableRow): void {
        const query: AASQuery = {
            id: row.document.id,
            name: row.document.endpoint,
        };

        if (this._filter) {
            query.search = this._filter.replace(/&&/, '||');
        }

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

    private keyup = () => {
        this.shiftKey = false;
        this.altKey = false;
    };

    private keydown = (event: KeyboardEvent) => {
        this.shiftKey = event.shiftKey;
        this.altKey = event.altKey;
    };
}