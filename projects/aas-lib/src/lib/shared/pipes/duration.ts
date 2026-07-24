/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'duration',
})
export class Duration implements PipeTransform {
    transform(value: unknown): unknown {
        if (typeof value === 'number') {
            const seconds = Math.floor(value / 1000);
            const minutes = Math.floor(seconds / 60);
            const hours = Math.floor(minutes / 60);

            const formattedHours = hours.toString().padStart(2, '0');
            const formattedMinutes = (minutes % 60).toString().padStart(2, '0');
            const formattedSeconds = (seconds % 60).toString().padStart(2, '0');

            return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
        }

        return 'n/d';
    }
}
