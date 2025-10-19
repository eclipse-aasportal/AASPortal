/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ChangeDetectionStrategy, Component, computed, effect, TemplateRef, viewChild, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { encodeBase64Url, ToolbarService } from 'aas-lib';

import { ShellsDataItem, ShellsService } from './shells.service';
import { MaxLengthPipe } from '../max-length.pipe';

@Component({
    selector: 'fhg-shells',
    templateUrl: './shells.component.html',
    styleUrl: './shells.component.scss',
    imports: [MaxLengthPipe, FormsModule, RouterLink],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellsComponent {
    private readonly toolbar = inject(ToolbarService);
    private readonly state = inject(ShellsService);

    public constructor() {
        effect(() => {
            const shellsToolbar = this.shellsToolbar();
            if (shellsToolbar) {
                this.toolbar.set(shellsToolbar);
            }
        });
    }

    public readonly shellsToolbar = viewChild<TemplateRef<unknown>>('shellsToolbar');

    public readonly items = this.state.page.value;

    public readonly limit = this.state.limit;

    public readonly isFirstPage = computed(() => {
        const current = this.state.page.value().cursor;
        return current?.previous == null;
    });

    public readonly isLastPage = computed(() => {
        const current = this.state.page.value().cursor;
        return current?.next == null;
    });

    public getFirstPage(): void {
        this.state.cursor.set({});
    }

    public getPreviousPage(): void {
        const current = this.state.page.value().cursor;
        if (!current?.previous) {
            return;
        }

        this.state.cursor.set({ previous: current.previous });
    }

    public getNextPage(): void {
        const current = this.state.page.value().cursor;
        if (!current?.next) {
            return;
        }

        this.state.cursor.set({ next: current.next });
    }

    public getLastPage(): void {
        this.state.cursor.set({ next: null, previous: null });
    }

    public getThumbnailSource(item: ShellsDataItem): string {
        if (item.thumbnail) {
            return item.thumbnail;
        }

        return '/assets/aas-idta.png';
    }

    public getLink(item: ShellsDataItem): string {
        return `/shells/${encodeBase64Url(item.id)}`;
    }
}
