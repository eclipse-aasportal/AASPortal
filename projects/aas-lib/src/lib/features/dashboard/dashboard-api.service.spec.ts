/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { DashboardApiService } from './dashboard-api.service';
import { encodeBase64Url } from '../../utilities';
import { ApplicationRef } from '@angular/core';
import { lastValueFrom } from 'rxjs';

describe('DashboardApiService', () => {
    let service: DashboardApiService;
    let httpTestingController: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [DashboardApiService, provideHttpClientTesting()],
        });

        service = TestBed.inject(DashboardApiService);
        httpTestingController = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpTestingController.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('getBlobValue', () => {
        it('should retrieve blob value', async () => {
            const container = encodeBase64Url('http://localhost/container');
            const id = encodeBase64Url('http://localhost/document');
            const smId = encodeBase64Url('http://localhost/submodel');
            const path = 'Blob';
            const url = `/api/v1/endpoints/${container}/documents/${id}/submodels/${smId}/blobs/${path}/value`;
            const value = btoa('Hello World!');
            const promise = lastValueFrom(service.getBlobValue(url));

            TestBed.tick();
            httpTestingController.expectOne(url).flush(value);
            await TestBed.inject(ApplicationRef).whenStable();
            expect(await promise).toBe(value);
        });
    });
});
