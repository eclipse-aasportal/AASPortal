/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthResult, Cookie } from 'common';

import { AuthApiService } from 'src/lib/auth/auth-api.service';
import { getGuestToken, getToken } from '../assets/json-web-token';

describe('AuthApiService', function () {
    let service: AuthApiService;
    let httpTestingController: HttpTestingController;
    let userId: string;

    beforeEach(function () {
        TestBed.configureTestingModule({
            declarations: [],
            providers: [AuthApiService],
            imports: [HttpClientTestingModule],
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

    describe('guestAsync', function () {
        it('login guest', async function () {
            const result: AuthResult = { token: getGuestToken() };
            const promise = service.guestAsync();
            const req = httpTestingController.expectOne('/api/v1/guest');
            req.flush(result);
            await expectAsync(promise).toBeResolvedTo(result);
            expect(req.request.method).toEqual('POST');
        });
    });

    describe('loginAsync', function () {
        it('login John', async function () {
            const result: AuthResult = { token: getToken('John') };
            const promise = service.loginAsync({ id: 'john.doe@email.com', password: '1234.xyz' });
            const req = httpTestingController.expectOne('/api/v1/login');
            req.flush(result);
            await expectAsync(promise).toBeResolvedTo(result);
            expect(req.request.method).toEqual('POST');
        });
    });

    describe('registerUserAsync', function () {
        it('registers John as new user', async function () {
            const result: AuthResult = { token: getToken('John') };
            const promise = service.registerUserAsync({ id: 'john.doe@email.com', name: 'John', password: '1234.xyz' });
            const req = httpTestingController.expectOne('/api/v1/register');
            req.flush(result);
            await expectAsync(promise).toBeResolvedTo(result);
            expect(req.request.method).toEqual('POST');
        });
    });

    // describe('deleteUserAsync', function () {
    //     it('deletes a registered user', async function () {
    //         const promise = service.deleteUserAsync('john.doe@email.com', getToken('John'));
    //         const req = httpTestingController.expectOne('/api/v1/users/am9obi5kb2VAZW1haWwuY29t');
    //         await expectAsync(promise).toBeResolved();
    //         expect(req.request.method).toEqual('DELETE');
    //     });
    // });

    it('getCookies', function () {
        const cookies: Cookie[] = [
            {
                name: 'Cookie1',
                data: "Hello world."
            }
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