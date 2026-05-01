/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { AASEndpoint } from 'aas-core';

@Component({
    selector: 'fhg-upload-form',
    templateUrl: './upload-form.component.html',
    styleUrls: ['./upload-form.component.scss'],
    imports: [FormsModule, TranslateModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadFormComponent {
    public constructor(private readonly modal: NgbActiveModal) {}

    public readonly endpoints = signal<AASEndpoint[]>([]);

    public readonly endpoint = signal<AASEndpoint | undefined>(undefined);

    public canSubmit(): boolean {
        return this.endpoint() != null;
    }

    public submit(): void {
        this.modal.close(this.endpoint());
    }

    public cancel(): void {
        this.modal.close();
    }
}
