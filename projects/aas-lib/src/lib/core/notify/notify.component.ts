/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { MessageEntry } from '../../types';
import { NotifyService } from './notify.service';
import { NgbToast } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'fhg-notify',
    templateUrl: './notify.component.html',
    styleUrls: ['./notify.component.scss'],
    imports: [NgbToast],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotifyComponent implements OnInit {
    private readonly notify = inject(NotifyService);

    public readonly messages = this.notify.messages;

    public remove(message: MessageEntry): void {
        this.notify.remove(message);
    }

    public close(message: MessageEntry): void {
        this.notify.remove(message);
    }

    public ngOnInit(): void {
        this.notify.clear();
    }
}
