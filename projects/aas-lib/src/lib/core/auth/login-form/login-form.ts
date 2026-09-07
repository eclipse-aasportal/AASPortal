/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Component, inject, signal } from '@angular/core';
import { form, required, email, FormField } from '@angular/forms/signals';
import { TranslateDirective } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { Credentials } from 'aas-core';
import { NotifyService } from '../../notify/notify.service';
import { AuthService } from '../auth.service';
import { FormError } from '../../../shared/components/form-error/form-error';
import { finalize, tap } from 'rxjs';

@Component({
    selector: 'fhg-login',
    templateUrl: './login-form.html',
    styleUrls: ['./login-form.scss'],
    imports: [TranslateDirective, FormField, FormError],
})
export class LoginForm {
    private readonly auth = inject(AuthService);
    private readonly notify = inject(NotifyService);
    private readonly route = inject(Router);
    private readonly model = signal<Credentials>({ id: '', password: '' });
    private inProgress = false;

    public readonly form = form(this.model, schemaPath => {
        required(schemaPath.id, { message: 'LoginForm.EMAIL_REQUIRED' });
        email(schemaPath.id, { message: 'LoginForm.EMAIL_INVALID' });
        required(schemaPath.password, { message: 'LoginForm.PASSWORD_REQUIRED' });
    });

    public readonly email = this.form.id;

    public readonly password = this.form.password;

    public submit(event: Event): void {
        event.preventDefault();
        if (this.inProgress ||this.form().invalid()) {
            return;
        }

        const credentials = this.model();
        this.inProgress = true;
        this.auth.login(credentials).pipe(
            finalize(() => this.inProgress = false)
        ).subscribe({
            next: () => {
                this.route.navigateByUrl('/start');
            },
            error: error => {
                this.notify.error(error);
                this.form.password().reset('');
            },
        });
    }
}
