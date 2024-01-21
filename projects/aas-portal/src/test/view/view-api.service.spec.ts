/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { createDocument } from '../assets/test-document';
import { ViewApiService } from '../../app/view/view-api.service';

describe('ViewApiService', function () {
    let service: ViewApiService;
    let httpTestingController: HttpTestingController;

    beforeEach(function () {

        TestBed.configureTestingModule({
            declarations: [],
            providers: [],
            imports: [HttpClientTestingModule],
        });

        service = TestBed.inject(ViewApiService);
        httpTestingController = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpTestingController.verify();
    });

    it('should created', function () {
        expect(service).toBeTruthy();
    });

    describe('getDocument', () => {
        it('/api/v1/documents/:id', function () {
            const document = createDocument('document1');

            service.getDocument('Samples', 'document1').subscribe(value => {
                expect(value).toEqual(document);
            });

            const req = httpTestingController.expectOne('/api/v1/containers/U2FtcGxlcw/documents/ZG9jdW1lbnQx');
            expect(req.request.method).toEqual('GET');
            req.flush(document);
        });
    });
});