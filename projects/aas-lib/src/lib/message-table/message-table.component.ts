/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ChangeDetectionStrategy, Component, OnDestroy, computed, input, signal, viewChildren } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { Message } from 'aas-core';

import { SortEvent, SortableHeaderDirective } from '../sortable-header.directive';

@Component({
    selector: 'fhg-message-table',
    templateUrl: './message-table.component.html',
    styleUrls: ['./message-table.component.scss'],
    imports: [SortableHeaderDirective, NgbPagination, TranslateModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageTableComponent implements OnDestroy {
    private readonly dateTimeOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
    };

    private readonly subscription = new Subscription();
    private readonly column = signal('');
    private readonly direction = signal('');

    public constructor(private translate: TranslateService) {}

    public readonly headers = viewChildren<SortableHeaderDirective>(SortableHeaderDirective);

    public readonly collection = input<Message[]>([]);

    public readonly pageSize = input(10);

    public readonly page = signal(1);

    public readonly messages = computed(() => {
        const values = this.sort(
            this.filter(this.collection(), this.showInfo(), this.showWarning(), this.showError()),
            this.column(),
            this.direction(),
        );

        const pageSize = this.pageSize();
        const page = this.page();
        if (pageSize > 0 && values.length > pageSize) {
            return values.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);
        } else {
            return values;
        }
    });

    public readonly size = computed(
        () => this.filter(this.collection(), this.showInfo(), this.showWarning(), this.showError()).length,
    );

    public readonly showInfo = signal(false);

    public readonly showWarning = signal(false);

    public readonly showError = signal(true);

    public ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    public onSort({ column, direction }: SortEvent): void {
        this.headers().forEach(header => {
            if (header.sortable !== column) {
                header.direction = '';
            }
        });

        this.column.set(column);
        this.direction.set(direction);
    }

    public timestampToString(value: number): string {
        return new Intl.DateTimeFormat(this.translate.currentLang, this.dateTimeOptions).format(value);
    }

    private filter(collection: Message[], showInfo: boolean, showWarning: boolean, showError: boolean): Message[] {
        let values: Message[];
        if ((showError && showWarning && showInfo) || (!showError && !showWarning && !showInfo)) {
            values = [...collection];
        } else {
            values = collection.filter(
                item =>
                    (item.type === 'Error' && showError) ||
                    (item.type === 'Warning' && showWarning) ||
                    (item.type === 'Info' && showInfo),
            );
        }

        return values;
    }

    private sort(values: Message[], column: string, direction: string): Message[] {
        if (column && direction) {
            if (direction === 'asc') {
                values.sort((a, b) => this.compare(a, b, column));
            } else {
                values.sort((a, b) => this.compare(b, a, column));
            }
        }

        return values;
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
