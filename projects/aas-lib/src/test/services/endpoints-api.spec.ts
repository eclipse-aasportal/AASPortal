/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { provideZonelessChangeDetection } from '@angular/core';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { of } from 'rxjs';
import { aas, AASDocument } from 'aas-core';
import { AuthService } from '../../lib/components/auth/auth.service';
import { EndpointsApi } from '../../lib/services/endpoints-api';
import { CacheService } from '../../lib/services/cache.service';

import sample from '../assets/dpp-sample.json';

describe('EndpointsApi', () => {
    let service: EndpointsApi;
    let httpTestingController: HttpTestingController;
    let auth: jasmine.SpyObj<AuthService>;
    let cache: jasmine.SpyObj<CacheService>;

    beforeEach(() => {
        auth = jasmine.createSpyObj<AuthService>(['login'], { ready: of(true) });
        cache = jasmine.createSpyObj<CacheService>(['get', 'set']);
        cache.get.and.returnValue(undefined);
        
        TestBed.configureTestingModule({
            providers: [
                {
                    provide: CacheService,
                    useValue: cache,
                },
                {
                    provide: AuthService,
                    useValue: auth,
                },
                provideHttpClient(withInterceptorsFromDi()),
                provideHttpClientTesting(),
                provideZonelessChangeDetection(),
            ],
        });

        service = TestBed.inject(EndpointsApi);
        httpTestingController = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpTestingController.verify();
    });

    it('should created', () => {
        expect(service).toBeTruthy();
    });

    describe('getDocument', () => {
        it('/api/v1/endpoints/:name/documents/:id}', (done: DoneFn) => {
            service.getDocument('document1', 'Samples').subscribe(value => {
                expect(value).toEqual(sample as AASDocument);
                done();
            });

            const req = httpTestingController.expectOne('/api/v1/endpoints/U2FtcGxlcw/documents/ZG9jdW1lbnQx');
            expect(req.request.method).toEqual('GET');
            req.flush(sample);
        });
    });

    describe('getContent', () => {
        it('/api/v1/endpoints/:name/documents/:id/content}', (done: DoneFn) => {
            service.getContent('document1', 'Samples').subscribe(value => {
                expect(value).toEqual((sample as AASDocument).content!);
                done();
            });

            const req = httpTestingController.expectOne('/api/v1/endpoints/U2FtcGxlcw/documents/ZG9jdW1lbnQx/content');
            expect(req.request.method).toEqual('GET');
            req.flush(sample.content);
        });
    });
});
