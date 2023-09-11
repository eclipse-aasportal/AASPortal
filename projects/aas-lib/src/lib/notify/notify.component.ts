/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Component, OnInit } from '@angular/core';
import { MessageEntry } from '../types/message-entry';
import { NotifyService } from './notify.service';

@Component({
    selector: 'fhg-notify',
    templateUrl: './notify.component.html',
    styleUrls: ['./notify.component.scss']
})
export class NotifyComponent implements OnInit {

    constructor(notify: NotifyService) {
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