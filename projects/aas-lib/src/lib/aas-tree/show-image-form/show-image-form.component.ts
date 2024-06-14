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
import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'fhg-show-image',
    templateUrl: './show-image-form.component.html',
    styleUrls: ['./show-image-form.component.scss'],
    standalone: true,
    imports: [SecuredImageComponent, TranslateModule],
})
export class ShowImageFormComponent {
    public constructor(private readonly modal: NgbActiveModal) {}

    public name!: string;

    public image!: string;

    public close(): void {
        this.modal.close();
    }
}
