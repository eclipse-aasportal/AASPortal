/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ChangeDetectionStrategy, Component, input, computed } from '@angular/core';
import { DataSheetData } from '../../types';

/**
 * Provides a data sheet view.
 */
@Component({
    selector: 'fhg-data-sheet',
    imports: [],
    templateUrl: './data-sheet.html',
    styleUrl: './data-sheet.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataSheet {
    /** The data to visualize as data sheet. */
    public readonly dataSheet = input<DataSheetData>({ name: '', items: [], collapsed: false });

    /** The data sheet items. */
    public readonly items = computed(() => this.dataSheet().items);

    /**
     * Indicates whether the specified value is of type `Array`.
     * @param value The current value.
     * @returns `true` if value is an array; otherwise, `false`.
     */
    public isArray(value: unknown): boolean {
        return Array.isArray(value);
    }
}
