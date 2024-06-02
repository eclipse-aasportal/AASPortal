/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Component, Input, OnChanges, OnDestroy, QueryList, SimpleChanges, ViewChildren } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Message } from 'common';
import { Subscription } from 'rxjs';
import { SortEvent, SortableHeaderDirective } from '../sortable-header.directive';
import { NgbPagination } from '@ng-bootstrap/ng-bootstrap';

interface MessageTableState {
    showInfo: boolean;
    showWarning: boolean;
    showError: boolean;
    column: string;
    direction: string;
}

@Component({
    selector: 'fhg-message-table',
    templateUrl: './message-table.component.html',
    styleUrls: ['./message-table.component.scss'],
    standalone: true,
    imports: [SortableHeaderDirective, NgbPagination],
})
export class MessageTableComponent implements OnChanges, OnDestroy {
    private readonly dateTimeOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
    };

    private readonly subscription = new Subscription();
    private _collection: Message[] = [];
    private state: MessageTableState = {
        showInfo: false,
        showWarning: false,
        showError: true,
        column: '',
        direction: '',
    };

    public constructor(private translate: TranslateService) {}

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
        return this.state.showInfo;
    }

    public get showWarning(): boolean {
        return this.state.showWarning;
    }

    public get showError(): boolean {
        return this.state.showError;
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
        this.state.showInfo = !this.state.showInfo;
        this.filterSort();
        this.refreshMessages();
    }

    public toggleShowWarning(): void {
        this.state.showWarning = !this.state.showWarning;
        this.filterSort();
        this.refreshMessages();
    }

    public toggleShowError(): void {
        this.state.showError = !this.state.showError;
        this.filterSort();
        this.refreshMessages();
    }

    public onSort({ column, direction }: SortEvent): void {
        this.headers.forEach(header => {
            if (header.sortable !== column) {
                header.direction = '';
            }
        });

        this.state.column = column;
        this.state.direction = direction;
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
            (this.state.showError && this.state.showWarning && this.state.showInfo) ||
            (!this.state.showError && !this.state.showWarning && !this.state.showInfo)
        ) {
            this._collection = this.collection;
        } else {
            this._collection = this.collection.filter(
                item =>
                    (item.type === 'Error' && this.state.showError) ||
                    (item.type === 'Warning' && this.state.showWarning) ||
                    (item.type === 'Info' && this.state.showInfo),
            );
        }

        if (this.state.column && this.state.direction) {
            if (this.state.direction === 'asc') {
                this._collection.sort((a, b) => this.compare(a, b, this.state.column));
            } else {
                this._collection.sort((a, b) => this.compare(b, a, this.state.column));
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
