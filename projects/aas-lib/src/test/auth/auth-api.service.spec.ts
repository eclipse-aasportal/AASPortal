/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
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

describe('AuthApiService', () => {
    let service: AuthApiService;
    let httpTestingController: HttpTestingController;
    let userId: string;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [],
            imports: [],
            providers: [AuthApiService, provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()],
        });

        userId = 'john.doe@email.com';
        service = TestBed.inject(AuthApiService);
        httpTestingController = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpTestingController.verify();
    });

    it('should created', () => {
        expect(service).toBeTruthy();
    });

    describe('guest', () => {
        it('login guest', () => {
            const result: AuthResult = { token: getGuestToken() };
            service.guest().subscribe(res => {
                expect(res).toEqual(result);
            });

            const req = httpTestingController.expectOne('/api/v1/guest');
            expect(req.request.method).toEqual('POST');
            req.flush(result);
        });
    });

    describe('login', () => {
        it('login John', () => {
            const result: AuthResult = { token: getToken('John') };
            service.login({ id: 'john.doe@email.com', password: '1234.xyz' }).subscribe(res => {
                expect(res).toEqual(result);
            });

            const req = httpTestingController.expectOne('/api/v1/login');
            expect(req.request.method).toEqual('POST');
            req.flush(result);
        });
    });

    describe('register', () => {
        it('registers John as new user', () => {
            const result: AuthResult = { token: getToken('John') };
            service.register({ id: 'john.doe@email.com', name: 'John', password: '1234.xyz' }).subscribe(res => {
                expect(res).toEqual(result);
            });

            const req = httpTestingController.expectOne('/api/v1/register');
            expect(req.request.method).toEqual('POST');
            req.flush(result);
        });
    });

    describe('delete', () => {
        it('deletes a registered user', () => {
            service.delete('john.doe@email.com').subscribe();
            const req = httpTestingController.expectOne('/api/v1/users/am9obi5kb2VAZW1haWwuY29t');
            expect(req.request.method).toEqual('DELETE');
        });
    });

    it('getCookies', () => {
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

    it('setCookie', () => {
        service.setCookie(userId, { name: 'Cookie1', data: 'Hello world.' }).subscribe();
        const req = httpTestingController.expectOne('/api/v1/users/am9obi5kb2VAZW1haWwuY29t/cookies/Cookie1');
        expect(req.request.method).toEqual('POST');
    });

    it('deleteCookie', () => {
        service.deleteCookie(userId, 'Cookie1').subscribe();
        const req = httpTestingController.expectOne('/api/v1/users/am9obi5kb2VAZW1haWwuY29t/cookies/Cookie1');
        expect(req.request.method).toEqual('DELETE');
    });
});