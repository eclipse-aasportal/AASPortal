/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ChangeDetectionStrategy, Component, effect, OnDestroy, TemplateRef, viewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { ToolbarService } from '../toolbar.service';

@Component({
    selector: 'fhg-view',
    templateUrl: './view.component.html',
    styleUrls: ['./view.component.scss'],
    imports: [RouterOutlet],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewComponent implements OnDestroy {
    public constructor(private readonly toolbar: ToolbarService) {
        effect(() => {
            const viewToolbar = this.viewToolbar();
            if (viewToolbar) {
                this.toolbar.set(viewToolbar);
            }
        });
    }

    public readonly viewToolbar = viewChild<TemplateRef<unknown>>('viewToolbar');

    public ngOnDestroy(): void {
        this.toolbar.clear();
    }
}
