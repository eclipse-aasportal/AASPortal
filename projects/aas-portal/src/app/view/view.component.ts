/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ChangeDetectionStrategy, Component, inject, OnDestroy } from '@angular/core';
import { ActivatedRoute, RouterOutlet } from '@angular/router';

import { ToolbarService } from 'aas-lib';

@Component({
    selector: 'fhg-view',
    templateUrl: './view.component.html',
    styleUrls: ['./view.component.scss'],
    imports: [RouterOutlet],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewComponent implements OnDestroy {
    private readonly toolbar = inject(ToolbarService);

    public constructor() {
    }

    public ngOnDestroy(): void {
        this.toolbar.clear();
    }
}
