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
import { AuthResult } from 'common';

import { RegisterFormComponent, RegisterFormResult } from '../../lib/auth/register-form/register-form.component';
import { AuthApiService } from '../../lib/auth/auth-api.service';
import { ERRORS } from '../../lib/types/errors';
import { getToken } from '../assets/json-web-token';

describe('RegisterFormComponent', () => {
    let component: RegisterFormComponent;
    let fixture: ComponentFixture<RegisterFormComponent>;
    let modal: NgbActiveModal;
    let api: AuthApiService;
    let token: string;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [RegisterFormComponent],
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
        fixture = TestBed.createComponent(RegisterFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        token = getToken('John');
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('registers a new user', fakeAsync(async () => {
        const result: RegisterFormResult = { stayLoggedIn: true, token: token };
        spyOn(modal, 'close').and.callFake((...args) => expect(args[0]).toEqual(result));
        spyOn(api, 'registerUserAsync').and.returnValue(new Promise<AuthResult>((result) => result({ token })));

        component.userId = 'john.doe@email.com';
        component.name = 'John Doe';
        component.password1 = '1234.Zyx';
        component.password2 = '1234.Zyx';
        component.stayLoggedIn = true;
        await component.submit();
        expect(component.messages.length).toEqual(0);
        expect(modal.close).toHaveBeenCalled();
    }));

    it('does not register a user with empty e-mail', fakeAsync(async () => {
        component.userId = '';
        component.passwordAsEMail = true;
        await component.submit();
        expect(component.messages.length).toEqual(1);
        expect(component.messages[0]).toEqual(ERRORS.EMAIL_REQUIRED);
    }));

    it('does not register a user with invalid e-mail', fakeAsync(async () => {
        component.userId = 'invalidEMail';
        component.passwordAsEMail = true;
        await component.submit();
        expect(component.messages.length).toEqual(1);
        expect(component.messages[0]).toEqual(ERRORS.INVALID_EMAIL);
    }));

    it('does not register a user with empty password', fakeAsync(async () => {
        component.userId = 'john.doe@email.com';
        component.password1 = '';
        await component.submit();
        expect(component.messages.length).toEqual(1);
        expect(component.messages[0]).toEqual(ERRORS.PASSWORD_REQUIRED);
    }));

    it('does not register a user with invalid password', fakeAsync(async () => {
        component.userId = 'john.doe@email.com';
        component.password1 = '123';
        await component.submit();
        expect(component.messages.length).toEqual(1);
        expect(component.messages[0]).toEqual(ERRORS.INVALID_PASSWORD);
    }));

    it('does not register a user while invalid confirmed password', fakeAsync(async () => {
        component.userId = 'john.doe@email.com';
        component.password1 = '1234.Zyx';
        component.password1 = 'Abcd.098';
        await component.submit();
        expect(component.messages.length).toEqual(1);
        expect(component.messages[0]).toEqual(ERRORS.PASSWORDS_NOT_EQUAL);
    }));
});