/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Cache } from 'aas-core';
import { Observable, of, tap } from 'rxjs';

/**
 * An HTTP interceptor that caches GET requests in memory. It extends the `Cache` class to store
 * responses based on request URLs.
 */
@Injectable()
export class CacheInterceptor extends Cache<string, HttpEvent<unknown>> implements HttpInterceptor {
    public constructor() {
        super(100);
    }

    public intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        if (req.method !== 'GET') {
            return next.handle(req);
        }

        const response = this.getItem(req.url);
        if (response !== undefined) {
            return of(response);
        }

        return next.handle(req).pipe(tap(response => this.setItem(req.url, response)));
    }
}
