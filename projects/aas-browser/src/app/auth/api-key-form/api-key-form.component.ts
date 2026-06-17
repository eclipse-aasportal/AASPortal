/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { TranslateDirective, TranslatePipe } from '@ngx-translate/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'fhg-auth-form',
    templateUrl: './api-key-form.component.html',
    styleUrls: ['./api-key-form.component.scss'],
    imports: [TranslateDirective, TranslatePipe, FormField],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApiKeyFormComponent {
    private readonly modal = inject(NgbActiveModal);
    private readonly authModel = signal<{ apiKey: string }>({ apiKey: '' });
    private readonly authForm = form(this.authModel);

    public readonly apiKey = this.authForm.apiKey;

    public cancel(): void {
        this.modal.dismiss();
    }

    public submit(event: Event): void {
        event.preventDefault();
        const model = this.authModel();
        this.modal.close(model.apiKey);
    }
}
