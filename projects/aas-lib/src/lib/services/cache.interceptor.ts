/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { inject, Injectable, OnDestroy } from '@angular/core';
import { AASNodeMessage, Cache, WebSocketData } from 'aas-core';
import { Observable, of, Subscription, tap } from 'rxjs';
import { WebSocketService } from './web-socket.service';

/**
 * An HTTP interceptor that caches GET requests in memory. It extends the `Cache` class to store
 * responses based on request URLs.
 */
@Injectable({ providedIn: 'root' })
export class CacheInterceptor extends Cache<string, HttpEvent<unknown>> implements HttpInterceptor, OnDestroy {
    private readonly webSocket = inject(WebSocketService);
    private readonly subscription: Subscription;

    public constructor() {
        super(100, 5 * 60 * 1000); // Cache size of 100 items and expiration time of 5 minutes

        this.subscription = this.webSocket.getMessages().subscribe({
            next: (data: WebSocketData): void => {
                if (data.type === 'AASNodeMessage[]') {
                    if (
                        (data.data as AASNodeMessage[]).some(message =>
                            [
                                'Reset',
                                'Removed',
                                'Update',
                                'EndpointAdded',
                                'EndpointRemoved',
                                'EndpointUpdate',
                            ].includes(message.type),
                        )
                    ) {
                        this.clear();
                    }
                }
            },
            error: (error): void => {
                console.error(error);
            },
        });
    }

    public intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        if (req.method !== 'GET') {
            return next.handle(req);
        }

        const event = this.getItem(req.url);
        if (event !== undefined) {
            return of(event);
        }

        return next.handle(req).pipe(tap(response => this.setItem(req.url, response)));
    }

    public ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }
}
