/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MainComponent } from './main/main.component';

@Component({
    selector: 'fhg-app',
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
    imports: [MainComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {}
