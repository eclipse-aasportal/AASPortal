/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Directive, EventEmitter, Input, Output } from '@angular/core';

const rotate: { [key: string]: SortDirection } = { asc: 'desc', desc: '', '': 'asc' };

export type SortDirection = 'asc' | 'desc' | '';

export interface SortEvent {
    column: string;
    direction: SortDirection;
}

@Directive({
    selector: 'th[sortable]',
    host: {
        '[class.asc]': 'direction === "asc"',
        '[class.desc]': 'direction === "desc"',
        '(click)': 'rotate()',
    },
    standalone: true,
})
export class SortableHeaderDirective {
    @Input()
    public sortable = '';

    @Input()
    public direction: SortDirection = '';

    @Output()
    public sort = new EventEmitter<SortEvent>();

    public rotate() {
        this.direction = rotate[this.direction];
        this.sort.emit({ column: this.sortable, direction: this.direction });
    }
}
