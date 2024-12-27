/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbToast } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

export interface EndpointSelect {
    name: string;
    url: string;
    selected: boolean;
}

@Component({
    selector: 'fhg-remove-endpoint',
    templateUrl: './remove-endpoint-form.component.html',
    styleUrls: ['./remove-endpoint-form.component.scss'],
    imports: [NgbToast, FormsModule, TranslateModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RemoveEndpointFormComponent {
    public constructor(
        private modal: NgbActiveModal,
        private translate: TranslateService,
    ) {}

    public readonly endpoints = signal<EndpointSelect[]>([]);

    public readonly messages = signal<string[]>([]);

    public inputChange() {
        this.clearMessages();
    }

    public submit(): void {
        this.clearMessages();
        const result = this.endpoints()
            .filter(item => item.selected)
            .map(item => item.name);

        if (result.length > 0) {
            this.modal.close(result);
        } else {
            this.messages.update(messages => [...messages, this.translate.instant('ERROR_NO_ELEMENT_SELECTED')]);
        }
    }

    public cancel(): void {
        this.modal.close();
    }

    private clearMessages(): void {
        if (this.messages.length > 0) {
            this.messages.set([]);
        }
    }
}
