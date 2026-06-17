/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { form, required, email, FormField } from '@angular/forms/signals';
import { TranslateDirective, TranslatePipe } from '@ngx-translate/core';

import { Credentials } from 'aas-core';
import { NotifyService } from '../../notify/notify.service';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
    selector: 'fhg-login',
    templateUrl: './login-form.component.html',
    styleUrls: ['./login-form.component.scss'],
    imports: [TranslateDirective, TranslatePipe, FormField],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginFormComponent {
    private readonly auth = inject(AuthService);
    private readonly notify = inject(NotifyService);
    private readonly route = inject(Router);
    private readonly loginModel = signal<Credentials>({ id: '', password: '' });

    public readonly loginForm = form(this.loginModel, schemaPath => {
        required(schemaPath.id, { message: 'LoginForm.EMAIL_REQUIRED' });
        email(schemaPath.id, { message: 'LoginForm.EMAIL_INVALID' });
        required(schemaPath.password, { message: 'LoginForm.PASSWORD_REQUIRED' });
    });

    public readonly email = this.loginForm.id;

    public readonly password = this.loginForm.password;

    public submit(event: Event): void {
        event.preventDefault();
        const credentials = this.loginModel();
        this.auth.login(credentials).subscribe({
            next: () => {
                this.route.navigateByUrl('/start');
            },
            error: error => {
                this.notify.error(error);
                this.loginForm().reset({ id: '', password: '' });
            },
        });
    }
}
