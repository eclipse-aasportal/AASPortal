/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateDirective } from '@ngx-translate/core';

/**
 * A simple confirm dialog component. Use {@link ConfirmDialog.open} to open the dialog and await the result.
 */
@Component({
    selector: 'fhg-confirm-dialog',
    imports: [TranslateDirective],
    templateUrl: './confirm-dialog.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './confirm-dialog.scss',
})
export class ConfirmDialog {
    private readonly modal = inject(NgbActiveModal);

    public readonly cancelable = signal(false);

    public readonly text = signal('');

    public close(result: boolean): void {
        this.modal.close(result);
    }

    public cancel(): void {
        this.modal.dismiss();
    }

    public static async open(modal: NgbModal, text: string, cancelable = false): Promise<boolean | undefined> {
        const modalRef = modal.open(ConfirmDialog, { backdrop: 'static' });
        const instance = modalRef.componentInstance as ConfirmDialog;
        instance.text.set(text);
        instance.cancelable.set(cancelable);
        try {
            return await modalRef.result;
        } catch {
            return undefined;
        }
    }
}
