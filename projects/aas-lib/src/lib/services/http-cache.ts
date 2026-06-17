/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { HttpEvent } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Cache } from 'aas-core';

/**
 * A simple in-memory cache for HTTP responses. It stores responses based on request URLs and provides
 * methods to set and get cached responses. The cache has a maximum size and expiration time for entries.
 */
@Injectable({ providedIn: 'root' })
export class HttpCache extends Cache<string, HttpEvent<unknown>> {
    public constructor() {
        super(100, 5 * 60 * 1000); // Cache size of 100 items and expiration time of 5 minutes
    }

    public set(url: string, response: HttpEvent<unknown>): void {
        this.setItem(url, response);
    }

    public get(url: string): HttpEvent<unknown> | undefined {
        return this.getItem(url);
    }

    public ngOnDestroy(): void {
        this.clear();
    }
}
