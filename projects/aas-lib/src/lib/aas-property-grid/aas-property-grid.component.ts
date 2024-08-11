/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { aas } from 'aas-core';

export interface PropertyValueItem {
    name: string;
    value: string;
}

@Component({
    selector: 'fhg-aas-property-grid',
    standalone: true,
    templateUrl: './aas-property-grid.component.html',
    styleUrl: './aas-property-grid.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [],
})
export class AASPropertyGridComponent {
    public readonly referable = input<aas.Referable>();

    public readonly items = computed(() => {
        const items: PropertyValueItem[] = [];
        const referable = this.referable();
        if (!referable) {
            return items;
        }

        for (const name in referable) {
            const value = (referable as unknown as { [key: string]: unknown })[name];
            if (typeof value === 'string') {
                items.push({ name, value });
            }
        }

        return items;
    });
}
