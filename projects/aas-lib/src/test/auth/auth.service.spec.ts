/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { EMPTY, first, of, skip, skipWhile } from 'rxjs';

import { WindowService } from '../../lib/window.service';
import { NotifyService } from '../../lib/notify/notify.service';
import { AuthApiService } from '../../lib/auth/auth-api.service';
import { AuthService } from '../../lib/auth/auth.service';
import { AuthResult } from 'common';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { LoginFormResult, ProfileFormResult, RegisterFormResult } from 'src/public-api';
import { getGuestToken, getToken } from '../assets/json-web-token';

describe('AuthService', () => {
    let service: AuthService;
    let window: jasmine.SpyObj<WindowService>;
    let api: jasmine.SpyObj<AuthApiService>;
    let modal: NgbModal;

    describe('guest', function () {
        let token: string;

        beforeEach(function () {
            token = getGuestToken();
            api = jasmine.createSpyObj<AuthApiService>(
                ['loginAsync', 'guestAsync', 'registerUserAsync', 'getCookies', 'updateProfileAsync']);

            api.guestAsync.and.returnValue(new Promise<AuthResult>(resolve => resolve({ token })));
            api.getCookies.and.returnValue(EMPTY);

            window = jasmine.createSpyObj<WindowService>(
                ['getLocalStorageItem', 'setLocalStorageItem', 'removeLocalStorageItem', 'clearLocalStorage']);

            window.getLocalStorageItem.and.returnValue(null);

            TestBed.configureTestingModule({
                declarations: [],
                providers: [
                    {
                        provide: WindowService,
                        useValue: window
                    },
                    {
                        provide: NotifyService,
                        useValue: jasmine.createSpyObj<NotifyService>(['error'])
                    },
                    {
                        provide: AuthApiService,
                        useValue: api
                    }
                ],
                imports: [
                    HttpClientTestingModule,
                    TranslateModule.forRoot({
                        loader: {
                            provide: TranslateLoader,
                            useClass: TranslateFakeLoader
                        }
                    })
                ]
            });

            service = TestBed.inject(AuthService);
            modal = TestBed.inject(NgbModal);
        });

        it('should be created', (done: DoneFn) => {
            expect(service).toBeTruthy();

            service.payload.pipe(skip(1), first()).subscribe((value) => {
                expect(value).toBeTruthy();
                expect(service.userId).toBeUndefined();
                expect(service.authenticated).toBeFalse();
                expect(service.name).toEqual('GUEST_USER');
                expect(service.role).toEqual('guest');
                done();
            });
        });

        it('provides a valid guest token', () => {
            expect(service).toBeTruthy();
        });

        describe('isAuthorized', function () {
            it('indicates that a guest is authorized as guest', function () {
                expect(service.isAuthorized('guest')).toBeTrue();
            });

            it('indicates that a guest is not authorized as editor', function () {
                expect(service.isAuthorized('editor')).toBeFalse();
            });

            it('indicates that a guest is not authorized as admin', function () {
                expect(service.isAuthorized('admin')).toBeFalse();
            });
        });

        describe('loginAsync', function () {
            let newToken: string;

            beforeEach(function () {
                newToken = getToken('John');
            });

            it('can login as arguments', function (done: DoneFn) {
                api.loginAsync.and.returnValue(new Promise<AuthResult>(resolve => resolve({ token: newToken })));
                service.loginAsync({ id: 'john.doe@email.com', password: 'password' });

                service.payload.pipe(skipWhile(value => value.sub == null), first()).subscribe((value) => {
                    expect(value).toBeTruthy();
                    expect(service.userId).toEqual('john.doe@email.com');
                    expect(service.authenticated).toBeTrue();
                    expect(service.name).toEqual('John');
                    expect(service.role).toEqual('editor');
                    done();
                });
            });

            it('can login via form', function (done: DoneFn) {
                api.loginAsync.and.returnValue(new Promise<AuthResult>(resolve => resolve({ token: newToken })));
                service.loginAsync({ id: 'john.doe@email.com', password: 'password' });

                spyOn(modal, 'open').and.returnValue(jasmine.createSpyObj<NgbModalRef>({}, {
                    result: new Promise<LoginFormResult>(resolve => resolve({ stayLoggedIn: true, token: newToken }))
                }));

                service.loginAsync();
                service.payload.pipe(skipWhile(value => value.sub == null), first()).subscribe((value) => {
                    expect(value).toBeTruthy();
                    expect(service.userId).toEqual('john.doe@email.com');
                    expect(service.authenticated).toBeTrue();
                    expect(service.name).toEqual('John');
                    expect(service.role).toEqual('editor');
                    done();
                });
            });
        });

        describe('registerAsync', function () {
            let newToken: string;

            beforeEach(function () {
                newToken = getToken('John');
            });

            it('allows registering a new user via arguments', function (done: DoneFn) {
                api.registerUserAsync.and.returnValue(new Promise<AuthResult>(resolve => resolve({ token: newToken })));

                service.registerAsync({
                    id: 'john.doe@email.com',
                    name: 'John',
                    password: '1234.xyz'
                });

                service.payload.pipe(skipWhile(value => value.sub == null), first()).subscribe((value) => {
                    expect(value).toBeTruthy();
                    expect(service.userId).toEqual('john.doe@email.com');
                    expect(service.authenticated).toBeTrue();
                    expect(service.name).toEqual('John');
                    expect(service.role).toEqual('editor');
                    done();
                });
            });

            it('allows registering a new user via form', function (done: DoneFn) {
                api.registerUserAsync.and.returnValue(new Promise<AuthResult>(resolve => resolve({ token: newToken })));

                spyOn(modal, 'open').and.returnValue(jasmine.createSpyObj<NgbModalRef>({}, {
                    result: new Promise<RegisterFormResult>(resolve => resolve({ stayLoggedIn: true, token: newToken }))
                }));

                service.registerAsync();

                service.payload.pipe(skipWhile(value => value.sub == null), first()).subscribe((value) => {
                    expect(value).toBeTruthy();
                    expect(service.userId).toEqual('john.doe@email.com');
                    expect(service.authenticated).toBeTrue();
                    expect(service.name).toEqual('John');
                    expect(service.role).toEqual('editor');
                    done();
                });
            });

            describe('logoutUserAsync', function () {
                it('throws an error when try to logout', async function () {
                    await expectAsync(service.logoutAsync()).toBeRejected();
                });
            });

            describe('updateUserProfileAsync', function () {
                it('throw an error for a guest login', async function () {
                    await expectAsync(service.updateUserProfileAsync()).toBeRejected();
                });
            });

        });
    });

    describe('authorized user', function () {
        let token: string;

        beforeEach(function () {
            token = getToken('John');
            api = jasmine.createSpyObj<AuthApiService>(
                ['loginAsync', 'guestAsync', 'registerUserAsync', 'getCookies', 'updateProfileAsync', 'setCookie', 'deleteCookie', 'deleteUserAsync']);

            api.getCookies.and.returnValue(of([{ name: 'Cookie1', data: 'The quick brown fox jumps over the lazy dog.' }]));
            window = jasmine.createSpyObj<WindowService>(
                ['getLocalStorageItem', 'setLocalStorageItem', 'removeLocalStorageItem', 'clearLocalStorage', 'confirm']);

            window.getLocalStorageItem.and.callFake(name => {
                return name === '.StayLoggedIn' ? 'true' : token;
            });

            TestBed.configureTestingModule({
                declarations: [],
                providers: [
                    {
                        provide: WindowService,
                        useValue: window
                    },
                    {
                        provide: NotifyService,
                        useValue: jasmine.createSpyObj<NotifyService>(['error'])
                    },
                    {
                        provide: AuthApiService,
                        useValue: api
                    }
                ],
                imports: [
                    HttpClientTestingModule,
                    TranslateModule.forRoot({
                        loader: {
                            provide: TranslateLoader,
                            useClass: TranslateFakeLoader
                        }
                    })
                ]
            });

            service = TestBed.inject(AuthService);
            modal = TestBed.inject(NgbModal);
        });

        it('should be created', (done: DoneFn) => {
            expect(service).toBeTruthy();

            service.payload.pipe(first()).subscribe((value) => {
                expect(value).toBeTruthy();
                expect(service.userId).toEqual('john.doe@email.com');
                expect(service.authenticated).toBeTrue();
                expect(service.name).toEqual('John');
                expect(service.role).toEqual('editor');
                done();
            });
        });

        it('provides a valid user token', () => {
            expect(service).toBeTruthy();
        });

        describe('isAuthorized', function () {
            it('indicates that the user is authorized as guest', function () {
                expect(service.isAuthorized('guest')).toBeTrue();
            });

            it('indicates that a guest is authorized as editor', function () {
                expect(service.isAuthorized('editor')).toBeTrue();
            });

            it('indicates that a guest is not authorized as admin', function () {
                expect(service.isAuthorized('admin')).toBeFalse();
            });
        });

        describe('logoutUserAsync', function () {
            let guestToken: string;

            beforeEach(function () {
                guestToken = getGuestToken();
            });

            it('logs out the current user', function (done: DoneFn) {
                api.guestAsync.and.returnValue(new Promise<AuthResult>(resolve => resolve({ token: guestToken })));

                service.logoutAsync();

                service.payload.pipe(skipWhile(value => value.sub != null), first()).subscribe((value) => {
                    expect(value).toBeTruthy();
                    expect(service.userId).toBeUndefined();
                    expect(service.authenticated).toBeFalse();
                    expect(service.name).toEqual('GUEST_USER');
                    expect(service.role).toEqual('guest');
                    done();
                });
            });
        });

        describe('updateUserProfileAsync', function () {
            let newToken: string;
            let guestToken: string;

            beforeEach(function () {
                newToken = getToken('John Doe');
                guestToken = getGuestToken();
            });

            it('updates the user profile via argument', function (done: DoneFn) {
                api.updateProfileAsync.and.returnValue(new Promise<AuthResult>(resolve => resolve({ token: newToken })))

                service.updateUserProfileAsync({ id: 'john.doe@email.com', name: 'John Doe' });

                service.payload.pipe(skipWhile(value => value.name !== 'John Doe'), first()).subscribe((value) => {
                    expect(value).toBeTruthy();
                    expect(service.userId).toEqual('john.doe@email.com');
                    expect(service.authenticated).toBeTrue();
                    expect(service.name).toEqual('John Doe');
                    expect(service.role).toEqual('editor');
                    done();
                });
            });

            it('updates the user profile via form', function (done: DoneFn) {
                api.updateProfileAsync.and.returnValue(new Promise<AuthResult>(resolve => resolve({ token: newToken })))

                spyOn(modal, 'open').and.returnValue(jasmine.createSpyObj<NgbModalRef>({}, {
                    result: new Promise<ProfileFormResult>(resolve => resolve({ token: newToken })),
                    componentInstance: { initialize: jasmine.createSpy() }
                }));

                service.updateUserProfileAsync();

                service.payload.pipe(skipWhile(value => value.name !== 'John Doe'), first()).subscribe((value) => {
                    expect(value).toBeTruthy();
                    expect(service.userId).toEqual('john.doe@email.com');
                    expect(service.authenticated).toBeTrue();
                    expect(service.name).toEqual('John Doe');
                    expect(service.role).toEqual('editor');
                    done();
                });
            });

            it('deletes a user via form', function (done: DoneFn) {
                api.deleteUserAsync.and.returnValue(new Promise<void>(resolve => resolve()))
                api.guestAsync.and.returnValue(new Promise<AuthResult>(resolve => resolve({ token: guestToken })));
                window.confirm.and.returnValue(true);
                spyOn(modal, 'open').and.returnValue(jasmine.createSpyObj<NgbModalRef>({}, {
                    result: new Promise<ProfileFormResult>(resolve => resolve({ action: 'deleteUser' })),
                    componentInstance: { initialize: jasmine.createSpy() }
                }));

                service.updateUserProfileAsync();

                service.payload.pipe(skipWhile(value => value.sub != null), first()).subscribe((value) => {
                    expect(value).toBeTruthy();
                    expect(service.userId).toBeUndefined();
                    expect(service.authenticated).toBeFalse();
                    expect(service.name).toEqual('GUEST_USER');
                    expect(service.role).toEqual('guest');
                    done();
                });
            });
        });

        describe('getCookie', function () {
            it('returns the value of "Cookie1"', function () {
                expect(service.getCookie('Cookie1')).toEqual('The quick brown fox jumps over the lazy dog.');
            });

        });

        describe('checkCookie', function () {
            it('indicates that "Cookie1" exist', function () {
                expect(service.checkCookie('Cookie1')).toBeTrue();
            });

            it('indicates that "Unknown" not exist', function () {
                expect(service.checkCookie('Unknown')).toBeFalse();
            });

        });

        describe('deleteCookie', function () {
            it('deletes a cookie', function (done: DoneFn) {
                api.deleteCookie.and.returnValue(of(void 0));
                api.getCookies.and.returnValue(of([]));

                service.deleteCookie('Cookie1').subscribe(() => {
                    expect(service.checkCookie('Cookie1')).toBeFalse();
                    done();
                })
            });
        });
    });
});
