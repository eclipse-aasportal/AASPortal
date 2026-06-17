/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ChangeDetectionStrategy, Component, computed, effect, TemplateRef, viewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConceptDescriptionComponent, decodeBase64Url, ToolbarService } from 'aas-lib';

import { Cursor } from '../types';
import { ConceptDescriptionApi } from './concept-description-api';

@Component({
    selector: 'fhg-concept-descriptions',
    templateUrl: './concept-descriptions.component.html',
    styleUrl: './concept-descriptions.component.scss',
    imports: [FormsModule, ConceptDescriptionComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConceptDescriptionsComponent {
    private readonly toolbar = inject(ToolbarService);
    private readonly api = inject(ConceptDescriptionApi);

    public constructor() {
        effect(() => {
            const toolbarTemplate = this.toolbarTemplate();
            if (toolbarTemplate) {
                this.toolbar.set(toolbarTemplate);
            }
        });
    }

    public readonly toolbarTemplate = viewChild<TemplateRef<unknown>>('conceptDescriptionsToolbar');

    public readonly items = computed(() => {
        const result = this.api.conceptDescriptions.value();
        if (result === undefined) {
            return [];
        }

        return result.result;
    });

    public readonly limit = this.api.limit;

    public readonly isFirstPage = computed(() => !this.current().previous);

    public readonly isLastPage = computed(() => !this.current().next);

    public firstPage(): void {
        this.api.cursor.set({ next: null, previous: null });
    }

    public previousPage(): void {
        this.api.cursor.set({ next: null, previous: this.current().previous });
    }

    public nextPage(): void {
        this.api.cursor.set({ next: this.current().next, previous: null });
    }

    public lastPage(): void {
        this.api.cursor.set({ next: 'last', previous: 'last' });
    }

    private readonly current = computed<Cursor>(() => {
        const result = this.api.conceptDescriptions.value();
        if (!result?.paging_metadata.cursor) {
            return { next: null, previous: null } satisfies Cursor;
        }

        return JSON.parse(decodeBase64Url(result.paging_metadata.cursor));
    });
}
