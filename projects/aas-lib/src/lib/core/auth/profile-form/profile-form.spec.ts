/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { beforeEach, describe, expect, it, Mocked, vi } from 'vitest';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { lastValueFrom, of } from 'rxjs';

import { ApplicationError, User, UserProfile } from 'aas-core';
import { ProfileForm } from './profile-form';
import { createSpyObj, FakeLoader } from '../../../../test/mocks';
import { AuthService } from '../auth.service';
import { NotifyService } from '../../notify/notify.service';
import { FormError } from '../../../share/components/form-error/form-error';
import { PromptDialog } from '../../prompt-dialog/prompt-dialog';

describe('ProfileForm', () => {
    let fixture: ComponentFixture<ProfileForm>;
    let component: ProfileForm;
    let auth: Mocked<AuthService>;
    let router: Mocked<Router>;
    let notify: Mocked<NotifyService>;

    beforeEach(async () => {
        auth = createSpyObj<AuthService>(['updateAccount', 'deleteAccount'], {
            user: signal<User | null>({
                id: 'john.doe@email.com',
                name: 'John',
                role: 'editor',
            }),
        });

        router = createSpyObj<Router>(['navigateByUrl']);
        notify = createSpyObj<NotifyService>(['error', 'info']);

        await TestBed.configureTestingModule({
            imports: [ProfileForm, FormError],
            providers: [
                {
                    provide: AuthService,
                    useValue: auth,
                },
                {
                    provide: Router,
                    useValue: router,
                },
                {
                    provide: NotifyService,
                    useValue: notify,
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

        fixture = TestBed.createComponent(ProfileForm);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    it('should create', () => {
        expect(component).toBeInstanceOf(ProfileForm);
    });

    it('should initialize form with current user', () => {
        expect(component.email().value()).toBe('john.doe@email.com');
        expect(component.name().value()).toBe('John');
    });

    it('should update the user name', async () => {
        const mockResult = of(void 0);
        auth.updateAccount.mockReturnValue(mockResult);
        component.name().value.set('John Doe');
        component.submit(new Event('submit'));
        await lastValueFrom(mockResult);
        expect(auth.updateAccount).toHaveBeenCalledWith({
            id: 'john.doe@email.com',
            name: 'John Doe',
        } satisfies UserProfile);

        expect(notify.info).toHaveBeenCalledWith('ProfileForm.UPDATE_ACCOUNT_SUCCESS');
    });

    it('should set a new password', async () => {
        const mockResult = of(void 0);
        auth.updateAccount.mockReturnValue(mockResult);
        component.password().value.set('password123');
        component.password1().value.set('new-password');
        component.password2().value.set('new-password');
        component.submit(new Event('submit'));
        await lastValueFrom(mockResult);
        expect(auth.updateAccount).toHaveBeenCalledWith({
            id: 'john.doe@email.com',
            name: 'John',
            password: 'password123',
            newPassword: 'new-password',
        } satisfies UserProfile);

        expect(notify.info).toHaveBeenCalledWith('ProfileForm.UPDATE_ACCOUNT_SUCCESS');
    });

    it('failed while old password required', () => {
        component.password1().value.set('new-password');
        component.password2().value.set('new-password');
        component.submit(new Event('submit'));
        expect(component.form().invalid()).toBe(true);
    });

    it('failed while password mismatch', () => {
        component.password().value.set('password123');
        component.password1().value.set('new-password');
        component.password2().value.set('other-password');
        component.submit(new Event('submit'));
        expect(component.form().invalid()).toBe(true);
    });

    it('should delete the account', async () => {
        const mockResult = of(void 0);
        auth.deleteAccount.mockReturnValue(mockResult);
        vi.spyOn(PromptDialog, 'open').mockResolvedValue('john.doe@email.com');
        component.deleteAccount();
        await lastValueFrom(mockResult);
        expect(auth.deleteAccount).toHaveBeenCalled();
        expect(router.navigateByUrl).toHaveBeenCalledWith('/start');
    });

    it('cancels the deletion', async () => {
        const promise = Promise.resolve('no-match');
        vi.spyOn(PromptDialog, 'open').mockReturnValue(promise);
        component.deleteAccount();
        await promise;
        expect(notify.error).toHaveBeenCalledWith(new ApplicationError('ProfileForm.EMAIL_MISMATCH'));
    });
});
