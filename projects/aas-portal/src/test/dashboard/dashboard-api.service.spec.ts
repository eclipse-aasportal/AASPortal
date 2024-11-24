/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { DashboardApiService } from '../../app/dashboard/dashboard-api.service';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('DashboardApiService', () => {
    let service: DashboardApiService;
    let httpTestingController: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [],
            providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()],
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

    it('GET: ', function () {
        const container = encodeBase64Url('http://localhost/container');
        const id = encodeBase64Url('http://localhost/document');
        const smId = encodeBase64Url('http://localhost/submodel');
        const path = 'Blob';
        const url = `/api/v1/containers/${container}/documents/${id}/submodels/${smId}/blobs/${path}/value`;
        const value = window.btoa('Hello World!');

        service.getBlobValue(url).subscribe(value => {
            expect(value).toEqual(value);
        });

        const req = httpTestingController.expectOne(url);
        expect(req.request.method).toEqual('GET');
        req.flush(value);
    });
});

function encodeBase64Url(s: string): string {
    return window.btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
