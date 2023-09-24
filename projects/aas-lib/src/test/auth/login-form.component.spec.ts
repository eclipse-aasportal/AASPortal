/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { CommonModule } from '@angular/common';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, fakeAsync, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';

import { AuthApiService } from '../../lib/auth/auth-api.service';
import { ERRORS } from '../../lib/types/errors';
import { INFO } from '../../lib/types/info';
import { LoginFormComponent, LoginFormResult } from '../../lib/auth/login-form/login-form.component';
import { of, throwError } from 'rxjs';

describe('LoginFormComponent', () => {
    let component: LoginFormComponent;
    let modal: NgbActiveModal;
    let api: AuthApiService;
    let fixture: ComponentFixture<LoginFormComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [LoginFormComponent],
            providers: [
                NgbModal,
                NgbActiveModal
            ],
            imports: [
                CommonModule,
                FormsModule,
                NgbModule,
                HttpClientTestingModule,
                TranslateModule.forRoot({
                    loader: {
                        provide: TranslateLoader,
                        useClass: TranslateFakeLoader
                    }
                })
            ]
        });

        modal = TestBed.inject(NgbActiveModal);
        api = TestBed.inject(AuthApiService);
        fixture = TestBed.createComponent(LoginFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('submits a valid user', fakeAsync(async () => {
        const result: LoginFormResult = { token: 'a_token', stayLoggedIn: true };
        spyOn(modal, 'close').and.callFake((...args) => expect(args[0]).toEqual(result));
        spyOn(api, 'login').and.returnValue(of({ token: 'a_token' }));

        component.userId = 'john.doe@email.com';
        component.password = '1234.Abcd';
        component.stayLoggedIn = true;
        await component.submit();
        expect(component.messages.length).toEqual(0);
        expect(modal.close).toHaveBeenCalled();
    }));

    it('does not login a user with empty e-mail', fakeAsync(async () => {
        component.userId = '';
        component.password = '1234.Abcd';
        await component.submit();
        expect(component.messages.length).toEqual(1);
        expect(component.messages[0].text).toEqual(ERRORS.EMAIL_REQUIRED);
    }));

    it('does not login a user with invalid e-mail', fakeAsync(async () => {
        component.userId = 'invalidEMail';
        component.password = '1234.abcd';
        await component.submit();
        expect(component.messages.length).toEqual(1);
        expect(component.messages[0].text).toEqual(ERRORS.INVALID_EMAIL);
    }));

    it('does not login a user with empty password', fakeAsync(async () => {
        component.userId = 'john.doe@email.com';
        component.password = '';
        await component.submit();
        expect(component.messages.length).toEqual(1);
        expect(component.messages[0].text).toEqual(ERRORS.PASSWORD_REQUIRED);
    }));

    it('does not login a user with invalid password', fakeAsync(async () => {
        component.userId = 'john.doe@email.com';
        component.password = '123';
        await component.submit();
        expect(component.messages.length).toEqual(1);
        expect(component.messages[0].text).toEqual(ERRORS.INVALID_PASSWORD);
    }));

    it('does not login an unknown user', fakeAsync(async () => {
        spyOn(modal, 'close').and.returnValue();
        spyOn(api, 'login').and.returnValue(throwError(() => new Error('Unknown user')));

        component.userId = 'unknown.user@email.com';
        component.password = '1234.abcd';
        await component.submit();
        expect(component.messages.length).toEqual(1);
        expect(component.messages[0].text).toEqual('Unknown user');
    }));

    it('supports the reset of a forgotten password', async function () {
        spyOn(api, 'resetPassword').and.returnValue(of(void 0));
        component.userId = 'john.doe@email.com';
        await component.resetPassword();
        expect(component.messages.length).toEqual(1);
        expect(component.messages[0].text).toEqual(INFO.NEW_PASSWORD_SENT);
    });

    it('can not reset password when e-mail is empty', fakeAsync(async () => {
        component.userId = '';
        await component.resetPassword();
        expect(component.messages.length).toEqual(1);
        expect(component.messages[0].text).toEqual(ERRORS.EMAIL_REQUIRED);
    }));

    it('an not reset password when e-mail is invalid', fakeAsync(async () => {
        component.userId = 'invalidEMail';
        await component.resetPassword();
        expect(component.messages.length).toEqual(1);
        expect(component.messages[0].text).toEqual(ERRORS.INVALID_EMAIL);
    }));

    it('supports navigation to the registration', function () {
        spyOn(modal, 'close').and.callFake((...args) => expect(args[0]).toEqual({ action: 'register' } as LoginFormResult));
        component.registerUser();
        expect(modal.close).toHaveBeenCalled();
    });
});