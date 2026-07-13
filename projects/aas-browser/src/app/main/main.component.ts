/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ChangeDetectionStrategy, Component, computed, OnInit, signal, inject, OnDestroy } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgbNav, NgbNavItem, NgbNavLink } from '@ng-bootstrap/ng-bootstrap/nav';
import { NgbCollapse } from '@ng-bootstrap/ng-bootstrap/collapse';
import { AsyncPipe, NgTemplateOutlet } from '@angular/common';
import { Subscription } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';
import { noop } from 'aas-core';
import { NotifyComponent, ProgressComponent, ToolbarService, WebSocketService, WINDOW } from 'aas-lib';

import { environment } from '../../environments/environment';
import { Stats } from '../types';
import { AuthComponent } from '../auth/auth.component';

export const enum LinkId {
    SHELLS,
    AAS,
    CONCEPT_DESCRIPTIONS,
    DOCS,
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
        NgTemplateOutlet,
        NgbNav,
        NgbNavItem,
        NgbNavLink,
        NgbCollapse,
        AsyncPipe,
        NotifyComponent,
        ProgressComponent,
        AuthComponent,
        TranslatePipe,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainComponent implements OnInit, OnDestroy {
    private readonly toolbar = inject(ToolbarService);
    private readonly window = inject(WINDOW);
    private readonly webSocket = inject(WebSocketService);

    private readonly subscription: Subscription;
    private readonly stats$ = signal<Stats>({ packages: NaN, shells: NaN, submodels: NaN, conceptDescriptions: NaN });

    public constructor() {
        this.subscription = this.webSocket.getMessages().subscribe(data => {
            if (data.type === 'stats') {
                this.stats$.set(data.data as Stats);
            }
        });
    }

    public readonly isMenuCollapsed = signal(true);

    public readonly links = signal<LinkDescriptor[]>([
        {
            id: LinkId.SHELLS,
            name: 'Main.SHELLS',
            url: '/shells',
        },
        {
            id: LinkId.AAS,
            name: 'Main.AAS',
            url: '/shells/:aasId',
        },
        {
            id: LinkId.CONCEPT_DESCRIPTIONS,
            name: 'Main.CONCEPT_DESCRIPTIONS',
            url: '/concept-descriptions',
        },
    ]).asReadonly();

    public readonly toolbarTemplate = this.toolbar.toolbarTemplate;

    public readonly route = inject(ActivatedRoute);

    public readonly version = signal(environment.version).asReadonly();

    public readonly year = signal(new Date().getFullYear()).asReadonly();

    public readonly docsUrl = computed(() => {
        const url = new URL(this.window.location.toString());
        url.pathname = '/docs/';
        return url;
    });

    public readonly stats = this.stats$.asReadonly();

    public ngOnInit(): void {
        this.webSocket.sendMessage({ type: 'getStats', data: null });
    }

    public ngOnDestroy(): void {
        this.subscription.unsubscribe();
        this.webSocket.closeConnection();
    }

    public onKeyDown($event: KeyboardEvent): void {
        noop($event);
    }
}
