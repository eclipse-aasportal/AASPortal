/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

import { AuthApiService } from '../../../lib/components/auth/auth-api.service';
import { ERRORS } from '../../../lib/errors';
import { INFO } from '../../../lib/info';
import { LoginFormComponent, LoginFormResult } from '../../../lib/components/auth/login-form/login-form.component';

describe('LoginFormComponent', () => {
    let modal: NgbActiveModal;
    let api: AuthApiService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                LoginFormComponent,
                TranslateModule.forRoot({
                    loader: {
                        provide: TranslateLoader,
                        useClass: TranslateFakeLoader,
                    },
                }),
            ],
            providers: [
                NgbModal,
                NgbActiveModal,
                provideHttpClient(withInterceptorsFromDi()),
                provideHttpClientTesting(),
                provideZonelessChangeDetection(),
            ],
        }).compileComponents();

        modal = TestBed.inject(NgbActiveModal);
        api = TestBed.inject(AuthApiService);
    });

    it('should create', () => {
        const fixture = TestBed.createComponent(LoginFormComponent);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });

    it('submits a valid user', async () => {
        const fixture = TestBed.createComponent(LoginFormComponent);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        const result: LoginFormResult = { token: 'a_token', stayLoggedIn: true };
        spyOn(modal, 'close').and.callFake((...args) => expect(args[0]).toEqual(result));
        spyOn(api, 'login').and.returnValue(of({ token: 'a_token' }));

        component.userId.set('john.doe@email.com');
        component.password.set('1234.Abcd');
        component.stayLoggedIn.set(true);
        await component.submit();
        expect(component.messages().length).toEqual(0);
        expect(modal.close).toHaveBeenCalled();
    });

    it('does not login a user with empty e-mail', async () => {
        const fixture = TestBed.createComponent(LoginFormComponent);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        component.userId.set('');
        component.password.set('1234.Abcd');
        await component.submit();
        expect(component.messages().length).toEqual(1);
        expect(component.messages()[0].text).toEqual(ERRORS.EMAIL_REQUIRED);
    });

    it('does not login a user with invalid e-mail', async () => {
        const fixture = TestBed.createComponent(LoginFormComponent);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        component.userId.set('invalidEMail');
        component.password.set('1234.abcd');
        await component.submit();
        expect(component.messages().length).toEqual(1);
        expect(component.messages()[0].text).toEqual(ERRORS.INVALID_EMAIL);
    });

    it('does not login a user with empty password', async () => {
        const fixture = TestBed.createComponent(LoginFormComponent);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        component.userId.set('john.doe@email.com');
        component.password.set('');
        await component.submit();
        expect(component.messages().length).toEqual(1);
        expect(component.messages()[0].text).toEqual(ERRORS.PASSWORD_REQUIRED);
    });

    it('does not login a user with invalid password', async () => {
        const fixture = TestBed.createComponent(LoginFormComponent);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        component.userId.set('john.doe@email.com');
        component.password.set('123');
        await component.submit();
        expect(component.messages().length).toEqual(1);
        expect(component.messages()[0].text).toEqual(ERRORS.INVALID_PASSWORD);
    });

    it('does not login an unknown user', async () => {
        const fixture = TestBed.createComponent(LoginFormComponent);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        spyOn(modal, 'close').and.returnValue();
        spyOn(api, 'login').and.returnValue(throwError(() => new Error('Unknown user')));

        component.userId.set('unknown.user@email.com');
        component.password.set('1234.abcd');
        await component.submit();
        expect(component.messages().length).toEqual(1);
        expect(component.messages()[0].text).toEqual('Unknown user');
    });

    it('supports the reset of a forgotten password', async function () {
        const fixture = TestBed.createComponent(LoginFormComponent);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        spyOn(api, 'resetPassword').and.returnValue(of(void 0));
        component.userId.set('john.doe@email.com');
        await component.resetPassword();
        expect(component.messages().length).toEqual(1);
        expect(component.messages()[0].text).toEqual(INFO.NEW_PASSWORD_SENT);
    });

    it('can not reset password when e-mail is empty', async () => {
        const fixture = TestBed.createComponent(LoginFormComponent);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        component.userId.set('');
        await component.resetPassword();
        expect(component.messages().length).toEqual(1);
        expect(component.messages()[0].text).toEqual(ERRORS.EMAIL_REQUIRED);
    });

    it('an not reset password when e-mail is invalid', async () => {
        const fixture = TestBed.createComponent(LoginFormComponent);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        component.userId.set('invalidEMail');
        await component.resetPassword();
        expect(component.messages().length).toEqual(1);
        expect(component.messages()[0].text).toEqual(ERRORS.INVALID_EMAIL);
    });

    it('supports navigation to the registration', function () {
        const fixture = TestBed.createComponent(LoginFormComponent);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        spyOn(modal, 'close').and.callFake((...args) =>
            expect(args[0]).toEqual({ action: 'register' } as LoginFormResult),
        );

        component.registerUser();
        expect(modal.close).toHaveBeenCalled();
    });
});
