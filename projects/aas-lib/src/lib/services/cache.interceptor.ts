/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import { HttpCache } from './http-cache';

/**
 * An HTTP interceptor that caches GET requests in memory. It uses the `HttpCache` service to store responses
 * based on request URLs.
 */
@Injectable({ providedIn: 'root' })
export class CacheInterceptor implements HttpInterceptor {
    private readonly cache = inject(HttpCache);

    public intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        if (req.method !== 'GET') {
            return next.handle(req);
        }

        const event = this.cache.get(req.url);
        if (event !== undefined) {
            return of(event);
        }

        return next.handle(req).pipe(tap(response => this.cache.set(req.url, response)));
    }
}
