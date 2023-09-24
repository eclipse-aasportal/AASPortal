/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { isEmpty } from 'lodash-es';
import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { isValidEMail, isValidPassword, stringFormat, UserProfile, getUserNameFromEMail } from 'common';
import { TranslateService } from '@ngx-translate/core';

import { AuthApiService } from '../auth-api.service';
import { ERRORS } from '../../types/errors';
import { messageToString } from '../../convert';

export interface RegisterFormResult {
    stayLoggedIn: boolean;
    token: string;
}

@Component({
    selector: 'fhg-register',
    templateUrl: './register-form.component.html',
    styleUrls: ['./register-form.component.scss'],
})
export class RegisterFormComponent {
    constructor(
        private modal: NgbActiveModal,
        private translate: TranslateService,
        private api: AuthApiService) { }

    public userId = '';

    public name = '';

    public defaultName = 'name';

    public password1 = '';

    public password2 = '';

    public stayLoggedIn = false;

    public passwordAsEMail = false;

    public messages: string[] = [];

    public onInputEMail(): void {
        this.defaultName = getUserNameFromEMail(this.userId);
    }

    public submit(): void {
        this.clearMessages();
        if (isEmpty(this.userId)) {
            this.pushMessage(stringFormat(this.translate.instant(ERRORS.EMAIL_REQUIRED)));
        } else if (!isValidEMail(this.userId)) {
            this.pushMessage(stringFormat(this.translate.instant(ERRORS.INVALID_EMAIL)));
        } else if (!this.passwordAsEMail) {
            if (isEmpty(this.password1)) {
                this.pushMessage(this.translate.instant(ERRORS.PASSWORD_REQUIRED));
            } else if (!isValidPassword(this.password1)) {
                this.pushMessage(this.translate.instant(ERRORS.INVALID_PASSWORD));
            } else if (this.password1 !== this.password2) {
                this.pushMessage(this.translate.instant(ERRORS.PASSWORDS_NOT_EQUAL));
            }
        }

        if (this.messages.length === 0) {
            const profile: UserProfile = {
                id: this.userId,
                name: this.name ?? getUserNameFromEMail(this.userId),
                password: this.password1
            };

            let result: RegisterFormResult | undefined;
            this.api.register(profile).subscribe({
                next: value => {
                    if (!this.passwordAsEMail) {
                        result = {
                            stayLoggedIn: this.stayLoggedIn,
                            token: value.token
                        };

                        this.modal.close(result);
                    }
                },
                error: error => this.pushMessage(messageToString(error, this.translate))
            });
        }
    }

    public cancel(): void {
        this.modal.close();
    }

    private pushMessage(message: string): void {
        this.messages = [message]
    }

    private clearMessages(): void {
        this.messages = [];
    }
}