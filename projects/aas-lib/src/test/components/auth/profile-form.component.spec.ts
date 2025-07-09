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
import { AuthResult } from 'aas-core';
import { of } from 'rxjs';

import { AuthApiService } from '../../../lib/components/auth/auth-api.service';
import { ERRORS } from '../../../lib/errors';
import { ProfileFormComponent } from '../../../lib/components/auth/profile-form/profile-form.component';

describe('ProfileFormComponent', () => {
    let modal: NgbActiveModal;
    let api: AuthApiService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                ProfileFormComponent,
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
        const fixture = TestBed.createComponent(ProfileFormComponent);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });

    it('updates a user profile', (done: DoneFn) => {
        const fixture = TestBed.createComponent(ProfileFormComponent);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        spyOn(modal, 'close').and.callFake((...args) => {
            expect(args[0]).toEqual({ token: 'new_token' });
            done();
        });

        spyOn(api, 'updateProfile').and.returnValue(of({ token: 'new_token' } as AuthResult));

        component.initialize({ name: 'John', id: 'john.doe@email.com' });
        component.name.set('John Doe');
        component.password1.set('1234.zyx');
        component.password2.set('1234.zyx');
        component.submit();
    });

    it('does not update the profile if e-mail is empty', async () => {
        const fixture = TestBed.createComponent(ProfileFormComponent);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        component.id.set('');
        await component.submit();
        expect(component.messages().length).toEqual(1);
        expect(component.messages()[0]).toEqual(ERRORS.EMAIL_REQUIRED);
    });

    it('does not update the profile if e-mail is invalid', async () => {
        const fixture = TestBed.createComponent(ProfileFormComponent);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        component.id.set('invalidEMail');
        await component.submit();
        expect(component.messages().length).toEqual(1);
        expect(component.messages()[0]).toEqual(ERRORS.INVALID_EMAIL);
    });

    it('does not update the profile if password are not equal', async () => {
        const fixture = TestBed.createComponent(ProfileFormComponent);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        component.id.set('john.doe@email.com');
        component.name.set('John Doe');
        component.password1.set('1234.zyx');
        component.password2.set('1234.abc');
        await component.submit();
        expect(component.messages().length).toEqual(1);
        expect(component.messages()[0]).toEqual(ERRORS.PASSWORDS_NOT_EQUAL);
    });

    it('does not update the profile if password is invalid', async () => {
        const fixture = TestBed.createComponent(ProfileFormComponent);
        const component = fixture.componentInstance;
        fixture.detectChanges();
        component.id.set('john.doe@email.com');
        component.password1.set('123');
        await component.submit();
        expect(component.messages().length).toEqual(1);
        expect(component.messages()[0]).toEqual(ERRORS.INVALID_PASSWORD);
    });
});
