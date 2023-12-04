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
import { Observable, Subscription, first, mergeMap } from 'rxjs';

import { ViewMode } from '../types/view-mode';
import { AASTableRow, AASTableFeatureState } from './aas-table.state';
import * as AASTableSelectors from './aas-table.selectors';
import * as AASTableActions from './aas-table.actions';
import { AASQuery } from '../types/aas-query-params';
import { ClipboardService } from '../clipboard.service';
import { WindowService } from '../window.service';
import { AuthService } from '../auth/auth.service';
import { NotifyService } from '../notify/notify.service';

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
    private _viewMode = ViewMode.List;
    private _selected: AASDocument[] = [];
    private shiftKey = false;
    private altKey = false;

    constructor(
        private readonly router: Router,
        store: Store,
        private readonly auth: AuthService,
        private readonly clipboard: ClipboardService,
        private readonly notify: NotifyService,
        private readonly window: WindowService
    ) {
        this.store = store as Store<AASTableFeatureState>;
        this.rows = this.store.select(AASTableSelectors.selectRows);
        this.isFirstPage = this.store.select(AASTableSelectors.selectIsFirstPage);
        this.isLastPage = this.store.select(AASTableSelectors.selectIsLastPage);
        this.totalCount = this.store.select(AASTableSelectors.selectTotalCount);
        this.everySelected = this.store.select(AASTableSelectors.selectEverySelected);
        this.someSelected = this.store.select(AASTableSelectors.selectSomeSelected);

        this.window.addEventListener('keyup', this.keyup);
        this.window.addEventListener('keydown', this.keydown);
    }

    @Input()
    public get viewMode(): ViewMode {
        return this._viewMode;
    }

    public set viewMode(value: ViewMode) {
        if (value !== this._viewMode) {
            this._viewMode = value;
            if (this._viewMode === ViewMode.List) {
                this.store.dispatch(AASTableActions.getFirstPage({ limit: this._limit }));
            } else {
                this.store.dispatch(AASTableActions.initTreeView())
            }
        }
    }

    @Input()
    public filter: Observable<string> | null = null;

    @Input()
    public limit: Observable<number> | null = null;

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

    public someSelected: Observable<boolean>;

    public everySelected: Observable<boolean>;

    public readonly isFirstPage: Observable<boolean>;

    public readonly isLastPage: Observable<boolean>;

    public readonly totalCount: Observable<number>;

    public readonly rows: Observable<AASTableRow[]>;

    public ngOnInit(): void {
        this.subscription.add(this.store.select(AASTableSelectors.selectSelectedDocuments).pipe()
            .subscribe(documents => {
                this._selected = documents;
                this.selectedChange.emit(documents);
            }));

        this.store.select(AASTableSelectors.selectViewMode).pipe(
            first(viewMode => viewMode === ViewMode.Undefined),
            mergeMap(() => this.auth.ready),
            first(ready => ready),
            first(),
        ).subscribe({
            next: () => this.store.dispatch(AASTableActions.getFirstPage({ limit: this._limit })),
            error: error => this.notify.error(error),
        });
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