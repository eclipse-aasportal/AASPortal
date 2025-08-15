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
import { AuthService } from '../../../lib/components/auth/auth.service';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { AASTreeApi } from '../../../lib/components/aas-tree/aas-tree-api';

describe('AASTreeApiService', () => {
    let service: AASTreeApi;
    let httpTestingController: HttpTestingController;
    let auth: jasmine.SpyObj<AuthService>;

    beforeEach(() => {
        auth = jasmine.createSpyObj<AuthService>(['login']);
        TestBed.configureTestingModule({
            declarations: [],
            imports: [],
            providers: [
                AASTreeApi,
                {
                    provide: AuthService,
                    useValue: auth,
                },
                provideHttpClient(withInterceptorsFromDi()),
                provideHttpClientTesting(),
                provideZonelessChangeDetection(),
            ],
        });

        service = TestBed.inject(AASTreeApi);
        httpTestingController = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpTestingController.verify();
    });

    it('should created', () => {
        expect(service).toBeTruthy();
    });
});
