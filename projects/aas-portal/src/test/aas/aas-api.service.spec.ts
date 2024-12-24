/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { createDocument } from '../assets/test-document';
import { AASApiService } from '../../app/aas/aas-api.service';
import { noop } from 'lodash-es';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('AASApiService', function () {
    let service: AASApiService;
    let httpTestingController: HttpTestingController;

    beforeEach(function () {
        TestBed.configureTestingModule({
    imports: [],
    providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
});

        service = TestBed.inject(AASApiService);
        httpTestingController = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpTestingController.verify();
    });

    it('should created', function () {
        expect(service).toBeTruthy();
    });

    describe('getDocument', () => {
        it('/api/v1/endpoints/:name/documents/:id}', function () {
            const document = createDocument('document1');

            service.getDocument('document1', 'Samples').subscribe(value => {
                expect(value).toEqual(document);
            });

            const req = httpTestingController.expectOne('/api/v1/endpoints/U2FtcGxlcw/documents/ZG9jdW1lbnQx');
            expect(req.request.method).toEqual('GET');
            req.flush(document);
        });

        it('/api/v1/documents/:id', function () {
            const document = createDocument('document1');

            service.getDocument('document1').subscribe(value => {
                expect(value).toEqual(document);
            });

            const req = httpTestingController.expectOne('/api/v1/documents/ZG9jdW1lbnQx');
            expect(req.request.method).toEqual('GET');
            req.flush(document);
        });
    });

    describe('getTemplates', () => {
        it('ToDo', () => noop());
    });

    describe('putDocument', () => {
        it('ToDo', () => noop());
    });
});
