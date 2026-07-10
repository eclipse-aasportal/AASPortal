/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { afterEach, beforeEach, describe, expect, it, Mocked } from 'vitest';
import { provideZonelessChangeDetection } from '@angular/core';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AuthService } from '../../core/auth/auth.service';
import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';
import { AASTreeApi } from './aas-tree-api';
import { createSpyObj } from '../../../test/mocks';

describe('AASTreeApiService', () => {
    let service: AASTreeApi;
    let httpTestingController: HttpTestingController;
    let auth: Mocked<AuthService>;

    beforeEach(() => {
        auth = createSpyObj<AuthService>(['login']);
        TestBed.configureTestingModule({
            declarations: [],
            imports: [],
            providers: [
                AASTreeApi,
                {
                    provide: AuthService,
                    useValue: auth,
                },
                provideHttpClient(withXhr(), withInterceptorsFromDi()),
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
