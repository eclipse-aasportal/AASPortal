/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { SecuredImageComponent } from '../../secured-image/secured-image.component';

@Component({
    selector: 'fhg-show-image',
    templateUrl: './show-image-form.component.html',
    styleUrls: ['./show-image-form.component.scss'],
    standalone: true,
    imports: [SecuredImageComponent],
})
export class ShowImageFormComponent {
    private readonly _modal: NgbActiveModal;

    public constructor(modal: NgbActiveModal) {
        this._modal = modal;
    }

    public name!: string;

    public image!: string;

    public close(): void {
        this._modal.close();
    }
}
