/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AASDocument, aas } from 'common';
import { AASTreeApiService } from '../../lib/aas-tree/aas-tree-api.service';
import { AuthService } from '../../lib/auth/auth.service';

describe('AASTreeApiService', function () {
    let service: AASTreeApiService;
    let httpTestingController: HttpTestingController;
    let auth: jasmine.SpyObj<AuthService>;

    beforeEach(function () {
        auth = jasmine.createSpyObj<AuthService>(['login']);
        TestBed.configureTestingModule({
            declarations: [],
            providers: [
                {
                    provide: AuthService,
                    useValue: auth
                }
            ],
            imports: [
                HttpClientTestingModule
            ],
        });

        service = TestBed.inject(AASTreeApiService);
        httpTestingController = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpTestingController.verify();
    });

    it('should created', function () {
        expect(service).toBeTruthy();
    });

    describe('invoke', function () {
        it('invokes an operation', async function () {
            const document = jasmine.createSpyObj<AASDocument>({}, {
                endpoint: 'Samples',
                id: 'http://localhost/aas'
            });

            const operation: aas.Operation = {
                idShort: 'Noop',
                modelType: 'Operation',
            };

            const promise = service.invoke(document, operation);
            const url = `/api/v1/containers/U2FtcGxlcw/documents/aHR0cDovL2xvY2FsaG9zdC9hYXM`
            const req = httpTestingController.expectOne(url);
            req.flush(operation);
            await expectAsync(promise).toBeResolvedTo(operation);
        });
    });
});