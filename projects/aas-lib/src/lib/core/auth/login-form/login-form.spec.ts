/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { afterEach, beforeEach, describe, expect, it, Mocked, vi } from 'vitest';
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { LoginForm } from './login-form';
import { createSpyObj, FakeLoader } from '../../../../test/mocks';
import { AuthService } from '../auth.service';
import { NotifyService } from '../../notify/notify.service';
import { FormError } from '../../../share/components/form-error/form-error';

describe('LoginForm', () => {
    let fixture: ComponentFixture<LoginForm>;
    let component: LoginForm;
    let auth: Mocked<AuthService>;
    let router: Mocked<Router>;
    let notify: Mocked<NotifyService>;

    beforeEach(async () => {
        auth = createSpyObj<AuthService>(['login'], {});
        router = createSpyObj<Router>(['navigateByUrl']);
        notify = createSpyObj<NotifyService>(['error', 'info']);

        auth.login.mockImplementation(credentials => {
            if (credentials?.password !== 'password123') {
                return throwError(() => new Error('Invalid credentials'));
            }

            return of(void 0);
        });

        await TestBed.configureTestingModule({
            imports: [LoginForm, FormError],
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
                    provide: Router,
                    useValue: router,
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

        fixture = TestBed.createComponent(LoginForm);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    it('should create', () => {
        expect(component).toBeInstanceOf(LoginForm);
    });

    it('should successfully login a user', async () => {
        const event = { preventDefault: vi.fn() } as unknown as Event;

        component.email().value.set('john.doe@email.com');
        component.password().value.set('password123');
        component.submit(event);

        expect(event.preventDefault).toHaveBeenCalled();
        expect(auth.login).toHaveBeenCalledWith({ id: 'john.doe@email.com', password: 'password123' });
        expect(router.navigateByUrl).toHaveBeenCalledWith('/start');
    });

    it('should disable submit if password missing', async () => {
        const event = { preventDefault: vi.fn() } as unknown as Event;

        component.email().value.set('john.doe@email.com');
        component.submit(event);

        expect(event.preventDefault).toHaveBeenCalled();
        expect(auth.login).not.toHaveBeenCalled();
        expect(component.form().invalid()).toBe(true);
    });

    it('should disable submit if e.mail missing', async () => {
        const event = { preventDefault: vi.fn() } as unknown as Event;

        component.password().value.set('password123');
        component.submit(event);

        expect(event.preventDefault).toHaveBeenCalled();
        expect(auth.login).not.toHaveBeenCalled();
        expect(component.form().invalid()).toBe(true);
    });

    it('should notify and reset password on login error', async () => {
        const event = { preventDefault: vi.fn() } as unknown as Event;

        component.email().value.set('john.doe@email.com');
        component.password().value.set('invalid-password');
        component.submit(event);

        expect(event.preventDefault).toHaveBeenCalled();
        expect(auth.login).toHaveBeenCalledWith({ id: 'john.doe@email.com', password: 'invalid-password' });
        expect(notify.error).toHaveBeenCalledTimes(1);
        expect(notify.error.mock.calls[0][0]).toBeInstanceOf(Error);
        expect((notify.error.mock.calls[0][0] as Error).message).toBe('Invalid credentials');
        expect(component.password().value()).toBe('');
    });
});
