/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AASDocument, aas } from 'aas-core';
import { OperationCallFormApiService } from '../../lib/operation-call-form/operation-call-form-api.service';
import { provideHttpClient } from '@angular/common/http';

describe('OperationCallFormApiService', function () {
    let service: OperationCallFormApiService;
    let httpTesting: HttpTestingController;

    beforeEach(function () {
        TestBed.configureTestingModule({
            providers: [OperationCallFormApiService, provideHttpClient(), provideHttpClientTesting()],
        });

        service = TestBed.inject(OperationCallFormApiService);
        httpTesting = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpTesting.verify();
    });

    it('should created', () => {
        expect(service).toBeTruthy();
    });

    describe('invoke', () => {
        it('invokes an operation', (done: DoneFn) => {
            const document = jasmine.createSpyObj<AASDocument>(
                {},
                {
                    endpoint: 'Samples',
                    id: 'http://localhost/aas',
                },
            );

            const operation: aas.Operation = {
                idShort: 'Noop',
                modelType: 'Operation',
            };

            service.invoke(document, operation).subscribe(result => {
                expect(result).toEqual(operation);
                done();
            });

            const url = `/api/v1/endpoints/U2FtcGxlcw/documents/aHR0cDovL2xvY2FsaG9zdC9hYXM/invoke`;
            const req = httpTesting.expectOne(url);
            req.flush(operation);
        });
    });
});