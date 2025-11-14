/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Injectable } from '@angular/core';
import { Cache } from 'aas-core';

@Injectable({
    providedIn: 'root',
})
export class CacheService extends Cache<string, unknown> {
    public constructor() {
        super(100);
    }

    public get<TValue>(url: string): TValue | undefined {
        return this.getItem(url) as TValue;
    }

    public set<TValue>(url: string, value: TValue): void {
        this.setItem(url, value);
    }
}
