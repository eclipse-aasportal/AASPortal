/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import isEmpty from 'lodash-es/isEmpty';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbToast } from '@ng-bootstrap/ng-bootstrap';
import { isValidEMail, isValidPassword, stringFormat, UserProfile, getUserNameFromEMail } from 'aas-core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { AuthApiService } from '../auth-api.service';
import { ERRORS } from '../../errors';
import { messageToString } from '../../utilities';

export interface RegisterFormResult {
    stayLoggedIn: boolean;
    token: string;
}

@Component({
    selector: 'fhg-register',
    templateUrl: './register-form.component.html',
    styleUrls: ['./register-form.component.scss'],
    imports: [NgbToast, FormsModule, TranslateModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterFormComponent {
    public constructor(
        private modal: NgbActiveModal,
        private translate: TranslateService,
        private api: AuthApiService,
    ) {}

    public readonly userId = signal('');

    public readonly name = signal('');

    public readonly defaultName = signal('name');

    public readonly password1 = signal('');

    public readonly password2 = signal('');

    public readonly stayLoggedIn = signal(false);

    public readonly passwordAsEMail = signal(false);

    public readonly messages = signal<string[]>([]);

    public onInputEMail(): void {
        this.defaultName.set(getUserNameFromEMail(this.userId()));
    }

    public submit(): void {
        this.clearMessages();
        if (isEmpty(this.userId())) {
            this.pushMessage(stringFormat(this.translate.instant(ERRORS.EMAIL_REQUIRED)));
        } else if (!isValidEMail(this.userId())) {
            this.pushMessage(stringFormat(this.translate.instant(ERRORS.INVALID_EMAIL)));
        } else if (!this.passwordAsEMail()) {
            if (isEmpty(this.password1())) {
                this.pushMessage(this.translate.instant(ERRORS.PASSWORD_REQUIRED));
            } else if (!isValidPassword(this.password1())) {
                this.pushMessage(this.translate.instant(ERRORS.INVALID_PASSWORD));
            } else if (this.password1() !== this.password2()) {
                this.pushMessage(this.translate.instant(ERRORS.PASSWORDS_NOT_EQUAL));
            }
        }

        if (this.messages().length === 0) {
            const profile: UserProfile = {
                id: this.userId(),
                name: this.name() ?? getUserNameFromEMail(this.userId()),
                password: this.password1(),
            };

            let result: RegisterFormResult | undefined;
            this.api.register(profile).subscribe({
                next: value => {
                    if (!this.passwordAsEMail()) {
                        result = {
                            stayLoggedIn: this.stayLoggedIn(),
                            token: value.token,
                        };

                        this.modal.close(result);
                    }
                },
                error: error => this.pushMessage(messageToString(error, this.translate)),
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
