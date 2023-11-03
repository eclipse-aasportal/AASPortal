/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Component, Input, OnChanges, OnDestroy, OnInit, QueryList, SimpleChanges, ViewChildren } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { AASDocument } from 'common';
import { Observable, Subscription } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

import { ViewMode } from '../types/view-mode';
import { AASTable } from '../types/aas-table';
import { AASTableRow, AASTableFeatureState } from './aas-table.state';
import * as AASTableSelectors from './aas-table.selectors';
import * as AASTableActions from './aas-table.actions';
import { AASQuery } from '../types/aas-query-params';
import { NotifyService } from '../notify/notify.service';
import { ClipboardService } from '../clipboard.service';
import { SortEvent, SortableHeaderDirective } from '../sortable-header.directive';
import { AASTableApiService } from './aas-table-api.service';

@Component({
    selector: 'fhg-aas-table',
    templateUrl: './aas-table.component.html',
    styleUrls: ['./aas-table.component.scss']
})
export class AASTableComponent implements AASTable, OnInit, OnChanges, OnDestroy {
    private readonly store: Store<AASTableFeatureState>;
    private readonly subscription: Subscription = new Subscription();
    private _filter = '';

    constructor(
        private readonly router: Router,
        translate: TranslateService,
        store: Store,
        private readonly api: AASTableApiService,
        private readonly notify: NotifyService,
        private readonly clipboard: ClipboardService
    ) {
        this.store = store as Store<AASTableFeatureState>;
        this.selectedDocuments = this.store.select(AASTableSelectors.selectSelectedDocuments);
        this.someSelections = this.store.select(AASTableSelectors.selectSomeSelections);
        this.rows = this.store.select(AASTableSelectors.selectRows);

        this.isFirstPage = this.store.select(AASTableSelectors.selectIsFirstPage);
        this.isLastPage = this.store.select(AASTableSelectors.selectIsLastPage);
    }

    @ViewChildren(SortableHeaderDirective)
    public headers!: QueryList<SortableHeaderDirective>;

    @Input()
    public viewMode: ViewMode = ViewMode.List;

    @Input()
    public filter: Observable<string> | null = null;

    public readonly isFirstPage: Observable<boolean>;

    public readonly isLastPage: Observable<boolean>;

    public rows: Observable<AASTableRow[]>;

    public readonly selectedDocuments: Observable<AASDocument[]>;

    public readonly someSelections: Observable<boolean>;

    public ngOnInit(): void {
        this.store.dispatch(AASTableActions.initialize());
    }

    public ngOnChanges(changes: SimpleChanges): void {
        if (changes['filter'] && this.filter) {
            this.subscription.add(this.filter.subscribe(filter => {
                this.store.dispatch(AASTableActions.getFirstPage({ filter }));
            }));
        }

        // const viewModeChange = changes['viewMode'];
        // if (viewModeChange && this.viewMode !== viewModeChange.previousValue) {
        //     this.documents?.pipe(first())
        //         .subscribe(documents => this.store.dispatch(AASTableActions.setViewMode({
        //             documents,
        //             viewMode: this.viewMode
        //         })));
        // }
    }

    public ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    public skipStart(): void {
        this.store.dispatch(AASTableActions.getFirstPage({}));
    }

    public skipBackward(): void {
        this.store.dispatch(AASTableActions.getPreviousPage())
    }

    public skipForward(): void {
        this.store.dispatch(AASTableActions.getNextPage())
    }

    public skipEnd(): void {
        this.store.dispatch(AASTableActions.getLastPage())
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

    public canOpen(row: AASTableRow): boolean {
        return row.document.content != null;
    }

    public open(row: AASTableRow): void {
        const query: AASQuery = {
            id: row.document.id,
            url: row.document.container
        };

        if (this._filter) {
            query.search = this._filter.replace(/&&/, '||');
        }

        this.clipboard.set('AASQuery', query);
        this.router.navigateByUrl('/aas?format=AASQuery');
    }

    public onSort({ column, direction }: SortEvent) {
        this.headers.forEach(header => {
            if (header.sortable !== column) {
                header.direction = '';
            }
        });

        this.store.dispatch(AASTableActions.setSortParameter({ column, direction }));
    }

    public getFormatIcon(row: AASTableRow): string {
        switch (row.type) {
            case 'opc':
                return '/assets/resources/opcua.32.png';
            case 'http':
                return '/assets/resources/aas.32.png';
            default:
                return '/assets/resources/aasx.32.png';
        }
    }

    public getToolTip(row: AASTableRow): string {
        return `${row.document.container}, ${row.document.endpoint.address}`;
    }

    public toggleSelected(row: AASTableRow): void {
        this.store.dispatch(AASTableActions.toggleSelected({ row }));
    }

    public toggleSelections(): void {
        this.store.dispatch(AASTableActions.toggleSelections());
    }

    private documentsChanged(documents: AASDocument[]): void {
        this.store.dispatch(AASTableActions.updateRows({ documents }));
    }
}