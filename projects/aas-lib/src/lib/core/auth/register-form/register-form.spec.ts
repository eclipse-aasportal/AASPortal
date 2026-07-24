/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it, Mocked } from 'vitest';
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { lastValueFrom, of, throwError } from 'rxjs';

import { createSpyObj, FakeLoader } from '../../../../test/mocks';
import { RegisterForm } from './register-form';
import { AuthService } from '../auth.service';
import { NotifyService } from '../../notify/notify.service';
import { WINDOW } from '../../../shared/services/window.service';

describe('RegisterForm', () => {
    let fixture: ComponentFixture<RegisterForm>;
    let component: RegisterForm;
    let auth: Mocked<AuthService>;
    let notify: Mocked<NotifyService>;
    let window: Mocked<Window>;

    beforeEach(async () => {
        auth = createSpyObj<AuthService>(['createAccount']);
        window = createSpyObj<Window>([], { location: createSpyObj<Location>([], { href: '' }) });
        notify = createSpyObj<NotifyService>(['error']);

        await TestBed.configureTestingModule({
            imports: [RegisterForm],
            providers: [
                {
                    provide: AuthService,
                    useValue: auth,
                },
                {
                    provide: NotifyService,
                    useValue: notify,
                },
                {
                    provide: WINDOW,
                    useValue: window,
                },
                provideTranslateService({
                    loader: {
                        provide: TranslateLoader,
                        useClass: FakeLoader,
                    },
                }),
                provideZonelessChangeDetection(),
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(RegisterForm);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    it('should create', () => {
        expect(component).toBeInstanceOf(RegisterForm);
    });

    it('should create a new account and redirect to the login page', async () => {
        const observable = of(void 0);
        auth.createAccount.mockReturnValue(observable);
        component.form().value.set({
            id: 'john.doe@email.com',
            name: 'John Doe',
            password1: 'password123',
            password2: 'password123',
        });

        component.submit(new Event('submit'));
        await lastValueFrom(observable);
        expect(auth.createAccount).toHaveBeenCalledWith({
            id: 'john.doe@email.com',
            name: 'John Doe',
            password: 'password123',
        });

        expect(window.location.href).toBe('/api/login');
    });

    it('should handle an error when creating a new account', async () => {
        const observable = throwError(() => new Error('Account creation failed'));
        auth.createAccount.mockReturnValue(observable);
        component.form().value.set({
            id: 'john.doe@email.com',
            name: 'John Doe',
            password1: 'password123',
            password2: 'password123',
        });

        component.submit(new Event('submit'));
        expect(notify.error).toHaveBeenCalledWith(new Error('Account creation failed'));
        expect(component.form().value()).toEqual({
            id: '',
            name: '',
            password1: '',
            password2: '',
        });
    });
});
