/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ChangeDetectionStrategy, Component, OnInit, TemplateRef, ViewChild, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterOutlet } from '@angular/router';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { first } from 'rxjs';
import { noop } from 'aas-core';
import { AuthComponent, IndexChangeService, LocalizeComponent, NotifyComponent, WindowService } from 'aas-lib';
import { TranslateModule } from '@ngx-translate/core';
import { AsyncPipe, NgTemplateOutlet } from '@angular/common';
import { ToolbarService } from '../toolbar.service';
import { MainApiService } from './main-api.service';
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
    standalone: true,
    imports: [
        RouterOutlet,
        RouterLink,
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
export class MainComponent implements OnInit {
    public constructor(
        public readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly window: WindowService,
        private readonly api: MainApiService,
        private readonly toolbar: ToolbarService,
        private readonly indexChange: IndexChangeService,
    ) {}

    @ViewChild('emptyToolbar', { read: TemplateRef })
    public emptyToolbar!: TemplateRef<unknown>;

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

    public readonly summary = this.indexChange.summary;

    public ngOnInit(): void {
        const params = this.window.getQueryParams();
        const id = params.get('id');
        if (id) {
            this.api
                .getDocument(id)
                .pipe(first())
                .subscribe(document => {
                    if (document) {
                        this.router.navigate(['/aas'], {
                            skipLocationChange: true,
                            queryParams: { id: document.id, endpoint: document.endpoint },
                        });
                    } else {
                        this.router.navigate(['/start'], { skipLocationChange: true });
                    }
                });
        } else {
            this.router.navigate(['/start'], { skipLocationChange: true });
        }
    }

    public clear(): void {
        this.indexChange.clear().subscribe();
    }

    public onKeyDown($event: KeyboardEvent): void {
        noop($event);
    }
}
