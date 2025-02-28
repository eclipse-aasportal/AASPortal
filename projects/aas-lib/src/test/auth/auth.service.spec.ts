/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { EMPTY, first, map, of, skipWhile } from 'rxjs';

import { WINDOW } from '../../lib/window.service';
import { NotifyService } from '../../lib/notify/notify.service';
import { AuthApiService } from '../../lib/auth/auth-api.service';
import { AuthService } from '../../lib/auth/auth.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { getGuestToken, getToken } from '../assets/json-web-token';
import { LoginFormResult } from '../../lib/auth/login-form/login-form.component';
import { RegisterFormResult } from '../../lib/auth/register-form/register-form.component';
import { ProfileFormResult } from '../../lib/auth/profile-form/profile-form.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('AuthService', () => {
    let service: AuthService;
    let window: jasmine.SpyObj<Window>;
    let api: jasmine.SpyObj<AuthApiService>;
    let modal: NgbModal;

    describe('guest', () => {
        let token: string;

        beforeEach(() => {
            token = getGuestToken();
            api = jasmine.createSpyObj<AuthApiService>([
                'login',
                'guest',
                'register',
                'getProfile',
                'updateProfile',
                'getCookies',
                'getCookie',
                'setCookie',
                'deleteCookie',
            ]);

            api.guest.and.returnValue(of({ token }));
            api.getCookies.and.returnValue(EMPTY);

            const localStorage = jasmine.createSpyObj<Storage>([
                'getItem',
                'setItem',
                'removeItem',
                'clear',
            ]);

            localStorage.getItem.and.returnValue(null);
            window = jasmine.createSpyObj<Window>(['confirm'], { localStorage })

            TestBed.configureTestingModule({
                declarations: [],
                imports: [
                    TranslateModule.forRoot({
                        loader: {
                            provide: TranslateLoader,
                            useClass: TranslateFakeLoader,
                        },
                    }),
                ],
                providers: [
                    {
                        provide: WINDOW,
                        useValue: window,
                    },
                    {
                        provide: NotifyService,
                        useValue: jasmine.createSpyObj<NotifyService>(['error']),
                    },
                    {
                        provide: AuthApiService,
                        useValue: api,
                    },
                    provideHttpClient(withInterceptorsFromDi()),
                    provideHttpClientTesting(),
                ],
            });

            service = TestBed.inject(AuthService);
            modal = TestBed.inject(NgbModal);
        });

        it('should be created', () => {
            expect(service).toBeTruthy();
            expect(service.payload()).toBeTruthy();
            expect(service.email()).toBeUndefined();
            expect(service.authenticated()).toBeFalse();
            expect(service.name()).toEqual('GUEST_USER');
            expect(service.role()).toEqual('guest');
        });

        describe('isAuthorized', () => {
            it('indicates that a guest is authorized as guest', () => {
                expect(service.isAuthorized('guest')).toBeTrue();
            });

            it('indicates that a guest is not authorized as editor', () => {
                expect(service.isAuthorized('editor')).toBeFalse();
            });

            it('indicates that a guest is not authorized as admin', () => {
                expect(service.isAuthorized('admin')).toBeFalse();
            });
        });

        describe('login', () => {
            let newToken: string;

            beforeEach(() => {
                newToken = getToken('John');
            });

            it('can login as arguments', function (done: DoneFn) {
                api.login.and.returnValue(of({ token: newToken }));
                service
                    .login({ id: 'john.doe@email.com', password: 'password' })
                    .pipe(map(() => service.payload()))
                    .subscribe(value => {
                        expect(value).toBeTruthy();
                        expect(service.email()).toEqual('john.doe@email.com');
                        expect(service.authenticated()).toBeTrue();
                        expect(service.name()).toEqual('John');
                        expect(service.role()).toEqual('editor');
                        done();
                    });
            });

            it('can login via form', function (done: DoneFn) {
                api.login.and.returnValue(of({ token: newToken }));

                spyOn(modal, 'open').and.returnValue(
                    jasmine.createSpyObj<NgbModalRef>(
                        {},
                        {
                            result: new Promise<LoginFormResult>(resolve =>
                                resolve({ stayLoggedIn: true, token: newToken }),
                            ),
                        },
                    ),
                );

                service
                    .login()
                    .pipe(map(() => service.payload()))
                    .subscribe(value => {
                        expect(value).toBeTruthy();
                        expect(service.email()).toEqual('john.doe@email.com');
                        expect(service.authenticated()).toBeTrue();
                        expect(service.name()).toEqual('John');
                        expect(service.role()).toEqual('editor');
                        done();
                    });
            });
        });

        describe('register', () => {
            let newToken: string;

            beforeEach(() => {
                newToken = getToken('John');
            });

            it('allows registering a new user via arguments', function (done: DoneFn) {
                api.register.and.returnValue(of({ token: newToken }));

                service
                    .register({
                        id: 'john.doe@email.com',
                        name: 'John',
                        password: '1234.xyz',
                    })
                    .pipe(map(() => service.payload()))
                    .subscribe(value => {
                        expect(value).toBeTruthy();
                        expect(service.email()).toEqual('john.doe@email.com');
                        expect(service.authenticated()).toBeTrue();
                        expect(service.name()).toEqual('John');
                        expect(service.role()).toEqual('editor');
                        done();
                    });
            });

            it('allows registering a new user via form', function (done: DoneFn) {
                api.register.and.returnValue(of({ token: newToken }));

                spyOn(modal, 'open').and.returnValue(
                    jasmine.createSpyObj<NgbModalRef>(
                        {},
                        {
                            result: new Promise<RegisterFormResult>(resolve =>
                                resolve({ stayLoggedIn: true, token: newToken }),
                            ),
                        },
                    ),
                );

                service
                    .register()
                    .pipe(map(() => service.payload()))
                    .subscribe(value => {
                        expect(value).toBeTruthy();
                        expect(service.email()).toEqual('john.doe@email.com');
                        expect(service.authenticated()).toBeTrue();
                        expect(service.name()).toEqual('John');
                        expect(service.role()).toEqual('editor');
                        done();
                    });
            });

            describe('logout', () => {
                it('throws an error when try to logout', () => {
                    service.logout().subscribe({ error: error => expect(error).toBeTruthy() });
                });
            });

            describe('updateProfile', () => {
                it('throw an error for a guest login', async () => {
                    service.updateUserProfile().subscribe({ error: error => expect(error).toBeTruthy() });
                });
            });
        });
    });

    describe('authorized user', () => {
        let token: string;

        beforeEach(() => {
            token = getToken('John');
            api = jasmine.createSpyObj<AuthApiService>([
                'login',
                'guest',
                'register',
                'getCookie',
                'getCookies',
                'getProfile',
                'updateProfile',
                'setCookie',
                'deleteCookie',
                'delete',
            ]);

            api.getProfile.and.returnValue(of({ id: 'john.doe@email.com', name: 'John Doe' }));

            const localStorage = jasmine.createSpyObj<Storage>([
                'getItem',
                'setItem',
                'removeItem',
                'clear',
            ]);

            localStorage.getItem.and.callFake(name => {
                return name === '.StayLoggedIn' ? 'true' : token;
            });

            window = jasmine.createSpyObj<Window>(['confirm'], { localStorage })
            
            TestBed.configureTestingModule({
                declarations: [],
                imports: [
                    TranslateModule.forRoot({
                        loader: {
                            provide: TranslateLoader,
                            useClass: TranslateFakeLoader,
                        },
                    }),
                ],
                providers: [
                    {
                        provide: WINDOW,
                        useValue: window,
                    },
                    {
                        provide: NotifyService,
                        useValue: jasmine.createSpyObj<NotifyService>(['error']),
                    },
                    {
                        provide: AuthApiService,
                        useValue: api,
                    },
                    provideHttpClient(withInterceptorsFromDi()),
                    provideHttpClientTesting(),
                ],
            });

            service = TestBed.inject(AuthService);
            modal = TestBed.inject(NgbModal);
        });

        it('should be created', () => {
            expect(service).toBeTruthy();
            expect(service.payload()).toBeTruthy();
            expect(service.email()).toEqual('john.doe@email.com');
            expect(service.authenticated()).toBeTrue();
            expect(service.name()).toEqual('John');
            expect(service.role()).toEqual('editor');
        });

        it('provides a valid user token', () => {
            expect(service).toBeTruthy();
        });

        describe('isAuthorized', () => {
            it('indicates that the user is authorized as guest', () => {
                expect(service.isAuthorized('guest')).toBeTrue();
            });

            it('indicates that a guest is authorized as editor', () => {
                expect(service.isAuthorized('editor')).toBeTrue();
            });

            it('indicates that a guest is not authorized as admin', () => {
                expect(service.isAuthorized('admin')).toBeFalse();
            });
        });

        describe('logout', () => {
            let guestToken: string;

            beforeEach(() => {
                guestToken = getGuestToken();
            });

            it('logs out the current user', function (done: DoneFn) {
                api.guest.and.returnValue(of({ token: guestToken }));

                service
                    .logout()
                    .pipe(
                        map(() => service.payload()),
                        skipWhile(value => value.sub != null),
                        first(),
                    )
                    .subscribe(value => {
                        expect(value).toBeTruthy();
                        expect(service.email()).toBeUndefined();
                        expect(service.authenticated()).toBeFalse();
                        expect(service.name()).toEqual('GUEST_USER');
                        expect(service.role()).toEqual('guest');
                        done();
                    });
            });
        });

        describe('updateUserProfileAsync', () => {
            let newToken: string;
            let guestToken: string;

            beforeEach(() => {
                newToken = getToken('John Doe');
                guestToken = getGuestToken();
            });

            it('updates the user profile via argument', (done: DoneFn) => {
                api.updateProfile.and.returnValue(of({ token: newToken }));

                service
                    .updateUserProfile({ id: 'john.doe@email.com', name: 'John Doe' })
                    .pipe(map(() => service.payload()))
                    .subscribe(value => {
                        expect(value).toBeTruthy();
                        expect(service.email()).toEqual('john.doe@email.com');
                        expect(service.authenticated()).toBeTrue();
                        expect(service.name()).toEqual('John Doe');
                        expect(service.role()).toEqual('editor');
                        done();
                    });
            });

            it('updates the user profile via form', (done: DoneFn) => {
                api.updateProfile.and.returnValue(of({ token: newToken }));
                spyOn(modal, 'open').and.returnValue(
                    jasmine.createSpyObj<NgbModalRef>(
                        {},
                        {
                            result: new Promise<ProfileFormResult>(resolve => resolve({ token: newToken })),
                            componentInstance: { initialize: jasmine.createSpy() },
                        },
                    ),
                );

                service
                    .updateUserProfile()
                    .pipe(map(() => service.payload()))
                    .subscribe(value => {
                        expect(value).toBeTruthy();
                        expect(service.email()).toEqual('john.doe@email.com');
                        expect(service.authenticated()).toBeTrue();
                        expect(service.name()).toEqual('John Doe');
                        expect(service.role()).toEqual('editor');
                        done();
                    });
            });

            it('deletes a user via form', (done: DoneFn) => {
                api.delete.and.returnValue(of(void 0));
                api.guest.and.returnValue(of({ token: guestToken }));
                window.confirm.and.returnValue(true);
                spyOn(modal, 'open').and.returnValue(
                    jasmine.createSpyObj<NgbModalRef>(
                        {},
                        {
                            result: new Promise<ProfileFormResult>(resolve => resolve({ action: 'deleteUser' })),
                            componentInstance: { initialize: jasmine.createSpy() },
                        },
                    ),
                );

                service
                    .updateUserProfile()
                    .pipe(map(() => service.payload()))
                    .subscribe(value => {
                        expect(value).toBeTruthy();
                        expect(service.email()).toBeUndefined();
                        expect(service.authenticated()).toBeFalse();
                        expect(service.name()).toEqual('GUEST_USER');
                        expect(service.role()).toEqual('guest');
                        done();
                    });
            });
        });

        describe('getCookie', () => {
            it('returns the value of "Cookie1"', (done: DoneFn) => {
                api.getCookie.and.returnValue(
                    of({ name: 'Cookie', data: 'The quick brown fox jumps over the lazy dog.' }),
                );

                service
                    .getCookie('Cookie1')
                    .pipe(first())
                    .subscribe(value => {
                        expect(value).toEqual('The quick brown fox jumps over the lazy dog.');
                        done();
                    });
            });
        });

        describe('checkCookie', () => {
            it('indicates that "Cookie1" exist', (done: DoneFn) => {
                api.getCookie.and.returnValue(
                    of({ name: 'Cookie', data: 'The quick brown fox jumps over the lazy dog.' }),
                );

                service.checkCookie('Cookie1').subscribe(value => {
                    expect(value).toBeTrue();
                    done();
                });
            });

            it('indicates that "Unknown" not exist', (done: DoneFn) => {
                api.getCookie.and.returnValue(of(undefined));
                service.checkCookie('Unknown').subscribe(value => {
                    expect(value).toBeFalse();
                    done();
                });
            });
        });

        describe('deleteCookie', () => {
            it('deletes a cookie', (done: DoneFn) => {
                api.deleteCookie.and.returnValue(of(void 0));
                service.deleteCookie('Cookie1').subscribe(() => {
                    expect(api.deleteCookie).toHaveBeenCalledWith('john.doe@email.com', 'Cookie1');
                    done();
                });
            });
        });
    });
});