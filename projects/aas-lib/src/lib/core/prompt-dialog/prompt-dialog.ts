/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Component, inject, signal } from '@angular/core';
import { form, FormField, required, validate } from '@angular/forms/signals';
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
    private readonly model = signal<{ value: string }>({ value: '' });
    private expectedValue?: string;

    public readonly form = form(this.model, schemaPath => {
        required(schemaPath.value, { message: 'PromptDialog.TEXT_REQUIRED' });
        validate(schemaPath.value, ({ value }) => {
            if (this.expectedValue && value() !== this.expectedValue) {
                return {
                    kind: 'textNotMatch',
                    message: 'PromptDialog.TEXT_NOT_MATCH',
                };
            }

            return null;
        });
    });

    public readonly text = signal('');

    public readonly value = this.form.value;

    public submit(event: Event): void {
        event.preventDefault();
        if (this.form().valid()) {
            this.modal.close(this.model().value);
        }
    }

    public cancel(): void {
        this.modal.dismiss();
    }

    public static async open(modal: NgbModal, text: string): Promise<string | undefined> {
        const modalRef = modal.open(PromptDialog, { backdrop: 'static' });
        const instance = modalRef.componentInstance as PromptDialog;
        instance.text.set(text);
        try {
            return await modalRef.result;
        } catch {
            return undefined;
        }
    }

    public static async confirm(modal: NgbModal, text: string, expectedValue: string): Promise<string | undefined> {
        const modalRef = modal.open(PromptDialog, { backdrop: 'static' });
        const instance = modalRef.componentInstance as PromptDialog;
        instance.expectedValue = expectedValue;
        instance.text.set(text);
        try {
            return await modalRef.result;
        } catch {
            return undefined;
        }
    }
}
