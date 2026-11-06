/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Observable, of } from 'rxjs';
import { NgComponentOutlet } from '@angular/common';
import { Component, effect, OnDestroy, TemplateRef, viewChild, computed, inject } from '@angular/core';
import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';

import { StartService, ToolbarService } from 'aas-lib';
import { StartState, StartTileItem } from './start.state';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { TranslateDirective, TranslatePipe } from '@ngx-translate/core';

/**
 * The Start page. Provides a favorites page or, if no favorites are available, a welcome page.
 */
@Component({
    selector: 'fhg-start',
    templateUrl: './start.component.html',
    styleUrl: './start.component.scss',
    imports: [CdkDrag, CdkDropList, NgComponentOutlet, NgbTooltip, TranslatePipe, TranslateDirective],
})
export class StartComponent implements OnDestroy {
    private readonly state = inject(StartState);
    private readonly toolbar = inject(ToolbarService);
    private readonly start = inject(StartService);

    public constructor() {
        effect(() => {
            const template = this.toolbarTemplate();
            if (template) {
                this.toolbar.set(template);
            }
        });
    }

    /** The specific Start page toolbar. */
    public readonly toolbarTemplate = viewChild<TemplateRef<unknown>>('toolbar');

    /** The available favorites. */
    public readonly items = this.state.items;

    /** The welcome page. */
    public readonly welcome = this.state.welcome;

    /** Indicates whether favorites exist. */
    public readonly isEmpty = computed(() => this.items().length === 0);

    /** Indicates whether at least one favorite is selected. */
    public readonly someSelected = computed(() => this.items().some(item => item.selected()));

    /** The selected favorites. */
    public readonly selectedItems = computed(() => this.items().filter(item => item.selected()));

    /** Determines whether a single selected favorite can be moved to the left. */
    public readonly canMoveLeft = computed(() => {
        const indexes = this.items()
            .map((item, index) => ({ item, index }))
            .filter(({ item }) => item.selected())
            .map(({ index }) => index);

        return indexes.length === 1 && indexes[0] > 0;
    });

    /** Determines whether a single selected favorite can be moved to the right. */
    public readonly canMoveRight = computed(() => {
        const length = this.items().length;
        const indexes = this.items()
            .map((item, index) => ({ item, index }))
            .filter(({ item }) => item.selected())
            .map(({ index }) => index);

        return indexes.length === 1 && indexes[0] < length - 1;
    });

    public ngOnDestroy(): void {
        this.toolbar.clear();
    }

    /** Selects a favorite, or toggles it when Command is pressed. */
    public toggleSelected($event: MouseEvent, item: StartTileItem): void {
        if ($event.metaKey) {
            item.selected.update(state => !state);
        } else {
            this.items().forEach(favorite => {
                favorite.selected.set(favorite === item && !item.selected());
            });
        }

        $event.stopPropagation();
    }

    /** Removes the selected favorites from the start page.*/
    public remove(): Observable<void> {
        const selectedItems = this.items().filter(item => item.selected());
        if (selectedItems.length === 0) {
            return of(void 0);
        }

        selectedItems.forEach(item => this.start.remove(item.tile));
        return this.start.save();
    }

    /** Moves a selected favorite to the right. */
    public moveLeft(): Observable<void> {
        const index = this.items().findIndex(item => item.selected());
        if (index === -1 || index === 0) {
            return of(void 0);
        }

        this.start.tiles.update(state => {
            const newState = [...state];
            const temp = newState[index];
            newState[index] = newState[index - 1];
            newState[index - 1] = temp;
            return newState;
        });

        return this.start.save();
    }

    /** Moves a selected favorite to the right. */
    public moveRight(): Observable<void> {
        const index = this.items().findIndex(item => item.selected());
        if (index === -1 || index === this.items().length - 1) {
            return of(void 0);
        }

        this.start.tiles.update(state => {
            const newState = [...state];
            const temp = newState[index];
            newState[index] = newState[index + 1];
            newState[index + 1] = temp;
            return newState;
        });

        return this.start.save();
    }

    /** Moves a favorite to its new drag-and-drop position. */
    public drop(event: CdkDragDrop<StartTileItem[]>): void {
        if (event.previousIndex === event.currentIndex) {
            return;
        }

        this.start.tiles.update(tiles => {
            const reordered = [...tiles];
            moveItemInArray(reordered, event.previousIndex, event.currentIndex);
            return reordered;
        });

        this.start.save().subscribe();
    }

    public deselect(): void {
        this.items().forEach(item => item.selected.set(false));
    }
}
