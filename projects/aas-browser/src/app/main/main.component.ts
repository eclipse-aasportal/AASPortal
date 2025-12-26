/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ChangeDetectionStrategy, Component, computed, OnInit, signal, inject } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgbNav, NgbNavItem, NgbNavLink } from '@ng-bootstrap/ng-bootstrap/nav';
import { NgbCollapse } from '@ng-bootstrap/ng-bootstrap/collapse';
import { AsyncPipe, NgTemplateOutlet } from '@angular/common';
import { WebSocketSubject } from 'rxjs/webSocket';
import { noop, WebSocketData } from 'aas-core';
import {
    CacheService,
    NotifyComponent,
    ProgressComponent,
    ToolbarService,
    WebSocketFactoryService,
    WINDOW,
} from 'aas-lib';

import { environment } from '../../environments/environment';
import { Stats } from '../types';

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
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainComponent implements OnInit {
    private readonly toolbar = inject(ToolbarService);
    private readonly window = inject(WINDOW);
    private readonly cache = inject(CacheService);

    private readonly subject: WebSocketSubject<WebSocketData>;
    private readonly stats$ = signal<Stats>({ packages: NaN, shells: NaN, submodels: NaN, conceptDescriptions: NaN });

    public constructor() {
        const factory = inject(WebSocketFactoryService);
        this.subject = factory.create();
        this.subject.pipe(takeUntilDestroyed()).subscribe(data => {
            if (data.type === 'stats') {
                this.stats$.set(data.data as Stats);
                this.cache.clear();
            }
        });
    }

    public readonly isMenuCollapsed = signal(true);

    public readonly links = signal<LinkDescriptor[]>([
        {
            id: LinkId.SHELLS,
            name: 'Shells',
            url: '/shells',
        },
        {
            id: LinkId.AAS,
            name: 'AAS',
            url: '/shells/:aasId',
        },
        {
            id: LinkId.CONCEPT_DESCRIPTIONS,
            name: 'Concept Descriptions',
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
        this.subject.next({ type: 'getStats', data: null });
    }

    public onKeyDown($event: KeyboardEvent): void {
        noop($event);
    }
}
