/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import isEmpty from 'lodash-es/isEmpty';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbCollapse, NgbToast } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { getUserNameFromEMail, isValidEMail, isValidPassword, stringFormat, UserProfile } from 'aas-core';
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
    imports: [NgbToast, FormsModule, NgbCollapse, TranslateModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileFormComponent {
    private profile?: UserProfile;

    public constructor(
        private modal: NgbActiveModal,
        private translate: TranslateService,
        private api: AuthApiService,
    ) {}

    public readonly id = signal('');

    public readonly name = signal('');

    public readonly defaultName = signal('name');

    public readonly password1 = signal('');

    public readonly password2 = signal('');

    public readonly isCollapsed = signal(true);

    public readonly messages = signal<string[]>([]);

    public initialize(profile: UserProfile): void {
        this.profile = profile;
        this.id.set(profile.id);
        this.name.set(profile.name);
    }

    public onInputEMail(): void {
        this.defaultName.set(getUserNameFromEMail(this.id()));
    }

    public deleteUser(): void {
        const result: ProfileFormResult = { action: 'deleteUser' };
        this.modal.close(result);
    }

    public submit(): void {
        this.clearMessages();
        if (isEmpty(this.id())) {
            this.pushMessage(stringFormat(this.translate.instant(ERRORS.EMAIL_REQUIRED)));
        } else if (!isValidEMail(this.id())) {
            this.pushMessage(stringFormat(this.translate.instant(ERRORS.INVALID_EMAIL)));
        } else if (!isEmpty(this.password1())) {
            if (!isValidPassword(this.password1())) {
                this.pushMessage(this.translate.instant(ERRORS.INVALID_PASSWORD));
            } else if (this.password1() !== this.password2()) {
                this.pushMessage(this.translate.instant(ERRORS.PASSWORDS_NOT_EQUAL));
            }
        }

        if (this.messages.length === 0 && this.profile) {
            const newProfile: UserProfile = {
                id: this.id(),
                name: this.name() ?? getUserNameFromEMail(this.id()),
                password: this.password1(),
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
        this.messages.set([message]);
    }

    private clearMessages(): void {
        this.messages.set([]);
    }
}
