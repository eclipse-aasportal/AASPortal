/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { isEmpty } from 'lodash-es';
import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';
import { getUserNameFromEMail, isValidEMail, isValidPassword, stringFormat, UserProfile } from 'common';
import { messageToString } from '../../convert';
import { ERRORS } from '../../types/errors';
import { AuthApiService } from '../auth-api.service';

export interface ProfileFormResult {
    action?: string;
    token?: string;
}

@Component({
    selector: 'fhg-profile',
    templateUrl: './profile-form.component.html',
    styleUrls: ['./profile-form.component.scss'],
})
export class ProfileFormComponent {
    private profile?: UserProfile;

    public constructor(
        private modal: NgbActiveModal,
        private translate: TranslateService,
        private api: AuthApiService,
    ) {}

    public id = '';

    public name = '';

    public defaultName = 'name';

    public password1 = '';

    public password2 = '';

    public isCollapsed = true;

    public messages: string[] = [];

    public initialize(profile: UserProfile): void {
        this.profile = profile;

        this.id = profile.id;
        this.name = profile.name;
    }

    public onInputEMail(): void {
        this.defaultName = getUserNameFromEMail(this.id);
    }

    public deleteUser(): void {
        const result: ProfileFormResult = { action: 'deleteUser' };
        this.modal.close(result);
    }

    public submit(): void {
        this.clearMessages();
        if (isEmpty(this.id)) {
            this.pushMessage(stringFormat(this.translate.instant(ERRORS.EMAIL_REQUIRED)));
        } else if (!isValidEMail(this.id)) {
            this.pushMessage(stringFormat(this.translate.instant(ERRORS.INVALID_EMAIL)));
        } else if (!isEmpty(this.password1)) {
            if (!isValidPassword(this.password1)) {
                this.pushMessage(this.translate.instant(ERRORS.INVALID_PASSWORD));
            } else if (this.password1 !== this.password2) {
                this.pushMessage(this.translate.instant(ERRORS.PASSWORDS_NOT_EQUAL));
            }
        }

        if (this.messages.length === 0 && this.profile) {
            const newProfile: UserProfile = {
                id: this.id,
                name: this.name ?? getUserNameFromEMail(this.id),
                password: this.password1,
            };

            this.api.updateProfile(this.profile.id, newProfile).subscribe({
                next: value => {
                    const result: ProfileFormResult = { token: value.token };
                    this.modal.close(result);
                },
                error: error => {
                    this.pushMessage(messageToString(error, this.translate));
                },
            });
        }
    }

    public cancel(): void {
        this.modal.close();
    }

    private pushMessage(message: string): void {
        this.messages = [message];
    }

    private clearMessages(): void {
        this.messages = [];
    }
}
