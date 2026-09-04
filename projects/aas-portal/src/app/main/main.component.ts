/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgbCollapseModule, NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateDirective, TranslatePipe } from '@ngx-translate/core';
import { AsyncPipe, CommonModule, NgTemplateOutlet } from '@angular/common';
import { catchError, map, of } from 'rxjs';
import { noop } from 'aas-core';
import {
    AuthComponent,
    IndexChange,
    LocalizeComponent,
    NotifyComponent,
    ProgressComponent,
    ThemeToggleComponent,
    ToolbarService,
    SettingsComponent,
} from 'aas-lib';

import { environment } from '../../environments/environment';
import { AASState } from '../aas/aas.state';
import { ViewState } from '../view/view.state';

/**
 * Minimal shape of the runtime configuration written into `window.__env__` by config.js. See
 * theme.js for the equivalent mechanism used to make brand colors runtime-configurable.
 */
interface RuntimeEnv {
    COMPANY_URL?: string;
}

declare const window: Window & { __env__?: RuntimeEnv };

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
        CommonModule,
        RouterOutlet,
        RouterLink,
        RouterLinkActive,
        AsyncPipe,
        NgTemplateOutlet,
        NgbNavModule,
        NgbCollapseModule,
        TranslateDirective,
        TranslatePipe,
        NotifyComponent,
        LocalizeComponent,
        AuthComponent,
        ProgressComponent,
        ThemeToggleComponent,
        SettingsComponent,
    ],
})
export class MainComponent {
    protected readonly route = inject(ActivatedRoute);
    private readonly toolbar = inject(ToolbarService);
    private readonly indexChange = inject(IndexChange);
    private readonly http = inject(HttpClient);
    private readonly aasState = inject(AASState);
    private readonly viewState = inject(ViewState);

    public readonly toolbarTemplate = this.toolbar.toolbarTemplate;

    // The company logo's link target, configurable at runtime without a rebuild: the COMPANY_URL
    // environment variable (baked into config.js by the Docker entrypoint script, same mechanism as
    // THEME_PRIMARY_COLOR -- see theme.js) provides the initial value, and assets/theme-config.json's
    // "companyUrl" field -- fetched once here -- overrides it if present, matching the color theme's
    // "file wins over env var" precedence. Falls back to the built-in homepage if neither is set.
    private readonly envCompanyUrl = window.__env__?.COMPANY_URL || environment.homepage;

    public readonly companyUrl = toSignal(
        this.http.get<{ companyUrl?: string }>('assets/theme-config.json').pipe(
            map(config => config?.companyUrl || this.envCompanyUrl),
            catchError(() => of(this.envCompanyUrl)),
        ),
        { initialValue: this.envCompanyUrl },
    );

    public readonly links = signal<LinkDescriptor[]>([
        { id: LinkId.START, name: 'Main.START', url: '/start' },
        { id: LinkId.SHELLS, name: 'Main.SHELLS', url: '/shells' },
        { id: LinkId.AAS, name: 'Main.AAS', url: '/aas' },
        { id: LinkId.VIEW, name: 'Main.VIEW', url: '/views' },
        { id: LinkId.DASHBOARD, name: 'Main.DASHBOARD', url: '/dashboard' },
        { id: LinkId.ABOUT, name: 'Main.ABOUT', url: '/about' },
    ]).asReadonly();

    /** Whether the given nav link has no data behind it and should be disabled. */
    public readonly isDisabled = computed(() => {
        const noAAS = this.aasState.document() === null;
        const noView = this.viewState.activeView() === null;
        return (link: LinkDescriptor): boolean =>
            (link.id === LinkId.AAS && noAAS) || (link.id === LinkId.VIEW && noView);
    });

    public readonly languages = signal(['en-us', 'de-de']).asReadonly();

    public readonly version = signal(environment.version).asReadonly();

    public readonly endpointCount = this.indexChange.endpointCount;

    public readonly documentCount = this.indexChange.documentCount;

    public readonly changedDocuments = this.indexChange.changedDocuments;

    public readonly isMenuCollapsed = signal(true);

    public readonly year = signal(new Date().getFullYear());

    public reload(): void {
        this.indexChange.reload();
    }

    public onKeyDown($event: KeyboardEvent): void {
        noop($event);
    }
}
