/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'fhg-show-video',
    templateUrl: './show-video-form.component.html',
    styleUrls: ['./show-video-form.component.scss'],
    standalone: true,
    imports: [TranslateModule],
})
export class ShowVideoFormComponent {
    public constructor(private readonly modal: NgbActiveModal) {}

    public name!: string;

    public video!: string;

    public close(): void {
        this.modal.close();
    }
}
