/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Injectable } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class BusyIndicatorService {
    private readonly busyCount = new BehaviorSubject(0);

    public readonly isBusy = this.busyCount.pipe(map(value => value > 0));

    public readonly isIdle = this.busyCount.pipe(map(value => value === 0));

    public setBusy(): void {
        this.busyCount.next(this.busyCount.getValue() + 1);
    }

    public setIdle(): void {
        const busyCount = this.busyCount.getValue();
        if (busyCount > 0) {
            this.busyCount.next(busyCount - 1);
        }
    }
}
