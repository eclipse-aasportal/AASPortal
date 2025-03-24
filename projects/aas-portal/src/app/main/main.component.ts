/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { AsyncPipe, NgTemplateOutlet } from '@angular/common';
import { noop } from 'aas-core';
import { AuthComponent, IndexChangeService, LocalizeComponent, NotifyComponent } from 'aas-lib';

import { ToolbarService } from '../toolbar.service';
import { environment } from '../../environments/environment';

export const enum LinkId {
    START = 0,
    AAS = 1,
    VIEW = 2,
    DASHBOARD = 3,
    ABOUT = 4,
}

export interface LinkDescriptor {
    id: LinkId;
    name: string;
    url: string;
}

@Component({
    selector: 'fhg-main',
    templateUrl: './main.component.html',
    styleUrls: ['./main.component.scss'],
    imports: [
        RouterOutlet,
        RouterLink,
        RouterLinkActive,
        AsyncPipe,
        NgbNavModule,
        NgTemplateOutlet,
        TranslateModule,
        NotifyComponent,
        LocalizeComponent,
        AuthComponent,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainComponent {
    public constructor(
        public readonly route: ActivatedRoute,
        private readonly toolbar: ToolbarService,
        private readonly indexChange: IndexChangeService,
    ) {}

    public readonly toolbarTemplate = this.toolbar.toolbarTemplate;

    public readonly links = signal<LinkDescriptor[]>([
        {
            id: LinkId.START,
            name: 'CAPTION_START',
            url: '/start',
        },
        {
            id: LinkId.AAS,
            name: 'CAPTION_AAS',
            url: '/aas',
        },
        {
            id: LinkId.VIEW,
            name: 'CAPTION_VIEW',
            url: '/view',
        },
        {
            id: LinkId.DASHBOARD,
            name: 'CAPTION_DASHBOARD',
            url: '/dashboard',
        },
        {
            id: LinkId.ABOUT,
            name: 'CAPTION_ABOUT',
            url: '/about',
        },
    ]).asReadonly();

    public readonly version = signal(environment.version).asReadonly();

    public readonly endpointCount = this.indexChange.endpointCount;

    public readonly documentCount = this.indexChange.documentCount;

    public readonly changedDocuments = this.indexChange.changedDocuments;

    public clear(): void {
        this.indexChange.clear().subscribe();
    }

    public onKeyDown($event: KeyboardEvent): void {
        noop($event);
    }
}
