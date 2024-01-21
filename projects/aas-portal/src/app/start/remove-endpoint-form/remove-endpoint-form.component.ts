/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';

export interface EndpointSelect {
    name: string;
    url: string;
    selected: boolean;
}

@Component({
    selector: 'fhg-remove-endpoint',
    templateUrl: './remove-endpoint-form.component.html',
    styleUrls: ['./remove-endpoint-form.component.scss'],
})
export class RemoveEndpointFormComponent {
    public constructor(
        private modal: NgbActiveModal,
        private translate: TranslateService,
    ) {}

    public endpoints: EndpointSelect[] = [];

    public messages: string[] = [];

    public inputChange() {
        this.clearMessages();
    }

    public submit(): void {
        this.clearMessages();
        const result = this.endpoints.filter(item => item.selected).map(item => item.name);

        if (result.length > 0) {
            this.modal.close(result);
        } else {
            this.messages.push(this.translate.instant('ERROR_NO_ELEMENT_SELECTED'));
        }
    }

    public cancel(): void {
        this.modal.close();
    }

    private clearMessages(): void {
        if (this.messages.length > 0) {
            this.messages = [];
        }
    }
}