/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import {
    Component,
    OnDestroy,
    OnInit,
    TemplateRef,
    signal,
    ChangeDetectionStrategy,
    viewChild,
    effect,
    input,
} from '@angular/core';

import { EMPTY, Observable } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { Library } from 'aas-core';
import { LicenseInfoComponent, StartService, ToolbarService } from 'aas-lib';
import { AboutApiService } from './about-api.service';
import { environment } from '../../environments/environment';

@Component({
    selector: 'fhg-about',
    templateUrl: './about.component.html',
    styleUrls: ['./about.component.scss'],
    imports: [TranslateModule, LicenseInfoComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutComponent implements OnInit, OnDestroy {
    private readonly _serverVersion = signal('');
    private readonly _libraries = signal<Library[]>([]);

    public constructor(
        private api: AboutApiService,
        private toolbar: ToolbarService,
        private start: StartService,
    ) {
        effect(() => {
            const visualState = this.visualState();
            const aboutToolbar = this.aboutToolbar();
            if (aboutToolbar && visualState === 'Page') {
                this.toolbar.set(aboutToolbar);
            }
        });
    }

    public readonly aboutToolbar = viewChild<TemplateRef<unknown>>('aboutToolbar');

    public readonly visualState = input<'Page'| 'Card'>('Page');

    public readonly author = signal(environment.author).asReadonly();

    public readonly homepage = signal(environment.homepage).asReadonly();

    public readonly libraries = this._libraries.asReadonly();

    public readonly endpoints = signal(42);

    public readonly shells = signal(42);

    public readonly submodels = signal(42);

    public readonly conceptDescriptions = signal(42);

    public ngOnInit(): void {
        this.api.getInfo().subscribe(info => {
            this._serverVersion.set(info.version);
            this._libraries.set(info.libraries ?? []);
        });
    }

    public ngOnDestroy(): void {
        this.toolbar.clear();
    }

    public addToStart(): Observable<void> {
        if (this.start.add('About', 'About', { visualState: 'Card' })) {
            return this.start.save();
        }

        return EMPTY;
    }
}
