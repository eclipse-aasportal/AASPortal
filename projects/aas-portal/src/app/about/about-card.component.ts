/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { IndexChange } from 'aas-lib';
import { environment } from '../../environments/environment';

@Component({
    selector: 'fhg-about-card',
    templateUrl: './about-card.component.html',
    styleUrl: './about-card.component.scss',
    standalone: true,
    imports: [TranslateModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutCardComponent {
    private readonly indexChange = inject(IndexChange);

    public readonly version = signal(environment.version).asReadonly();

    public readonly endpoints = this.indexChange.endpointCount;

    public readonly documents = this.indexChange.documentCount;
}
