/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { Library } from 'common';

export interface LibraryRow extends Library {
    id: number;
}

@Component({
    selector: 'fhg-library-table',
    templateUrl: './library-table.component.html',
    styleUrls: ['./library-table.component.scss'],
    standalone: true,
    imports: [NgbPagination, TranslateModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LibraryTableComponent {
    public readonly collection = input<Library[]>([]);

    public readonly pageSize = input(10);

    public readonly size = computed(() => this.collection().length);

    public readonly page = signal(1);

    public readonly libraries = computed(() => {
        const collection = this.collection();
        const pageSize = this.pageSize();
        const page = this.page();
        if (pageSize > 0 && collection.length > pageSize) {
            return collection
                .map((library, i) => ({ id: i + 1, ...library }))
                .slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);
        }

        return this.collection().map((library, i) => ({ id: i + 1, ...library }));
    });
}
