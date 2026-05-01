/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it, Mocked } from 'vitest';
import { of, Subscription } from 'rxjs';
import { WebSocketSubject } from 'rxjs/webSocket';
import { HttpRequest } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';

import { WebSocketData } from 'aas-core';
import { createSpyObj, MockWebSocketService } from '../mocks';
import { CacheInterceptor } from '../../lib/services/cache.interceptor';
import { WebSocketService } from '../../lib/services/web-socket.service';

describe('CacheInterceptor', () => {
    let interceptor: CacheInterceptor;
    let webSubject: Mocked<WebSocketSubject<WebSocketData>>;
    let subscription: Mocked<Subscription>;

    beforeEach(() => {
        webSubject = createSpyObj<WebSocketSubject<WebSocketData>>(['subscribe', 'unsubscribe', 'next'])
        subscription = createSpyObj<Subscription>(['unsubscribe']);
        webSubject.subscribe.mockReturnValue(subscription);

        TestBed.configureTestingModule({
            providers: [
                CacheInterceptor,
                {
                    provide: WebSocketService,
                    useValue: new MockWebSocketService(),
                }
            ],
        });

        interceptor = TestBed.inject(CacheInterceptor);
    });

    it('should be created', () => {
        expect(interceptor).toBeTruthy();
    });

    it('should cache GET requests', () => {
        const req: Mocked<HttpRequest<unknown>> = createSpyObj<HttpRequest<unknown>>([], {
            method: 'GET',
            url: '/test',
        });

        const handler = {
            handle: () => of({ data: 'response' } as any),
        } as any;

        interceptor.intercept(req, handler).subscribe(response => {
            expect(response).toEqual({ data: 'response' });
            // The second call should return the cached response
            interceptor.intercept(req, handler).subscribe(cachedResponse => {
                expect(cachedResponse).toEqual({ data: 'response' });
            });
        });
    });

    it('should not cache non-GET requests', () => {
        const req: Mocked<HttpRequest<unknown>> = createSpyObj<HttpRequest<unknown>>([], {
            method: 'POST',
            url: '/test',
        });

        const handler = {
            handle: () => of({ data: 'response' } as any),
        } as any;

        interceptor.intercept(req, handler).subscribe(response => {
            expect(response).toEqual({ data: 'response' });
            // The second call should not return the cached response
            interceptor.intercept(req, handler).subscribe(newResponse => {
                expect(newResponse).toEqual({ data: 'response' });
            });
        });
    });
});