/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Component } from '@angular/core';
import { MainComponent } from './main/main.component';

@Component({
    selector: 'fhg-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    imports: [MainComponent],
})
export class AppComponent {}
