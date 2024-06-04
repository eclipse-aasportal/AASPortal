/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'fhg-show-video',
    templateUrl: './show-video-form.component.html',
    styleUrls: ['./show-video-form.component.scss'],
    standalone: true,
})
export class ShowVideoFormComponent {
    private readonly _modal: NgbActiveModal;

    public constructor(modal: NgbActiveModal) {
        this._modal = modal;
    }

    public name!: string;

    public video!: string;

    public close(): void {
        this._modal.close();
    }
}
