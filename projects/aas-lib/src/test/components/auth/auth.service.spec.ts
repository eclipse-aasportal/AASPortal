/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { jest } from '@jest/globals';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { EMPTY, first, map, of } from 'rxjs';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

import { WINDOW } from '../../../lib/services/window.service';
import { NotifyService } from '../../../lib/components/notify/notify.service';
import { AuthApiService } from '../../../lib/components/auth/auth-api.service';
import { AuthService } from '../../../lib/components/auth/auth.service';
import { getToken } from '../../assets/json-web-token';
import { LoginFormResult } from '../../../lib/components/auth/login-form/login-form.component';
import { RegisterFormResult } from '../../../lib/components/auth/register-form/register-form.component';
import { ProfileFormResult } from '../../../lib/components/auth/profile-form/profile-form.component';
import { createSpyObj, DoneFn, FakeLoader } from '../../mocks';

describe('AuthService', () => {
    let service: AuthService;
    let window: jest.Mocked<Window>;
    let api: jest.Mocked<AuthApiService>;
    let modal: NgbModal;

    describe('anonym', () => {
        beforeEach(() => {
            api = createSpyObj<AuthApiService>([
                'login',
                'register',
                'getProfile',
                'updateProfile',
                'getCookies',
                'getCookie',
                'setCookie',
                'deleteCookie',
            ]);

            api.getCookies.mockReturnValue(EMPTY);

            const localStorage = createSpyObj<Storage>(['getItem', 'setItem', 'removeItem', 'clear']);

            localStorage.getItem.mockReturnValue(null);
            window = createSpyObj<Window>(['confirm'], { localStorage });

            TestBed.configureTestingModule({
                imports: [],
                providers: [
                    {
                        provide: WINDOW,
                        useValue: window,
                    },
                    {
                        provide: NotifyService,
                        useValue: createSpyObj<NotifyService>(['error']),
                    },
                    {
                        provide: AuthApiService,
                        useValue: api,
                    },
                    provideTranslateService({
                        loader: {
                            provide: TranslateLoader,
                            useClass: FakeLoader,
                        },
                    }),
                    provideHttpClient(withInterceptorsFromDi()),
                    provideHttpClientTesting(),
                    provideZonelessChangeDetection(),
                ],
            });

            service = TestBed.inject(AuthService);
            modal = TestBed.inject(NgbModal);
        });

        it('should be created', () => {
            expect(service).toBeTruthy();
            expect(service.payload()).toBeUndefined();
            expect(service.email()).toBeUndefined();
            expect(service.authenticated()).toBe(false);
            expect(service.name()).toBeUndefined();
            expect(service.role()).toBeUndefined();
        });

        describe('isAuthorized', () => {
            it('indicates that a guest is authorized as guest', () => {
                expect(service.isAuthorized(undefined)).toBe(true);
            });

            it('indicates that a guest is not authorized as editor', () => {
                expect(service.isAuthorized(['editor'])).toBe(false);
            });

            it('indicates that a guest is not authorized as admin', () => {
                expect(service.isAuthorized(['admin'])).toBe(false);
            });
        });

        describe('login', () => {
            let newToken: string;

            beforeEach(() => {
                newToken = getToken('John');
            });

            it('can login as arguments', function (done: DoneFn) {
                api.login.mockReturnValue(of({ token: newToken }));
                service
                    .login({ id: 'john.doe@email.com', password: 'password' })
                    .pipe(map(() => service.payload()))
                    .subscribe(value => {
                        expect(value).toBeTruthy();
                        expect(service.email()).toEqual('john.doe@email.com');
                        expect(service.authenticated()).toBe(true);
                        expect(service.name()).toEqual('John');
                        expect(service.role()).toEqual('editor');
                        done();
                    });
            });

            it('can login via form', function (done: DoneFn) {
                api.login.mockReturnValue(of({ token: newToken }));

                jest.spyOn(modal, 'open').mockReturnValue(
                    createSpyObj<NgbModalRef>(
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
                        expect(service.authenticated()).toBe(true);
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
                api.register.mockReturnValue(of({ token: newToken }));

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
                        expect(service.authenticated()).toBe(true);
                        expect(service.name()).toEqual('John');
                        expect(service.role()).toEqual('editor');
                        done();
                    });
            });

            it('allows registering a new user via form', function (done: DoneFn) {
                api.register.mockReturnValue(of({ token: newToken }));

                jest.spyOn(modal, 'open').mockReturnValue(
                    createSpyObj<NgbModalRef>(
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
                        expect(service.authenticated()).toBe(true);
                        expect(service.name()).toEqual('John');
                        expect(service.role()).toEqual('editor');
                        done();
                    });
            });

            describe('logout', () => {
                it('throws an error when try to logout', (done: DoneFn) => {
                    service.logout().subscribe({
                        error: error => {
                            expect(error).toBeTruthy();
                            done();
                        },
                    });
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
            api = createSpyObj<AuthApiService>([
                'login',
                'register',
                'getCookie',
                'getCookies',
                'getProfile',
                'updateProfile',
                'setCookie',
                'deleteCookie',
                'delete',
            ]);

            api.getProfile.mockReturnValue(of({ id: 'john.doe@email.com', name: 'John Doe' }));

            const localStorage = createSpyObj<Storage>(['getItem', 'setItem', 'removeItem', 'clear']);

            localStorage.getItem.mockImplementation(name => {
                return name === '.StayLoggedIn' ? 'true' : token;
            });

            window = createSpyObj<Window>(['confirm'], { localStorage });

            TestBed.configureTestingModule({
                declarations: [],
                imports: [
                    TranslateModule.forRoot({
                        loader: {
                            provide: TranslateLoader,
                            useClass: FakeLoader,
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
                        useValue: createSpyObj<NotifyService>(['error']),
                    },
                    {
                        provide: AuthApiService,
                        useValue: api,
                    },
                    provideHttpClient(withInterceptorsFromDi()),
                    provideHttpClientTesting(),
                    provideZonelessChangeDetection(),
                ],
            });

            service = TestBed.inject(AuthService);
            modal = TestBed.inject(NgbModal);
        });

        it('should be created', () => {
            expect(service).toBeTruthy();
            expect(service.payload()).toBeTruthy();
            expect(service.email()).toEqual('john.doe@email.com');
            expect(service.authenticated()).toBe(true);
            expect(service.name()).toEqual('John');
            expect(service.role()).toEqual('editor');
        });

        it('provides a valid user token', () => {
            expect(service).toBeTruthy();
        });

        describe('isAuthorized', () => {
            it('indicates that the user is authorized as guest', () => {
                expect(service.isAuthorized(undefined)).toBe(true);
            });

            it('indicates that a guest is authorized as editor', () => {
                expect(service.isAuthorized(['editor'])).toBe(true);
            });

            it('indicates that a guest is not authorized as admin', () => {
                expect(service.isAuthorized(['admin'])).toBe(false);
            });
        });

        describe('logout', () => {
            beforeEach(() => {});

            it('logs out the current user', function (done: DoneFn) {
                service.logout().subscribe(value => {
                    expect(value).toBeUndefined();
                    expect(service.email()).toBeUndefined();
                    expect(service.authenticated()).toBe(false);
                    expect(service.name()).toBeUndefined();
                    expect(service.role()).toBeUndefined();
                    done();
                });
            });
        });

        describe('updateUserProfile', () => {
            let newToken: string;
            let guestToken: string;

            beforeEach(() => {
                newToken = getToken('John Doe');
            });

            it('updates the user profile via argument', (done: DoneFn) => {
                api.updateProfile.mockReturnValue(of({ token: newToken }));

                service
                    .updateUserProfile({ id: 'john.doe@email.com', name: 'John Doe' })
                    .pipe(map(() => service.payload()))
                    .subscribe(value => {
                        expect(value).toBeTruthy();
                        expect(service.email()).toEqual('john.doe@email.com');
                        expect(service.authenticated()).toBe(true);
                        expect(service.name()).toEqual('John Doe');
                        expect(service.role()).toEqual('editor');
                        done();
                    });
            });

            it('updates the user profile via form', (done: DoneFn) => {
                api.updateProfile.mockReturnValue(of({ token: newToken }));
                jest.spyOn(modal, 'open').mockReturnValue(
                    createSpyObj<NgbModalRef>(
                        {},
                        {
                            result: new Promise<ProfileFormResult>(resolve => resolve({ token: newToken })),
                            componentInstance: { initialize: jest.fn() },
                        },
                    ),
                );

                service
                    .updateUserProfile()
                    .pipe(map(() => service.payload()))
                    .subscribe(value => {
                        expect(value).toBeTruthy();
                        expect(service.email()).toEqual('john.doe@email.com');
                        expect(service.authenticated()).toBe(true);
                        expect(service.name()).toEqual('John Doe');
                        expect(service.role()).toEqual('editor');
                        done();
                    });
            });

            it('deletes a user via form', (done: DoneFn) => {
                api.delete.mockReturnValue(of(void 0));
                window.confirm.mockReturnValue(true);
                jest.spyOn(modal, 'open').mockReturnValue(
                    createSpyObj<NgbModalRef>(
                        {},
                        {
                            result: new Promise<ProfileFormResult>(resolve => resolve({ action: 'deleteUser' })),
                            componentInstance: { initialize: jest.fn() },
                        },
                    ),
                );

                service
                    .updateUserProfile()
                    .pipe(map(() => service.payload()))
                    .subscribe(value => {
                        expect(value).toBeUndefined();
                        expect(service.email()).toBeUndefined();
                        expect(service.authenticated()).toBe(false);
                        expect(service.name()).toBeUndefined();
                        expect(service.role()).toBeUndefined();
                        done();
                    });
            });
        });

        describe('getCookie', () => {
            it('returns the value of "Cookie1"', (done: DoneFn) => {
                api.getCookie.mockReturnValue(
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
                api.getCookie.mockReturnValue(
                    of({ name: 'Cookie', data: 'The quick brown fox jumps over the lazy dog.' }),
                );

                service.checkCookie('Cookie1').subscribe(value => {
                    expect(value).toBe(true);
                    done();
                });
            });

            it('indicates that "Unknown" not exist', (done: DoneFn) => {
                api.getCookie.mockReturnValue(of(undefined));
                service.checkCookie('Unknown').subscribe(value => {
                    expect(value).toBe(false);
                    done();
                });
            });
        });

        describe('deleteCookie', () => {
            it('deletes a cookie', (done: DoneFn) => {
                api.deleteCookie.mockReturnValue(of(void 0));
                service.deleteCookie('Cookie1').subscribe(() => {
                    expect(api.deleteCookie).toHaveBeenCalledWith('john.doe@email.com', 'Cookie1');
                    done();
                });
            });
        });
    });
});
