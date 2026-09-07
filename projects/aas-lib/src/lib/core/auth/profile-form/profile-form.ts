/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Component, effect, inject, signal } from '@angular/core';
import { NgbAccordionModule, NgbCollapse, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateDirective, TranslateService } from '@ngx-translate/core';
import { form, FormField, readonly, validate } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { ApplicationError, UserProfile } from 'aas-core';
import { EMPTY, finalize, from, mergeMap, tap, throwError } from 'rxjs';

import { AuthService } from '../auth.service';
import { NotifyService } from '../../notify/notify.service';
import { FormError } from '../../../shared/components/form-error/form-error';
import { PromptDialog } from '../../prompt-dialog/prompt-dialog';

export interface ProfileData {
    id: string;
    name: string;
    password: string;
    password1: string;
    password2: string;
}

@Component({
    selector: 'fhg-profile',
    templateUrl: './profile-form.html',
    styleUrls: ['./profile-form.scss'],
    imports: [NgbCollapse, NgbAccordionModule, TranslateDirective, FormField, FormError],
})
export class ProfileForm {
    private readonly auth = inject(AuthService);
    private readonly notify = inject(NotifyService);
    private readonly router = inject(Router);
    private readonly modal = inject(NgbModal);
    private readonly translate = inject(TranslateService);
    private readonly model = signal<ProfileData>({
        id: '',
        name: '',
        password: '',
        password1: '',
        password2: '',
    });

    private inProgress = false;

    public constructor() {
        effect(() => {
            const user = this.auth.user();
            if (user?.id) {
                this.form.id().value.set(user.id);
            }

            if (user?.name) {
                this.form.name().value.set(user.name);
            }
        });
    }

    public readonly form = form(this.model, schemaPath => {
        readonly(schemaPath.id);
        validate(schemaPath.password, ({ value, valueOf }) => {
            const password = value();
            const password1 = valueOf(schemaPath.password1);
            const password2 = valueOf(schemaPath.password2);
            if ((password2 || password1) && !password) {
                return {
                    kind: 'passwordRequired',
                    message: 'Profile.PASSWORD_REQUIRED',
                };
            }

            return null;
        });

        validate(schemaPath.password1, ({ value }) => {
            const password1 = value();
            if (password1.length > 0 && password1.length < 8) {
                return {
                    kind: 'passwordMinLength',
                    message: 'ProfileForm.PASSWORD_MIN_LENGTH',
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
                    message: 'ProfileForm.PASSWORDS_DO_NOT_MATCH',
                };
            }

            return null;
        });
    });

    public readonly email = this.form.id;

    public readonly name = this.form.name;

    public readonly password = this.form.password;

    public readonly password1 = this.form.password1;

    public readonly password2 = this.form.password2;

    public deleteAccount(): void {
        const email = this.auth.user()?.id;
        if (!email) {
            return;
        }

        from(PromptDialog.open(this.modal, this.translate.instant('ProfileForm.DELETE_ACCOUNT_PROMPT', { email })))
            .pipe(
                mergeMap(value => {
                    if (value === undefined) {
                        return EMPTY;
                    }

                    return value === email
                        ? this.auth.deleteAccount()
                        : throwError(() => new ApplicationError('ProfileForm.EMAIL_MISMATCH'));
                }),
            )
            .subscribe({
                next: () => {
                    this.notify.info(this.translate.instant('ProfileForm.DELETE_ACCOUNT_SUCCESS'));
                    this.router.navigateByUrl('/start');
                },
                error: error => {
                    this.notify.error(error);
                },
            });
    }

    public submit(event: Event): void {
        event.preventDefault();

        if (this.inProgress || this.form().invalid()) {
            return;
        }

        const data = this.model();
        const profile: UserProfile = {
            id: data.id,
            name: data.name,
        };

        if (data.password && data.password1) {
            profile.password = data.password;
            profile.newPassword = data.password1;
        }

        this.inProgress = true;
        this.auth.updateAccount(profile).pipe(
            finalize(() => this.inProgress = false)
        ).subscribe({
            next: () => {
                this.notify.info(this.translate.instant('ProfileForm.UPDATE_ACCOUNT_SUCCESS'));
                this.form().reset({
                    id: this.auth.user()?.id ?? '',
                    name: this.auth.user()?.name ?? '',
                    password: '',
                    password1: '',
                    password2: '',
                });
            },
            error: error => {
                this.notify.error(error);
            },
        });
    }
}
