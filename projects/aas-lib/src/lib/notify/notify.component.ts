/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MessageEntry } from '../types/message-entry';
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
    public constructor(private readonly notify: NotifyService) {}

    public readonly messages = this.notify.messages;

    public remove(message: MessageEntry): void {
        this.notify.remove(message);
    }

    public close(message: MessageEntry) {
        this.notify.remove(message);
    }

    public ngOnInit(): void {
        this.notify.clear();
    }
}
