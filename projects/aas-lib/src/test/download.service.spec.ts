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
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { EMPTY } from 'rxjs';

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
            providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()],
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

    describe('uploadDocuments', function () {
        it('POST: /api/v1/endpoints/:name/documents/:id', function () {
            const file = jasmine.createSpyObj<File>(['arrayBuffer', 'slice', 'stream', 'text']);

            service.uploadDocuments('Samples', file).subscribe();
            const req = httpTestingController.expectOne('/api/v1/endpoints/U2FtcGxlcw/packages');
            expect(req.request.method).toEqual('POST');
            expect(req.request.body).toBeDefined();
        });
    });

    describe('downloadDocument', function () {
        it('downloads an AASX package file', function () {
            const spy = spyOn(httpClient, 'get').and.returnValue(EMPTY);
            service.downloadDocument(
                'Samples',
                'https://iosb-ina.fraunhofer.de/ids/aas/5174_7001_0122_9237',
                'Test.aasx',
            );

            expect(spy).toHaveBeenCalled();
        });
    });

    describe('downloadFileAsync', function () {
        it('downloads a file resource', async function () {
            const spy = spyOn(httpClient, 'get').and.returnValue(EMPTY);
            await expectAsync(service.downloadFileAsync('http://localhost/folder/file', 'Test.txt')).toBeResolved();
            expect(spy).toHaveBeenCalled();
        });
    });
});
