/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Component, Input, OnChanges, OnDestroy, QueryList, SimpleChanges, ViewChildren } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { AASDocument } from 'common';
import { first, Observable, Subscription } from 'rxjs';
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

@Component({
    selector: 'fhg-aas-table',
    templateUrl: './aas-table.component.html',
    styleUrls: ['./aas-table.component.scss']
})
export class AASTableComponent implements AASTable, OnChanges, OnDestroy {
    private readonly store: Store<AASTableFeatureState>;
    private readonly subscription: Subscription = new Subscription();
    private _filter = '';

    constructor(
        private readonly router: Router,
        translate: TranslateService,
        store: Store,
        private readonly notify: NotifyService,
        private readonly clipboard: ClipboardService
    ) {
        this.store = store as Store<AASTableFeatureState>;
        this.selectedDocuments = this.store.select(AASTableSelectors.selectSelectedDocuments);
        this.someSelections = this.store.select(AASTableSelectors.selectSomeSelections);
        this.rows = this.store.select(AASTableSelectors.selectRows(translate));
    }

    @ViewChildren(SortableHeaderDirective)
    public headers!: QueryList<SortableHeaderDirective>;

    @Input()
    public viewMode: ViewMode = ViewMode.List;

    @Input()
    public showAll = false;

    @Input()
    public filter: Observable<string> | null = null;

    @Input()
    public documents: Observable<AASDocument[]> | null = null;

    public rows: Observable<AASTableRow[]>;

    public readonly selectedDocuments: Observable<AASDocument[]>;

    public readonly someSelections: Observable<boolean>;

    public ngOnChanges(changes: SimpleChanges): void {
        if (changes['documents']) {
            this.documents?.subscribe(documents => this.documentsChanged(documents));
        }

        if (changes['filter'] && this.filter) {
            this.subscription.add(this.filter.subscribe(filter => {
                this.store.dispatch(AASTableActions.setFilter({ filter }));
            }));
        }

        const showAllChange = changes['showAll'];
        if (showAllChange && this.showAll !== showAllChange.previousValue) {
            this.documents?.pipe(first())
                .subscribe(documents => this.store.dispatch(AASTableActions.setShowAll({
                    documents,
                    showAll: this.showAll
                })));
        }

        const viewModeChange = changes['viewMode'];
        if (viewModeChange && this.viewMode !== viewModeChange.previousValue) {
            this.documents?.pipe(first())
                .subscribe(documents => this.store.dispatch(AASTableActions.setViewMode({
                    documents,
                    viewMode: this.viewMode
                })));
        }
    }

    public ngOnDestroy(): void {
        this.subscription.unsubscribe();
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
        this.router.navigateByUrl('/aas?format=AASQuery', { skipLocationChange: true });
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