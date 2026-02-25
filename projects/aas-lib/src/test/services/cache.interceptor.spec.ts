/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it, Mocked } from 'vitest';
import { of } from 'rxjs';
import { HttpRequest } from '@angular/common/http';

import { createSpyObj } from '../mocks';
import { CacheInterceptor } from '../../lib/services/cache.interceptor';

describe('CacheService', () => {
    let interceptor: CacheInterceptor;

    beforeEach(() => {
        interceptor = new CacheInterceptor();
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
