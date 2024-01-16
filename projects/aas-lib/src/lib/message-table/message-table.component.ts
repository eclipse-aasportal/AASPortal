/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Component, Input, OnChanges, OnDestroy, OnInit, QueryList, SimpleChanges, ViewChildren } from '@angular/core';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { Message } from 'common';
import { Subscription } from 'rxjs';
import { SortEvent, SortableHeaderDirective } from '../sortable-header.directive';
import { MessageTableFeatureState, MessageTableState } from './message-table.state';
import * as MessageTableActions from './message-table.actions';
import * as MessageTableSelectors from './message-table.selectors';

@Component({
    selector: 'fhg-message-table',
    templateUrl: './message-table.component.html',
    styleUrls: ['./message-table.component.scss'],
})
export class MessageTableComponent implements OnInit, OnChanges, OnDestroy {
    private readonly dateTimeOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
    };

    private readonly store: Store<MessageTableFeatureState>;
    private readonly subscription = new Subscription();
    private _collection: Message[] = [];
    private snapshot: MessageTableState = {
        showInfo: false,
        showWarning: false,
        showError: true,
        column: '',
        direction: '',
    };

    public constructor(
        store: Store,
        private translate: TranslateService,
    ) {
        this.store = store as Store<MessageTableFeatureState>;
    }

    @ViewChildren(SortableHeaderDirective)
    public headers!: QueryList<SortableHeaderDirective>;

    @Input()
    public collection: Message[] = [];

    @Input()
    public pageSize = 10;

    public page = 1;

    public messages: Message[] = [];

    public get size(): number {
        return this._collection.length;
    }

    public get showInfo(): boolean {
        return this.snapshot.showInfo;
    }

    public get showWarning(): boolean {
        return this.snapshot.showWarning;
    }

    public get showError(): boolean {
        return this.snapshot.showError;
    }

    public ngOnInit(): void {
        this.subscription.add(
            this.store
                .select(MessageTableSelectors.selectState)
                .pipe()
                .subscribe(state => {
                    this.snapshot = state;
                    this.filterSort();
                    this.refreshMessages();
                }),
        );
    }

    public ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    public ngOnChanges(changes: SimpleChanges): void {
        if (changes['collection']) {
            this.filterSort();
            this.refreshMessages();
        }

        if (changes['pageSize']) {
            this.filterSort();
            this.refreshMessages();
        }
    }

    public toggleShowInfo(): void {
        this.store.dispatch(MessageTableActions.toggleShowInfo());
    }

    public toggleShowWarning(): void {
        this.store.dispatch(MessageTableActions.toggleShowWarning());
    }

    public toggleShowError(): void {
        this.store.dispatch(MessageTableActions.toggleShowError());
    }

    public onSort({ column, direction }: SortEvent): void {
        this.headers.forEach(header => {
            if (header.sortable !== column) {
                header.direction = '';
            }
        });

        this.store.dispatch(MessageTableActions.setSortParameter({ column, direction }));
    }

    public refreshMessages(): void {
        if (this.pageSize > 0 && this.size > this.pageSize) {
            this.messages = this._collection.slice(
                (this.page - 1) * this.pageSize,
                (this.page - 1) * this.pageSize + this.pageSize,
            );
        } else {
            this.messages = this._collection;
        }
    }

    public timestampToString(value: number): string {
        return new Intl.DateTimeFormat(this.translate.currentLang, this.dateTimeOptions).format(value);
    }

    private filterSort(): void {
        if (
            (this.snapshot.showError && this.snapshot.showWarning && this.snapshot.showInfo) ||
            (!this.snapshot.showError && !this.snapshot.showWarning && !this.snapshot.showInfo)
        ) {
            this._collection = this.collection;
        } else {
            this._collection = this.collection.filter(
                item =>
                    (item.type === 'Error' && this.snapshot.showError) ||
                    (item.type === 'Warning' && this.snapshot.showWarning) ||
                    (item.type === 'Info' && this.snapshot.showInfo),
            );
        }

        if (this.snapshot.column && this.snapshot.direction) {
            if (this.snapshot.direction === 'asc') {
                this._collection.sort((a, b) => this.compare(a, b, this.snapshot.column));
            } else {
                this._collection.sort((a, b) => this.compare(b, a, this.snapshot.column));
            }
        }
    }

    private compare(a: Message, b: Message, column: string): number {
        switch (column) {
            case 'text':
                return a.text.localeCompare(b.text, this.translate.currentLang, { sensitivity: 'accent' });
            case 'type': {
                const value = a.type.localeCompare(b.type, this.translate.currentLang, { sensitivity: 'accent' });
                return value !== 0 ? value : a.timestamp - b.timestamp;
            }
            case 'timestamp':
                return a.timestamp - b.timestamp;
            default:
                return 0;
        }
    }
}
