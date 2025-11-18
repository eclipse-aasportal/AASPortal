/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { jest } from '@jest/globals';
import { provideZonelessChangeDetection } from '@angular/core';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { EMPTY, of } from 'rxjs';
import { AASDocument } from 'aas-core';
import { AuthService } from '../../lib/components/auth/auth.service';
import { EndpointsApi } from '../../lib/services/endpoints-api';
import { CacheService } from '../../lib/services/cache.service';

import sample from '../assets/dpp-sample.json';
import { createSpyObj, DoneFn } from '../mocks';

describe('EndpointsApi', () => {
    let service: EndpointsApi;
    let httpTestingController: HttpTestingController;
    let httpClient: HttpClient;
    let auth: jest.Mocked<AuthService>;
    let cache: jest.Mocked<CacheService>;

    beforeEach(() => {
        auth = createSpyObj<AuthService>(['login'], { ready: of(true) });
        cache = createSpyObj<CacheService>(['get', 'set']);
        cache.get.mockReturnValue(undefined);

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
        httpClient = TestBed.inject(HttpClient);
    });

    afterEach(() => {
        httpTestingController.verify();
    });

    it('should created', () => {
        expect(service).toBeTruthy();
    });

    describe('getDocument', () => {
        it('/api/v1/endpoints/:name/documents/:id}', (done: DoneFn) => {
            service.getDocument('AssetAdministrationShell', 'document1', 'Samples').subscribe(value => {
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

    describe('uploadPackage', () => {
        it('POST: /api/v1/endpoints/{name}/packages', () => {
            const file = createSpyObj<File>(['arrayBuffer', 'slice', 'stream', 'text']);

            service.uploadPackage('Samples', file).subscribe();
            const req = httpTestingController.expectOne('/api/v1/endpoints/U2FtcGxlcw/packages');
            expect(req.request.method).toEqual('POST');
            expect(req.request.body).toBeDefined();
        });
    });

    describe('downloadPackage', () => {
        it('downloads an AASX package file', () => {
            const spy = jest.spyOn(httpClient, 'get').mockReturnValue(EMPTY);
            service.downloadPackage(
                'Samples',
                'https://iosb-ina.fraunhofer.de/ids/aas/5174_7001_0122_9237',
                'Test.aasx',
            );

            expect(spy).toHaveBeenCalled();
        });
    });

    describe('download', () => {
        it('downloads a file resource', () => {
            const spy = jest.spyOn(httpClient, 'get').mockReturnValue(EMPTY);
            service.download('http://localhost/folder/file', 'Test.txt');
            expect(spy).toHaveBeenCalled();
        });
    });
});
