/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { Library } from 'aas-core';

@Component({
    selector: 'fhg-library-table',
    templateUrl: './library-table.component.html',
    styleUrls: ['./library-table.component.scss'],
    standalone: true,
    imports: [NgbPagination, TranslateModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LibraryTableComponent {
    public readonly libraries = input<Library[]>([]);
}
