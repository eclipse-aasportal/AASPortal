/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Component, OnInit } from '@angular/core';
import { MessageEntry } from '../types/message-entry';
import { NotifyService } from './notify.service';
import { NgbToast } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'fhg-notify',
    templateUrl: './notify.component.html',
    styleUrls: ['./notify.component.scss'],
    standalone: true,
    imports: [NgbToast],
})
export class NotifyComponent implements OnInit {
    public constructor(notify: NotifyService) {
        this.notify = notify;
    }

    public readonly notify: NotifyService;

    public close(message: MessageEntry) {
        this.notify.remove(message);
    }

    public ngOnInit(): void {
        this.notify.clear();
    }
}
