/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { SecuredImageComponent } from '../secured-image/secured-image.component';

@Component({
    selector: 'fhg-show-image',
    templateUrl: './show-image-form.component.html',
    styleUrls: ['./show-image-form.component.scss'],
    imports: [SecuredImageComponent, TranslateModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShowImageFormComponent {
    public constructor(private readonly modal: NgbActiveModal) {}

    public readonly name = signal('');

    public readonly image = signal('');

    public initialize(name: string, image: string): void {
        this.name.set(name);
        this.image.set(image);
    }

    public close(): void {
        this.modal.close();
    }
}
