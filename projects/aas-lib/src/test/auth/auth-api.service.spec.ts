/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthResult, Cookie } from 'aas-core';

import { AuthApiService } from '../../lib/auth/auth-api.service';
import { getGuestToken, getToken } from '../assets/json-web-token';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('AuthApiService', function () {
    let service: AuthApiService;
    let httpTestingController: HttpTestingController;
    let userId: string;

    beforeEach(function () {
        TestBed.configureTestingModule({
            declarations: [],
            imports: [],
            providers: [AuthApiService, provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()],
        });

        userId = 'john.doe@email.com';
        service = TestBed.inject(AuthApiService);
        httpTestingController = TestBed.inject(HttpTestingController);
    });

    afterEach(function () {
        httpTestingController.verify();
    });

    it('should created', function () {
        expect(service).toBeTruthy();
    });

    describe('guest', function () {
        it('login guest', function () {
            const result: AuthResult = { token: getGuestToken() };
            service.guest().subscribe(res => {
                expect(res).toEqual(result);
            });

            const req = httpTestingController.expectOne('/api/v1/guest');
            expect(req.request.method).toEqual('POST');
            req.flush(result);
        });
    });

    describe('login', function () {
        it('login John', function () {
            const result: AuthResult = { token: getToken('John') };
            service.login({ id: 'john.doe@email.com', password: '1234.xyz' }).subscribe(res => {
                expect(res).toEqual(result);
            });

            const req = httpTestingController.expectOne('/api/v1/login');
            expect(req.request.method).toEqual('POST');
            req.flush(result);
        });
    });

    describe('register', function () {
        it('registers John as new user', function () {
            const result: AuthResult = { token: getToken('John') };
            service.register({ id: 'john.doe@email.com', name: 'John', password: '1234.xyz' }).subscribe(res => {
                expect(res).toEqual(result);
            });

            const req = httpTestingController.expectOne('/api/v1/register');
            expect(req.request.method).toEqual('POST');
            req.flush(result);
        });
    });

    describe('delete', function () {
        it('deletes a registered user', function () {
            service.delete('john.doe@email.com').subscribe();
            const req = httpTestingController.expectOne('/api/v1/users/am9obi5kb2VAZW1haWwuY29t');
            expect(req.request.method).toEqual('DELETE');
        });
    });

    it('getCookies', function () {
        const cookies: Cookie[] = [
            {
                name: 'Cookie1',
                data: 'Hello world.',
            },
        ];

        service.getCookies(userId).subscribe(data => {
            expect(data).toEqual(cookies);
        });

        const req = httpTestingController.expectOne('/api/v1/users/am9obi5kb2VAZW1haWwuY29t/cookies');
        expect(req.request.method).toEqual('GET');
        req.flush(cookies);
    });

    it('setCookie', function () {
        service.setCookie(userId, { name: 'Cookie1', data: 'Hello world.' }).subscribe();
        const req = httpTestingController.expectOne('/api/v1/users/am9obi5kb2VAZW1haWwuY29t/cookies/Cookie1');
        expect(req.request.method).toEqual('POST');
    });

    it('deleteCookie', function () {
        service.deleteCookie(userId, 'Cookie1').subscribe();
        const req = httpTestingController.expectOne('/api/v1/users/am9obi5kb2VAZW1haWwuY29t/cookies/Cookie1');
        expect(req.request.method).toEqual('DELETE');
    });
});
