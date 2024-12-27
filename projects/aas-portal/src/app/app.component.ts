/******************************************************************************
 *
 * Copyright (c) 2019-2024 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MainComponent } from './main/main.component';

@Component({
    selector: 'fhg-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    imports: [MainComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {}
