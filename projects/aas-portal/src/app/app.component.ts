/******************************************************************************
 *
 * Copyright (c) 2019-2026 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { Component, inject } from '@angular/core';
import { SessionCheck } from 'aas-lib';
import { MainComponent } from './main/main.component';

@Component({
    selector: 'fhg-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    imports: [MainComponent],
})
export class AppComponent {
    private readonly sessionCheck = inject(SessionCheck);
}
