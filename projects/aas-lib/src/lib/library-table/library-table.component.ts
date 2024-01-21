/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Library } from 'common';

export interface LibraryRow extends Library {
    id: number;
}

@Component({
    selector: 'fhg-library-table',
    templateUrl: './library-table.component.html',
    styleUrls: ['./library-table.component.scss'],
})
export class LibraryTableComponent implements OnChanges {
    @Input()
    public collection: Library[] = [];

    @Input()
    public pageSize = 10;

    public libraries: LibraryRow[] = [];

    public get size(): number {
        return this.collection.length;
    }

    public page = 1;

    public ngOnChanges(changes: SimpleChanges): void {
        if (changes['collection'] || changes['pageSize']) {
            this.refreshLibraries();
        }
    }

    public refreshLibraries(): void {
        if (this.pageSize > 0 && this.size > this.pageSize) {
            this.libraries = this.collection
                .map((library, i) => ({ id: i + 1, ...library }))
                .slice((this.page - 1) * this.pageSize, (this.page - 1) * this.pageSize + this.pageSize);
        } else {
            this.libraries = this.collection.map((library, i) => ({ id: i + 1, ...library }));
        }
    }
}