/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { NgbAccordionModule, NgbCollapse } from '@ng-bootstrap/ng-bootstrap';
import { TranslateDirective, TranslatePipe } from '@ngx-translate/core';
import { form, FormField, readonly, validate } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { catchError, Observable } from 'rxjs';

import { AuthService } from '../auth.service';
import { NotifyService } from '../../notify/notify.service';

export interface ProfileData {
    id: string;
    name: string;
    password: string;
    password1: string;
    password2: string;
}

@Component({
    selector: 'fhg-profile',
    templateUrl: './profile-form.component.html',
    styleUrls: ['./profile-form.component.scss'],
    imports: [NgbCollapse, NgbAccordionModule, TranslateDirective, TranslatePipe, FormField],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileFormComponent {
    private readonly auth = inject(AuthService);
    private readonly notify = inject(NotifyService);
    private readonly router = inject(Router);
    private readonly updateUserModel = signal<ProfileData>({
        id: '',
        name: '',
        password: '',
        password1: '',
        password2: '',
    });

    public constructor() {
        effect(() => {
            const user = this.auth.user();
            if (user?.id) {
                this.profileForm.id().value.set(user.id);
            }

            if (user?.name) {
                this.profileForm.name().value.set(user.name);
            }
        });
    }

    public readonly profileForm = form(this.updateUserModel, schemaPath => {
        readonly(schemaPath.id);
        validate(schemaPath.password, ({ value, valueOf }) => {
            const password = value();
            const password1 = valueOf(schemaPath.password1);
            const password2 = valueOf(schemaPath.password2);
            if ((password2 || password1) && !password) {
                return {
                    kind: 'passwordRequired',
                    message: 'RegisterForm.PASSWORD_REQUIRED',
                };
            }

            return null;
        });

        validate(schemaPath.password1, ({ value }) => {
            const password1 = value();
            if (password1.length > 0 && password1.length < 8) {
                return {
                    kind: 'passwordMinLength',
                    message: 'RegisterForm.PASSWORD_MIN_LENGTH',
                };
            }

            return null;
        });

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

    public readonly email = this.profileForm.id;

    public readonly name = this.profileForm.name;

    public readonly password = this.profileForm.password;

    public readonly password1 = this.profileForm.password1;

    public readonly password2 = this.profileForm.password2;

    public readonly isCollapsed = signal(true);

    public deleteAccount(): Observable<void> {
        return this.auth.deleteAccount().pipe(
            catchError(error => {
                this.notify.error(error);
                this.router.navigateByUrl('/start').then(() => void 0);
                return new Observable<void>();
            }),
        );
    }

    public submit(event: Event): void {
        event.preventDefault();
        const data = this.updateUserModel();
        this.auth
            .updateAccount({ id: data.id, name: data.name, password: data.password, newPassword: data.password1 })
            .subscribe({
                next: () => {
                    this.isCollapsed.set(true);
                },
                error: error => {
                    this.notify.error(error);
                    this.profileForm().reset({
                        id: this.auth.email() ?? '',
                        name: this.auth.name() ?? '',
                        password: '',
                        password1: '',
                        password2: '',
                    });
                },
            });
    }
}
