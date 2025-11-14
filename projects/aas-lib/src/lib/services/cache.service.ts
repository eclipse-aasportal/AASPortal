/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

<<<<<<< HEAD
import { Injectable, OnDestroy } from '@angular/core';
import { Cache } from 'aas-core';
import { IndexChangeService } from './index-change.service';
import { Subscription } from 'rxjs';
=======
import { Injectable } from '@angular/core';
import { Cache } from 'aas-core';
>>>>>>> development

@Injectable({
    providedIn: 'root',
})
<<<<<<< HEAD
export class CacheService extends Cache<string, unknown> implements OnDestroy {
    private subscription: Subscription;

    public constructor(private readonly indexChange: IndexChangeService) {
        super(100);

        this.subscription = this.indexChange.message.subscribe(() => {
            this.clear();
        });
=======
export class CacheService extends Cache<string, unknown> {
    public constructor() {
        super(100);
>>>>>>> development
    }

    public get<TValue>(url: string): TValue | undefined {
        return this.getItem(url) as TValue;
    }

    public set<TValue>(url: string, value: TValue): void {
        this.setItem(url, value);
    }
<<<<<<< HEAD

    public ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }
=======
>>>>>>> development
}
