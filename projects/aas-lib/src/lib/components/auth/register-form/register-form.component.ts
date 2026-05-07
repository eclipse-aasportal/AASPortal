/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { email, form, minLength, required, FormField, validate } from '@angular/forms/signals';
import { TranslateDirective, TranslatePipe } from '@ngx-translate/core';

import { NotifyService } from '../../notify/notify.service';
import { AuthService } from '../auth.service';
import { WINDOW } from '../../../services/window.service';

export interface RegistrationData {
    id: string;
    name: string;
    password1: string;
    password2: string;
}

@Component({
    selector: 'fhg-register',
    templateUrl: './register-form.component.html',
    styleUrls: ['./register-form.component.scss'],
    imports: [TranslateDirective, TranslatePipe, FormField],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterFormComponent {
    private readonly window = inject(WINDOW);
    private readonly auth = inject(AuthService);
    private readonly notify = inject(NotifyService);
    private readonly registerModel = signal<RegistrationData>({ id: '', name: '', password1: '', password2: '' });

    public registerForm = form(this.registerModel, schemaPath => {
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

    public readonly email = this.registerForm.id;

    public readonly name = this.registerForm.name;

    public readonly password1 = this.registerForm.password1;

    public readonly password2 = this.registerForm.password2;

    public submit(event: Event): void {
        event.preventDefault();
        const data = this.registerModel();
        this.auth.createAccount({ id: data.id, name: data.name, password: data.password1 }).subscribe({
            next: () => {
                this.window.location.href = '/api/login';
            },
            error: error => {
                this.notify.error(error);
                this.registerForm().reset({ id: '', name: '', password1: '', password2: '' });
            },
        });
    }
}
