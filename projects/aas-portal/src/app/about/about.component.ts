/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Component, OnDestroy, OnInit, TemplateRef, ViewChild, AfterViewInit } from '@angular/core';
import { Library, Message } from 'common';
import { LibraryTableComponent, MessageTableComponent } from 'aas-lib';
import { ServerApiService } from './server-api.service';
import { ToolbarService } from '../toolbar.service';
import { environment } from '../../environments/environment';

@Component({
    selector: 'fhg-about',
    templateUrl: './about.component.html',
    styleUrls: ['./about.component.scss'],
    standalone: true,
    imports: [LibraryTableComponent, MessageTableComponent],
})
export class AboutComponent implements OnInit, OnDestroy, AfterViewInit {
    public constructor(
        private serverApi: ServerApiService,
        private toolbar: ToolbarService,
    ) {
        this.author = environment.author;
        this.version = environment.version;
        this.homepage = environment.homepage;
    }

    @ViewChild('aasToolbar', { read: TemplateRef })
    public aboutToolbar: TemplateRef<unknown> | null = null;

    public version = '';

    public serverVersion = '';

    public author = '';

    public homepage = '';

    public libraries: Library[] = [];

    public messages: Message[] = [];

    public ngOnInit(): void {
        this.serverApi.getInfo().subscribe(info => {
            this.serverVersion = info.version;
            this.libraries = info.libraries ?? [];
        });

        this.serverApi.getMessages().subscribe(messages => (this.messages = messages));
    }

    public ngAfterViewInit(): void {
        if (this.aboutToolbar) {
            this.toolbar.set(this.aboutToolbar);
        }
    }

    public ngOnDestroy(): void {
        this.toolbar.clear();
    }
}
