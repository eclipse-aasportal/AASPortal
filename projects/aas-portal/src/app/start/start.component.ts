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
    WritableSignal,
    signal,
} from '@angular/core';

import { StartService, StartTile, ToolbarService } from 'aas-lib';
import { EMPTY, Observable } from 'rxjs';

export type StartTileItem = {
    id: string;
    component: Type<unknown>;
    property: Record<string, string>;
    selected: WritableSignal<boolean>;
    tile: StartTile;
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
                selected: signal(false),
                tile,
            });
        }

        return items;
    });

    public ngOnDestroy(): void {
        this.toolbar.clear();
    }

    public toggleSelected($event: MouseEvent, item: StartTileItem): void {
        item.selected.update(state => !state);
        $event.stopPropagation();
    }

    public remove(): Observable<void> {
        const selectedItems = this.items().filter(item => item.selected());
        if (selectedItems.length === 0) {
            return EMPTY;
        }

        selectedItems.forEach(item => this.start.remove(item.tile));
        return this.start.save();
    }
}
