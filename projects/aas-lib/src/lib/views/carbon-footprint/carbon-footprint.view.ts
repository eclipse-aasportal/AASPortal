/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
    selector: 'fhg-carbon-footprint',
    imports: [],
    templateUrl: './carbon-footprint.view.html',
    styleUrl: './carbon-footprint.view.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CarbonFootprintView {}
