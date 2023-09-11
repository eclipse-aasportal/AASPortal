/******************************************************************************
 *
 * Copyright (c) 2019-2023 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Component, OnInit } from '@angular/core';
import { Library, Message } from 'common';
import { ServerApiService } from './server-api.service';
import pkg from '../../../../../package.json';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'about',
    templateUrl: './about.component.html',
    styleUrls: ['./about.component.scss']
})
export class AboutComponent implements OnInit {
    constructor(private serverApi: ServerApiService, private translate: TranslateService) {
        this.author = pkg.author;
        this.version = pkg.version;
        this.homepage = pkg.homepage;
    }

    public version = '';

    public serverVersion = ''

    public author = '';

    public homepage = '';

    public libraries: Library[] = [];

    public messages: Message[] = [];

    public ngOnInit(): void {

        this.serverApi.getInfo().subscribe(info => {
            this.serverVersion = info.version; 
            this.libraries = info.libraries ?? [];
        });

        this.serverApi.getMessages().subscribe(messages => this.messages = messages);
    }
}