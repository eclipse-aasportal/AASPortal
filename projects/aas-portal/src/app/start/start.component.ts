/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { NgComponentOutlet } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    effect,
    OnDestroy,
    TemplateRef,
    Type,
    viewChild,
    computed,
} from '@angular/core';

import { StartService, ToolbarService } from 'aas-lib';

export type StartTileItem = {
    id: string;
    component: Type<unknown>;
    property: Record<string, string>;
};

@Component({
    selector: 'fhg-start',
    templateUrl: './start.component.html',
    styleUrl: './start.component.scss',
    imports: [NgComponentOutlet],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StartComponent implements OnDestroy {
    public constructor(
        private readonly toolbar: ToolbarService,
        private readonly start: StartService,
    ) {
        effect(() => {
            const startToolbar = this.startToolbar();
            if (startToolbar) {
                this.toolbar.set(startToolbar);
            }
        });
    }

    public readonly startToolbar = viewChild<TemplateRef<unknown>>('startToolbar');

    public readonly items = computed(() => {
        const items: StartTileItem[] = [];
        for (const tile of this.start.tiles()) {
            const type = this.start.getType(tile.type);
            if (type === undefined) {
                continue;
            }

            items.push({
                id: `${type.name}.${tile.endpoint}.${tile.id}`,
                component: type.component,
                property: { endpoint: tile.endpoint, id: tile.id },
            });
        }

        return items;
    });

    public ngOnDestroy(): void {
        this.toolbar.clear();
    }
}
