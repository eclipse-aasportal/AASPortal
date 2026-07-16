/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Component, inject, signal } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateDirective } from '@ngx-translate/core';

/**
 * A simple prompt dialog component. Use {@link PromptDialog.open} to open the dialog and await the result.
 */
@Component({
    selector: 'fhg-prompt-dialog',
    imports: [FormField, TranslateDirective],
    templateUrl: './prompt-dialog.html',
    styleUrl: './prompt-dialog.scss',
})
export class PromptDialog {
    private readonly modal = inject(NgbActiveModal);
    private readonly model = signal<{ text: string }>({ text: '' });

    public readonly form = form(this.model, schemaPath => {
        required(schemaPath.text, { message: 'PromptDialog.TEXT_REQUIRED' });
    });

    public readonly label = signal('');

    public readonly text = this.form.text;

    public submit(event: Event): void {
        event.preventDefault();
        this.modal.close(this.model().text);
    }

    public cancel(): void {
        this.modal.dismiss();
    }

    public static async open(modal: NgbModal, label: string): Promise<string | undefined> {
        const modalRef = modal.open(PromptDialog, { backdrop: 'static' });
        const instance = modalRef.componentInstance as PromptDialog;
        instance.label.set(label);
        try {
            return await modalRef.result;
        } catch {
            return undefined;
        }
    }
}
