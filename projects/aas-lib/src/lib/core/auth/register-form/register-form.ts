/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Component, inject, signal } from '@angular/core';
import { email, form, minLength, required, FormField, validate } from '@angular/forms/signals';
import { TranslateDirective } from '@ngx-translate/core';

import { NotifyService } from '../../notify/notify.service';
import { AuthService } from '../auth.service';
import { WINDOW } from '../../../services/window.service';
import { FormError } from '../../../share/components/form-error/form-error';

export interface RegistrationData {
    id: string;
    name: string;
    password1: string;
    password2: string;
}

@Component({
    selector: 'fhg-register',
    templateUrl: './register-form.html',
    styleUrls: ['./register-form.scss'],
    imports: [TranslateDirective, FormField, FormError],
})
export class RegisterForm {
    private readonly window = inject(WINDOW);
    private readonly auth = inject(AuthService);
    private readonly notify = inject(NotifyService);
    private readonly model = signal<RegistrationData>({ id: '', name: '', password1: '', password2: '' });

    public form = form(this.model, schemaPath => {
        required(schemaPath.id, { message: 'RegisterForm.EMAIL_REQUIRED' });
        email(schemaPath.id, { message: 'RegisterForm.INVALID_EMAIL' });
        required(schemaPath.password1, { message: 'RegisterForm.PASSWORD_REQUIRED' });
        minLength(schemaPath.password1, 8, { message: 'RegisterForm.PASSWORD_MIN_LENGTH' });
        required(schemaPath.password2, { message: 'RegisterForm.CONFIRM_PASSWORD_REQUIRED' });
        validate(schemaPath.password2, ({ value, valueOf }) => {
            const password2 = value();
            const password1 = valueOf(schemaPath.password1);
            if (password2 !== password1) {
                return {
                    kind: 'passwordMismatch',
                    message: 'RegisterForm.PASSWORDS_DO_NOT_MATCH',
                };
            }

            return null;
        });
    });

    public readonly email = this.form.id;

    public readonly name = this.form.name;

    public readonly password1 = this.form.password1;

    public readonly password2 = this.form.password2;

    public submit(event: Event): void {
        event.preventDefault();
        const data = this.model();
        this.auth.createAccount({ id: data.id, name: data.name, password: data.password1 }).subscribe({
            next: () => {
                this.window.location.href = '/api/login';
            },
            error: error => {
                this.notify.error(error);
                this.form().reset({ id: '', name: '', password1: '', password2: '' });
            },
        });
    }
}
