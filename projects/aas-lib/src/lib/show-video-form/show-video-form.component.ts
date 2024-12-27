/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'fhg-show-video',
    templateUrl: './show-video-form.component.html',
    styleUrls: ['./show-video-form.component.scss'],
    imports: [TranslateModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShowVideoFormComponent {
    public constructor(private readonly modal: NgbActiveModal) {}

    public readonly name = signal('');

    public readonly video = signal('');

    public initialize(name: string, video: string): void {
        this.name.set(name);
        this.video.set(video);
    }

    public close(): void {
        this.modal.close();
    }
}
