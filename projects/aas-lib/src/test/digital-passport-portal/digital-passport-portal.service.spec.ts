/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { of } from 'rxjs';
import { AASDocument } from 'aas-core';
import { AuthService } from '../../lib/auth/auth.service';
import { DigitalPassportPortalService } from '../../lib/digital-passport-portal/digital-passport-portal.service';

import sample from '../assets/dpp-portal-sample.json';

describe('DigitalPassportPortalService', () => {
    let service: DigitalPassportPortalService;
    let httpTestingController: HttpTestingController;
    let auth: jasmine.SpyObj<AuthService>;

    beforeEach(() => {
        auth = jasmine.createSpyObj<AuthService>(['login'], { userId: of('guest') });
        TestBed.configureTestingModule({
            declarations: [],
            imports: [],
            providers: [
                DigitalPassportPortalService,
                {
                    provide: AuthService,
                    useValue: auth,
                },
                provideHttpClient(withInterceptorsFromDi()),
                provideHttpClientTesting(),
            ],
        });

        service = TestBed.inject(DigitalPassportPortalService);
        httpTestingController = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpTestingController.verify();
    });

    it('should created', () => {
        expect(service).toBeTruthy();
    });

    describe('getDocument', () => {
        it('/api/v1/endpoints/:name/documents/:id}', () => {
            service.getDocument('document1', 'Samples').subscribe(value => {
                expect(value).toEqual(sample as AASDocument);
            });

            const req = httpTestingController.expectOne('/api/v1/endpoints/U2FtcGxlcw/documents/ZG9jdW1lbnQx');
            expect(req.request.method).toEqual('GET');
            req.flush(sample);
        });
    });

    describe('getContent', () => {
        it('/api/v1/endpoints/:name/documents/:id/content}', () => {
            service.getContent('document1', 'Samples').subscribe(value => {
                expect(value).toEqual((sample as AASDocument).content!);
            });

            const req = httpTestingController.expectOne('/api/v1/endpoints/U2FtcGxlcw/documents/ZG9jdW1lbnQx/content');
            expect(req.request.method).toEqual('GET');
            req.flush(sample.content);
        });
    });
});
