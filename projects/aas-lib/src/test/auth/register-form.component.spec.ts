/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, fakeAsync, TestBed } from '@angular/core/testing';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateFakeLoader, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { RegisterFormComponent, RegisterFormResult } from '../../lib/auth/register-form/register-form.component';
import { AuthApiService } from '../../lib/auth/auth-api.service';
import { ERRORS } from '../../lib/errors';
import { getToken } from '../assets/json-web-token';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('RegisterFormComponent', () => {
    let component: RegisterFormComponent;
    let fixture: ComponentFixture<RegisterFormComponent>;
    let modal: NgbActiveModal;
    let api: AuthApiService;
    let token: string;

    beforeEach(() => {
        TestBed.configureTestingModule({
    imports: [TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useClass: TranslateFakeLoader,
            },
        })],
    providers: [NgbModal, NgbActiveModal, provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
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
        spyOn(api, 'register').and.returnValue(of({ token }));

        component.userId.set('john.doe@email.com');
        component.name.set('John Doe');
        component.password1.set('1234.Zyx');
        component.password2.set('1234.Zyx');
        component.stayLoggedIn.set(true);
        await component.submit();
        expect(component.messages().length).toEqual(0);
        expect(modal.close).toHaveBeenCalled();
    }));

    it('does not register a user with empty e-mail', fakeAsync(async () => {
        component.userId.set('');
        component.passwordAsEMail.set(true);
        await component.submit();
        expect(component.messages().length).toEqual(1);
        expect(component.messages()[0]).toEqual(ERRORS.EMAIL_REQUIRED);
    }));

    it('does not register a user with invalid e-mail', fakeAsync(async () => {
        component.userId.set('invalidEMail');
        component.passwordAsEMail.set(true);
        await component.submit();
        expect(component.messages().length).toEqual(1);
        expect(component.messages()[0]).toEqual(ERRORS.INVALID_EMAIL);
    }));

    it('does not register a user with empty password', fakeAsync(async () => {
        component.userId.set('john.doe@email.com');
        component.password1.set('');
        await component.submit();
        expect(component.messages().length).toEqual(1);
        expect(component.messages()[0]).toEqual(ERRORS.PASSWORD_REQUIRED);
    }));

    it('does not register a user with invalid password', fakeAsync(async () => {
        component.userId.set('john.doe@email.com');
        component.password1.set('123');
        await component.submit();
        expect(component.messages().length).toEqual(1);
        expect(component.messages()[0]).toEqual(ERRORS.INVALID_PASSWORD);
    }));

    it('does not register a user while invalid confirmed password', fakeAsync(async () => {
        component.userId.set('john.doe@email.com');
        component.password1.set('1234.Zyx');
        component.password1.set('Abcd.098');
        await component.submit();
        expect(component.messages().length).toEqual(1);
        expect(component.messages()[0]).toEqual(ERRORS.PASSWORDS_NOT_EQUAL);
    }));
});