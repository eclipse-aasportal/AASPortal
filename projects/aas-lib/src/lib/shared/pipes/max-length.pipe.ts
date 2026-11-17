/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'max',
    standalone: true,
    pure: true,
})
export class MaxLengthPipe implements PipeTransform {
    private max = 80;

    /**
     * @param endBias Share of the visible (non-"...") characters kept from the end of the
     * string, from 0 (all from the start) to 1 (all from the end). Defaults to 0.5, an even
     * split between start and end, matching the previous fixed behavior.
     */
    public transform(value: string | undefined, max = 80, endBias = 0.5): string {
        this.max = Math.max(5, Number(max));
        if (!value) {
            return '';
        }

        return value.length <= this.max ? value : this.shortenText(value, endBias);
    }

    private shortenText(value: string, endBias: number): string {
        const available = this.max - 3; // reserve space for the "..." separator
        const endLength = Math.min(available - 1, Math.max(1, Math.round(available * endBias)));
        const startLength = available - endLength;
        const start = value.slice(0, startLength);
        const end = value.slice(value.length - endLength);
        return start + '...' + end;
    }
}
