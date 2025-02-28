/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '../../lib/auth/auth.service';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { AASTreeApiService } from '../../lib/aas-tree/aas-tree-api.service';

describe('AASTreeApiService', () => {
    let service: AASTreeApiService;
    let httpTestingController: HttpTestingController;
    let auth: jasmine.SpyObj<AuthService>;

    beforeEach(() => {
        auth = jasmine.createSpyObj<AuthService>(['login']);
        TestBed.configureTestingModule({
            declarations: [],
            imports: [],
            providers: [
                AASTreeApiService,
                {
                    provide: AuthService,
                    useValue: auth,
                },
                provideHttpClient(withInterceptorsFromDi()),
                provideHttpClientTesting(),
            ],
        });

        service = TestBed.inject(AASTreeApiService);
        httpTestingController = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpTestingController.verify();
    });

    it('should created', () => {
        expect(service).toBeTruthy();
    });
});