/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'max',
    standalone: true,
})
export class MaxLengthPipe implements PipeTransform {
    private max = 80;

    public transform(value: string, max = 80): string {
        this.max = Math.max(5, Number(max));

        return value && value.length <= this.max ? value : this.shortenText(value);
    }

    private shortenText(value: string): string {
        const m2 = this.max / 2;
        const start = value.slice(0, m2 - 1);
        const end = value.slice(value.length - m2 + 2);
        return start + '...' + end;
    }
}
