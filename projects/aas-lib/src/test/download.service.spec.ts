/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { EMPTY, first, of } from 'rxjs';

import { DownloadService } from '../lib/download.service';

describe('DownloadService', () => {
    let service: DownloadService;
    let httpTestingController: HttpTestingController;
    let httpClient: HttpClient;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [
                TranslateModule.forRoot({
                    loader: {
                        provide: TranslateLoader,
                        useClass: TranslateFakeLoader,
                    },
                }),
            ],
            providers: [
                {
                    provide: DOCUMENT,
                    useValue: jasmine.createSpyObj<Document>(['createElement']),
                },
                provideHttpClient(withInterceptorsFromDi()),
                provideHttpClientTesting(),
            ],
        });

        service = TestBed.inject(DownloadService);
        httpTestingController = TestBed.inject(HttpTestingController);
        httpClient = TestBed.inject(HttpClient);
    });

    afterEach(() => {
        httpTestingController.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('uploadPackages', () => {
        it('POST: /api/v1/endpoints/:name/documents/:id', () => {
            const file = jasmine.createSpyObj<File>(['arrayBuffer', 'slice', 'stream', 'text']);

            service.uploadPackages('Samples', file).subscribe();
            const req = httpTestingController.expectOne('/api/v1/endpoints/U2FtcGxlcw/packages');
            expect(req.request.method).toEqual('POST');
            expect(req.request.body).toBeDefined();
        });
    });

    describe('downloadPackage', () => {
        it('downloads an AASX package file', () => {
            const spy = spyOn(httpClient, 'get').and.returnValue(EMPTY);
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
            const spy = spyOn(httpClient, 'get').and.returnValue(EMPTY);
            service.download('http://localhost/folder/file', 'Test.txt');
            expect(spy).toHaveBeenCalled();
        });
    });
});
