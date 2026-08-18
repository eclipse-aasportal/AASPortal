/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Injectable } from '@angular/core';
import { AASDocument, Cache } from 'aas-core';

/**
 * A simple in-memory cache for HTTP responses. It stores responses based on request URLs and provides
 * methods to set and get cached responses. The cache has a maximum size and expiration time for entries.
 */
@Injectable({ providedIn: 'root' })
export class DocumentCache extends Cache<string, AASDocument> {
    public constructor() {
        super(200, 5 * 60 * 1000); // Cache size of 200 items and expiration time of 5 minutes
    }

    public set(url: string, response: AASDocument): void {
        this.setItem(url, response);
    }

    public get(url: string): AASDocument | undefined {
        return this.getItem(url);
    }

    public ngOnDestroy(): void {
        this.clear();
    }
}
