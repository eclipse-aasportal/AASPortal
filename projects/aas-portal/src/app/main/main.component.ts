/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
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
import { AuthComponent, IndexChangeService, LocalizeComponent, NotifyComponent, ToolbarService } from 'aas-lib';

import { environment } from '../../environments/environment';

export const enum LinkId {
    START = 0,
    SHELLS = 1,
    AAS = 2,
    VIEW = 3,
    DASHBOARD = 4,
    ABOUT = 5,
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
            name: 'Main.START',
            url: '/start',
        },
        {
            id: LinkId.SHELLS,
            name: 'Main.SHELLS',
            url: '/shells',
        },
        {
            id: LinkId.AAS,
            name: 'Main.AAS',
            url: '/aas',
        },
        {
            id: LinkId.VIEW,
            name: 'Main.VIEW',
            url: '/view',
        },
        {
            id: LinkId.DASHBOARD,
            name: 'Main.DASHBOARD',
            url: '/dashboard',
        },
        {
            id: LinkId.ABOUT,
            name: 'Main.ABOUT',
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
