/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { EMPTY, Observable } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import {
    Component,
    OnDestroy,
    OnInit,
    TemplateRef,
    signal,
    ChangeDetectionStrategy,
    viewChild,
    effect,
} from '@angular/core';

import { Library } from 'aas-core';
import { IndexChangeService, LicenseInfoComponent, StartService, ToolbarService } from 'aas-lib';
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
    private readonly version$ = signal('');
    private readonly libraries$ = signal<Library[]>([]);

    public constructor(
        private api: AboutApiService,
        private toolbar: ToolbarService,
        private start: StartService,
        private readonly indexChange: IndexChangeService,
    ) {
        effect(() => {
            const template = this.toolbarTemplate();
            if (template) {
                this.toolbar.set(template);
            }
        });
    }

    public readonly toolbarTemplate = viewChild<TemplateRef<unknown>>('aboutToolbar');

    public readonly author = signal(environment.author).asReadonly();

    public readonly homepage = signal(environment.homepage).asReadonly();

    public readonly libraries = this.libraries$.asReadonly();

    public readonly endpoints = this.indexChange.endpointCount;

    public readonly shells = this.indexChange.documentCount;

    public ngOnInit(): void {
        this.api.getInfo().subscribe(info => {
            this.version$.set(info.version);
            this.libraries$.set(info.libraries ?? []);
        });
    }

    public ngOnDestroy(): void {
        this.toolbar.clear();
    }

    public addToStart(): Observable<void> {
        if (this.start.add('About', '395d511d-93ef-443a-b961-0ebdf7d2c55b', {})) {
            return this.start.save();
        }

        return EMPTY;
    }
}
